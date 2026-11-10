import { useEffect, useRef, useState, type Dispatch, type RefObject, type SetStateAction } from 'react';
import confetti from 'canvas-confetti';
import type { GameRenderer } from '../lib/game/Renderer';
import { PhysicsEngine } from '../lib/game/Physics';
import type { PeerManager } from '../lib/network/PeerManager';
import type { AudioManager } from '../lib/audio/AudioManager';
import type { GameState, MoveInput } from '../types/game';
import type { CameraMode } from './useMatchReplay';

interface ArenaRuntimeOptions {
  stateRef: RefObject<GameState>;
  setGameState: Dispatch<SetStateAction<GameState>>;
  isHost: boolean;
  myId: string;
  audioEnabled: boolean;
  peerRef: RefObject<PeerManager | null>;
  audioRef: RefObject<AudioManager | null>;
  inputsRef: RefObject<Record<string, MoveInput>>;
  localInputRef: RefObject<MoveInput>;
  addGoal: () => void;
  addGame: (won: boolean) => void;
  replay: {
    isReplaying: boolean;
    currentTime: number;
    cameraMode: CameraMode;
    advance: (seconds: number) => void;
    synthesize: (time: number) => GameState | null;
    record: (state: GameState) => void;
  };
}

const STEP_SECONDS = 1 / 60;
const MAX_STEPS_PER_FRAME = 5;
const MOVE_SEND_INTERVAL_MS = 50;

export function useArenaRuntime(options: ArenaRuntimeOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<GameRenderer | null>(null);
  const optionsRef = useRef(options);
  const lastScoreRef = useRef({ team1: 0, team2: 0 });
  const lastVelocityRef = useRef<[number, number, number]>([0, 0, 0]);
  const bannerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [goalBanner, setGoalBanner] = useState<{ text: string; team: 1 | 2 } | null>(null);
  const [renderError, setRenderError] = useState('');
  optionsRef.current = options;

  useEffect(() => {
    let cancelled = false;
    // Keep the landing UI responsive while the Three.js engine loads.
    import('../lib/game/Renderer').then(({ GameRenderer }) => {
      if (cancelled || !containerRef.current) return;
      try {
        rendererRef.current = new GameRenderer(containerRef.current);
      } catch {
        containerRef.current.replaceChildren();
        setRenderError('3D rendering is unavailable in this browser. Try a browser with WebGL enabled.');
      }
    }).catch(() => {
      if (!cancelled) setRenderError('Could not load the 3D engine. Reload the page and try again.');
    });
    return () => {
      cancelled = true;
      rendererRef.current?.dispose();
      rendererRef.current = null;
      if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
    };
  }, []);

  useEffect(() => {
    let frameId = 0;
    let lastTime = performance.now();
    let accumulator = 0;
    let lastMoveSend = 0;
    let lastBroadcast = 0;
    let lastUiUpdate = 0;
    const renderScene = (state: GameState, myId: string, elapsed: number, mode?: CameraMode) => {
      const renderer = rendererRef.current;
      if (!renderer) return;
      try {
        renderer.update(state, myId, mode, elapsed);
        renderer.render();
      } catch {
        setRenderError('3D rendering stopped. Reload the page or enable WebGL in your browser.');
        rendererRef.current = null;
        try { renderer.dispose(); } catch { /* The WebGL context may already be lost. */ }
      }
    };
    const tick = (now: number) => {
      const elapsed = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;
      const current = optionsRef.current;
      let state = current.stateRef.current;

      if (current.replay.isReplaying) {
        current.replay.advance(elapsed);
        const replayState = current.replay.synthesize(current.replay.currentTime);
        if (replayState) renderScene(replayState, current.myId, elapsed, current.replay.cameraMode);
      } else {
        if (state.status === 'playing') {
          current.replay.record(state);
          if (current.peerRef.current && now - lastMoveSend >= MOVE_SEND_INTERVAL_MS) {
            current.peerRef.current.sendAction({ type: 'MOVE', input: { ...current.localInputRef.current } });
            lastMoveSend = now;
          }
        }

        if (current.isHost && state.status === 'playing') {
          accumulator += elapsed;
          let steps = 0;
          const previous = state;
          while (accumulator >= STEP_SECONDS && steps < MAX_STEPS_PER_FRAME && state.status === 'playing') {
            state = PhysicsEngine.update(state, current.inputsRef.current);
            accumulator -= STEP_SECONDS;
            steps++;
            if (state.score.team1 >= 5 || state.score.team2 >= 5) state.status = 'ended';
          }
          if (steps === MAX_STEPS_PER_FRAME) accumulator = 0;
          if (steps > 0) {
            if (state.score.team1 > previous.score.team1 || state.score.team2 > previous.score.team2) {
              const wonForHost = state.score.team1 > previous.score.team1
                ? previous.players[current.myId]?.team === 1
                : previous.players[current.myId]?.team === 2;
              if (wonForHost) current.addGoal();
            }
            if (state.status === 'ended' && previous.status === 'playing') {
              const hostTeam = state.players[current.myId]?.team;
              if (hostTeam) current.addGame((state.score.team1 >= 5) === (hostTeam === 1));
              confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: state.score.team1 >= 5 ? ['#06b6d4'] : ['#d946ef'] });
            }
            current.stateRef.current = state;
            if (now - lastUiUpdate >= MOVE_SEND_INTERVAL_MS || state.status === 'ended' ||
              state.score.team1 !== previous.score.team1 || state.score.team2 !== previous.score.team2) {
              current.setGameState(state);
              lastUiUpdate = now;
            }
            if (now - lastBroadcast >= MOVE_SEND_INTERVAL_MS || state.status === 'ended') {
              current.peerRef.current?.broadcastState(state);
              lastBroadcast = now;
            }
          }
        } else {
          accumulator = 0;
        }

        if (state.score.team1 > lastScoreRef.current.team1 || state.score.team2 > lastScoreRef.current.team2) {
          const cyanScored = state.score.team1 > lastScoreRef.current.team1;
          rendererRef.current?.triggerHighlight([0, 0, cyanScored ? -30 : 30], cyanScored ? 0x00ffff : 0xff00ff);
          setGoalBanner({ team: cyanScored ? 1 : 2, text: cyanScored ? 'TEAM CYAN SCORED!' : 'TEAM MAGENTA SCORED!' });
          if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
          bannerTimerRef.current = setTimeout(() => setGoalBanner(null), 2400);
          if ('vibrate' in navigator) navigator.vibrate([100, 50, 100]);
        }
        lastScoreRef.current = { ...state.score };

        const velocity = state.disc.velocity;
        const bounced = velocity.some((value, index) =>
          Math.sign(value) !== Math.sign(lastVelocityRef.current[index]) && Math.abs(value) > 0.01
        );
        if (bounced && 'vibrate' in navigator) navigator.vibrate(20);
        lastVelocityRef.current = [...velocity];

        renderScene(state, current.myId, elapsed);
        if (current.audioEnabled && current.audioRef.current) {
          current.audioRef.current.update(Math.hypot(...velocity), state.status);
        }
      }
      frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, []);

  return { containerRef, goalBanner, renderError };
}
