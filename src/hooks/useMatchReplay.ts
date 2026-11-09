import { useState, useRef, useCallback } from 'react';
import { GameState, ReplayFrame, ReplayPlayerFrame, DEFAULT_LIGHT_PROBES } from '../types/game';

export type CameraMode = 'orbit' | 'disc' | 'player';

export function useMatchReplay() {
  const recordingBufferRef = useRef<ReplayFrame[]>([]);
  const frameCountRef = useRef<number>(0);

  const [replayFrames, setReplayFrames] = useState<ReplayFrame[]>([]);
  const [isReplaying, setIsReplaying] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [currentReplayTime, setCurrentReplayTime] = useState<number>(0);
  const [cameraMode, setCameraMode] = useState<CameraMode>('disc');

  // Record a snapshot of the current match frame
  const recordFrame = useCallback((state: GameState) => {
    if (state.status !== 'playing') return;

    frameCountRef.current += 1;
    // Record at 30 FPS (every 2 frames at 60 FPS) for memory efficiency & performance
    if (frameCountRef.current % 2 !== 0) return;

    const playersSnapshot: Record<string, ReplayPlayerFrame> = {};
    for (const id in state.players) {
      const p = state.players[id];
      if (p && !p.isSpectator) {
        playersSnapshot[id] = {
          id: p.id,
          name: p.name,
          team: p.team,
          position: [...p.position] as [number, number, number],
          avatarShape: p.avatarShape,
          customColor: p.customColor,
        };
      }
    }

    const frame: ReplayFrame = {
      time: state.time,
      discPosition: [...state.disc.position] as [number, number, number],
      discVelocity: [...state.disc.velocity] as [number, number, number],
      players: playersSnapshot,
      score: { ...state.score },
    };

    recordingBufferRef.current.push(frame);
  }, []);

  const clearRecording = useCallback(() => {
    recordingBufferRef.current = [];
    frameCountRef.current = 0;
    setReplayFrames([]);
    setIsReplaying(false);
    setCurrentReplayTime(0);
  }, []);

  const prepareReplay = useCallback(() => {
    const frames = [...recordingBufferRef.current];
    setReplayFrames(frames);
    return frames.length > 0;
  }, []);

  const startReplay = useCallback(() => {
    if (recordingBufferRef.current.length === 0) return false;
    const frames = [...recordingBufferRef.current];
    setReplayFrames(frames);
    setIsReplaying(true);
    setIsPlaying(true);
    setCurrentReplayTime(frames[0]?.time || 0);
    return true;
  }, []);

  const stopReplay = useCallback(() => {
    setIsReplaying(false);
    setIsPlaying(false);
  }, []);

  const togglePlayPause = useCallback(() => {
    setIsPlaying(prev => !prev);
  }, []);

  const seekToTime = useCallback((time: number) => {
    if (replayFrames.length === 0) return;
    const startTime = replayFrames[0].time;
    const endTime = replayFrames[replayFrames.length - 1].time;
    const clamped = Math.max(startTime, Math.min(endTime, time));
    setCurrentReplayTime(clamped);
  }, [replayFrames]);

  const advanceReplayTime = useCallback((deltaSeconds: number) => {
    if (!isReplaying || !isPlaying || replayFrames.length === 0) return;

    const startTime = replayFrames[0].time;
    const endTime = replayFrames[replayFrames.length - 1].time;

    setCurrentReplayTime(prev => {
      const next = prev + deltaSeconds * playbackSpeed;
      if (next >= endTime) {
        setIsPlaying(false); // Pause at end of replay
        return endTime;
      }
      return next;
    });
  }, [isReplaying, isPlaying, playbackSpeed, replayFrames]);

  // Construct a interpolated GameState for the given replay timestamp
  const getSynthesizedGameState = useCallback((timestamp: number): GameState | null => {
    if (replayFrames.length === 0) return null;

    const startTime = replayFrames[0].time;
    const endTime = replayFrames[replayFrames.length - 1].time;
    const clampedTime = Math.max(startTime, Math.min(endTime, timestamp));

    // Find bounding frames
    let prevFrame = replayFrames[0];
    let nextFrame = replayFrames[replayFrames.length - 1];

    for (let i = 0; i < replayFrames.length - 1; i++) {
      if (replayFrames[i].time <= clampedTime && replayFrames[i + 1].time >= clampedTime) {
        prevFrame = replayFrames[i];
        nextFrame = replayFrames[i + 1];
        break;
      }
    }

    const duration = nextFrame.time - prevFrame.time;
    const alpha = duration > 0 ? (clampedTime - prevFrame.time) / duration : 0;

    // Lerp disc position
    const discPos: [number, number, number] = [
      prevFrame.discPosition[0] + (nextFrame.discPosition[0] - prevFrame.discPosition[0]) * alpha,
      prevFrame.discPosition[1] + (nextFrame.discPosition[1] - prevFrame.discPosition[1]) * alpha,
      prevFrame.discPosition[2] + (nextFrame.discPosition[2] - prevFrame.discPosition[2]) * alpha,
    ];

    // Lerp player positions
    const interpolatedPlayers: Record<string, any> = {};
    const allPlayerIds = new Set([
      ...Object.keys(prevFrame.players),
      ...Object.keys(nextFrame.players),
    ]);

    allPlayerIds.forEach(id => {
      const pPrev = prevFrame.players[id];
      const pNext = nextFrame.players[id];

      if (pPrev && pNext) {
        interpolatedPlayers[id] = {
          id: pPrev.id,
          name: pPrev.name,
          team: pPrev.team,
          position: [
            pPrev.position[0] + (pNext.position[0] - pPrev.position[0]) * alpha,
            pPrev.position[1] + (pNext.position[1] - pPrev.position[1]) * alpha,
            pPrev.position[2] + (pNext.position[2] - pPrev.position[2]) * alpha,
          ],
          rotation: [0, 0, 0],
          ready: true,
          isSpectator: false,
          effects: [],
          avatarShape: pPrev.avatarShape || 'capsule',
          customColor: pPrev.customColor || '#06b6d4',
        };
      } else if (pNext) {
        interpolatedPlayers[id] = {
          id: pNext.id,
          name: pNext.name,
          team: pNext.team,
          position: [...pNext.position],
          rotation: [0, 0, 0],
          ready: true,
          isSpectator: false,
          effects: [],
          avatarShape: pNext.avatarShape || 'capsule',
          customColor: pNext.customColor || '#06b6d4',
        };
      }
    });

    return {
      players: interpolatedPlayers,
      disc: {
        position: discPos,
        velocity: prevFrame.discVelocity,
        ownerId: null,
      },
      score: prevFrame.score,
      time: clampedTime,
      status: 'playing',
      messages: [],
      powerUps: [],
      lightProbes: DEFAULT_LIGHT_PROBES,
    };
  }, [replayFrames]);

  const maxReplayTime = replayFrames.length > 0 ? replayFrames[replayFrames.length - 1].time : 0;
  const minReplayTime = replayFrames.length > 0 ? replayFrames[0].time : 0;

  return {
    isReplaying,
    isPlaying,
    playbackSpeed,
    currentReplayTime,
    minReplayTime,
    maxReplayTime,
    cameraMode,
    frameCount: recordingBufferRef.current.length,
    hasReplayData: recordingBufferRef.current.length > 0,
    recordFrame,
    clearRecording,
    prepareReplay,
    startReplay,
    stopReplay,
    togglePlayPause,
    setSpeed: setPlaybackSpeed,
    setCameraMode,
    seekToTime,
    advanceReplayTime,
    getSynthesizedGameState,
  };
}
