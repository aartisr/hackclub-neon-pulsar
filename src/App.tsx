import React, { useEffect, useRef, useState, useCallback } from 'react';
import { PeerManager, GameAction } from './lib/network/PeerManager';
import { GameRenderer } from './lib/game/Renderer';
import { PhysicsEngine } from './lib/game/Physics';
import { AudioManager } from './lib/audio/AudioManager';
import { useCareerStats } from './hooks/useCareerStats';
import { useResponsive } from './hooks/useResponsive';
import { useMatchReplay } from './hooks/useMatchReplay';
import { AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

import { 
  GameState, ChassisType, INITIAL_GAME_STATE, COLOR_PALETTE 
} from './types/game';

import { CanvasContainer } from './components/game/CanvasContainer';
import { SoundToggle } from './components/ui/SoundToggle';
import { LandingOverlay } from './components/overlays/LandingOverlay';
import { LobbyOverlay } from './components/overlays/LobbyOverlay';
import { VictoryOverlay } from './components/overlays/VictoryOverlay';
import { CustomizerModal } from './components/overlays/CustomizerModal';
import { GameHud } from './components/hud/GameHud';
import { ReplayHud } from './components/hud/ReplayHud';

export default function App() {
  const [gameState, setGameState] = useState<GameState>(INITIAL_GAME_STATE);
  const [myId, setMyId] = useState<string>(() => `pilot_${Math.random().toString(36).substring(2, 9)}`);
  const [roomCode, setRoomCode] = useState<string>('');
  const [isJoined, setIsJoined] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [playerName, setPlayerName] = useState(() => `Pilot_${Math.floor(Math.random() * 900 + 100)}`);
  
  // Tactical chat state
  const [chatInput, setChatInput] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [teamOnlyChat, setTeamOnlyChat] = useState(false);

  // Customizer state
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [customColor, setCustomColor] = useState('#06b6d4');
  const [avatarShape, setAvatarShape] = useState<ChassisType>('capsule');

  // HUD & Audio state
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [showControlsHud, setShowControlsHud] = useState(true);
  const [goalBanner, setGoalBanner] = useState<{ text: string; team: 1 | 2 } | null>(null);

  // Responsive device detection
  const { isTouch } = useResponsive();
  const { stats, rankInfo, winRate, addGoal, addGame } = useCareerStats();

  // Match Replay System
  const {
    isReplaying,
    isPlaying: isReplayPlaying,
    playbackSpeed: replayPlaybackSpeed,
    currentReplayTime,
    minReplayTime,
    maxReplayTime,
    cameraMode: replayCameraMode,
    hasReplayData,
    recordFrame,
    clearRecording,
    startReplay,
    stopReplay,
    togglePlayPause: toggleReplayPlayPause,
    setSpeed: setReplaySpeed,
    setCameraMode: setReplayCameraMode,
    seekToTime: seekReplayToTime,
    advanceReplayTime,
    getSynthesizedGameState,
  } = useMatchReplay();

  const isReplayingRef = useRef(isReplaying);
  const currentReplayTimeRef = useRef(currentReplayTime);
  const replayCameraModeRef = useRef(replayCameraMode);

  useEffect(() => {
    isReplayingRef.current = isReplaying;
  }, [isReplaying]);

  useEffect(() => {
    currentReplayTimeRef.current = currentReplayTime;
  }, [currentReplayTime]);

  useEffect(() => {
    replayCameraModeRef.current = replayCameraMode;
  }, [replayCameraMode]);

  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<GameRenderer | null>(null);
  const peerRef = useRef<PeerManager | null>(null);
  const audioRef = useRef<AudioManager | null>(null);
  const inputsRef = useRef<Record<string, any>>({});
  const localInputRef = useRef({ x: 0, y: 0, z: 0, jump: false, dash: false });

  const lastScoreRef = useRef({ team1: 0, team2: 0 });
  const lastVelocityRef = useRef<[number, number, number]>([0, 0, 0]);
  const stateRef = useRef(gameState);

  useEffect(() => {
    stateRef.current = gameState;
  }, [gameState]);

  // Handle network actions received or triggered
  const handleAction = useCallback((action: GameAction, peerId: string) => {
    if (!isHost) return;

    setGameState((prev) => {
      const next = { ...prev };
      switch (action.type) {
        case 'JOIN': {
          const id = peerId || `temp-${Math.random()}`;
          const team1Count = Object.values(next.players).filter(p => p.team === 1).length;
          const team2Count = Object.values(next.players).filter(p => p.team === 2).length;
          const assignedTeam: 1 | 2 = team1Count <= team2Count ? 1 : 2;

          next.players[id] = {
            id,
            name: action.name || 'Unknown Pilot',
            position: [0, 0, assignedTeam === 1 ? 25 : -25],
            rotation: [0, 0, 0],
            team: assignedTeam,
            ready: false,
            isSpectator: next.status === 'playing',
            effects: [],
            customColor: action.color,
            avatarShape: action.shape || 'capsule',
          };
          break;
        }
        case 'SWITCH_TEAM': {
          if (next.players[peerId]) {
            next.players[peerId].team = action.team;
            next.players[peerId].position[2] = action.team === 1 ? 25 : -25;
          }
          break;
        }
        case 'READY':
          if (next.players[peerId]) {
            next.players[peerId].ready = action.ready;
          }
          break;
        case 'MOVE':
          inputsRef.current[peerId] = action.input;
          break;
        case 'THROW': {
          if (next.disc.ownerId === peerId) {
            const thrower = next.players[peerId];
            next.disc.ownerId = null;
            const throwDirZ = thrower?.team === 1 ? -1.8 : 1.8;
            next.disc.velocity = [
              action.direction?.[0] ? action.direction[0] * 1.8 : (Math.random() - 0.5) * 0.2,
              action.direction?.[1] ? action.direction[1] * 1.8 : 0.05,
              action.direction?.[2] ? action.direction[2] * 1.8 : throwDirZ,
            ];
          }
          break;
        }
        case 'CHAT': {
          const sender = next.players[peerId];
          if (sender) {
            next.messages = [
              ...next.messages.slice(-9),
              {
                id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                senderId: peerId,
                senderName: sender.name,
                text: action.text,
                team: sender.team,
                teamOnly: action.teamOnly,
                timestamp: Date.now(),
              }
            ];
          }
          break;
        }
        case 'CUSTOMIZE':
          if (next.players[peerId]) {
            next.players[peerId].customColor = action.color;
            next.players[peerId].avatarShape = action.shape;
          }
          break;
        case 'START_GAME':
          next.status = 'playing';
          Object.values(next.players).forEach(p => {
            p.isSpectator = false;
            p.effects = [];
          });
          next.powerUps = [];
          PhysicsEngine.resetDisc(next, true);
          lastScoreRef.current = { team1: 0, team2: 0 };
          break;
      }
      return next;
    });
  }, [isHost]);

  // Initialize Network & URL Parameter Detection
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const r = params.get('room');
      if (r) {
        setRoomCode(r);
      }
    }

    const peer = new PeerManager(
      (state) => setGameState(state),
      (action, id) => handleAction(action, id)
    );
    peerRef.current = peer;

    peer.onOpen((id) => setMyId(id));

    return () => {
      peer.disconnect();
    };
  }, [handleAction]);

  // Initialize 3D WebGL Renderer immediately on mount
  useEffect(() => {
    if (containerRef.current && !rendererRef.current) {
      rendererRef.current = new GameRenderer(containerRef.current);
    }
    return () => {
      rendererRef.current?.dispose();
      rendererRef.current = null;
    };
  }, []);

  // Keyboard controls
  const triggerThrow = useCallback(() => {
    const localPlayer = gameState.players[myId];
    const throwDirZ = localPlayer?.team === 1 ? -1 : 1;
    peerRef.current?.sendAction({ type: 'THROW', direction: [0, 0, throwDirZ] });
  }, [gameState.players, myId]);

  const sendChat = useCallback(() => {
    if (!chatInput.trim()) {
      setIsChatOpen(false);
      return;
    }
    peerRef.current?.sendAction({ 
      type: 'CHAT', 
      text: chatInput.trim(), 
      teamOnly: teamOnlyChat 
    });
    setChatInput('');
    setIsChatOpen(false);
  }, [chatInput, teamOnlyChat]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isChatOpen && e.key !== 'Escape' && e.key !== 'Enter') return;

      const input = localInputRef.current;
      if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') input.z = -1;
      if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') input.z = 1;
      if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') input.x = -1;
      if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') input.x = 1;
      if (e.key === ' ') input.y = 1;
      if (e.key === 'Shift') input.y = -1;
      
      if (e.key === 'e' || e.key === 'E') {
        triggerThrow();
      }
      if ((e.key === 'h' || e.key === 'H') && !isChatOpen) {
        setShowControlsHud(prev => !prev);
      }
      if ((e.key === 't' || e.key === 'T') && !isChatOpen) {
        e.preventDefault();
        setIsChatOpen(true);
        setTeamOnlyChat(false);
      }
      if ((e.key === 'y' || e.key === 'Y') && !isChatOpen) {
        e.preventDefault();
        setIsChatOpen(true);
        setTeamOnlyChat(true);
      }
      if (e.key === 'Enter' && isChatOpen) {
        sendChat();
      }
      if (e.key === 'Escape' && isChatOpen) {
        setIsChatOpen(false);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const input = localInputRef.current;
      if (['w', 'W', 's', 'S', 'ArrowUp', 'ArrowDown'].includes(e.key)) input.z = 0;
      if (['a', 'A', 'd', 'D', 'ArrowLeft', 'ArrowRight'].includes(e.key)) input.x = 0;
      if (e.key === ' ') input.y = 0;
      if (e.key === 'Shift') input.y = 0;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isChatOpen, triggerThrow, sendChat]);

  // Authoritative Physics & Tick Loop
  useEffect(() => {
    let frameId: number;
    const tick = () => {
      const currentState = stateRef.current;
      
      if (isReplayingRef.current) {
        advanceReplayTime(1 / 60);
        const synthState = getSynthesizedGameState(currentReplayTimeRef.current);
        if (synthState && rendererRef.current) {
          rendererRef.current.update(synthState, myId, replayCameraModeRef.current);
          rendererRef.current.render();
        }
      } else {
        if (currentState.status === 'playing') {
          recordFrame(currentState);
        }

        if (peerRef.current) {
          peerRef.current.sendAction({ type: 'MOVE', input: localInputRef.current });

          if (isHost && currentState.status === 'playing') {
            const nextState = PhysicsEngine.update(currentState, inputsRef.current);
            
            // Detect score change
            if (nextState.score.team1 > currentState.score.team1 || nextState.score.team2 > currentState.score.team2) {
              const scoredTeam1 = nextState.score.team1 > currentState.score.team1;
              const localPlayer = nextState.players[myId];
              if (localPlayer) {
                if ((scoredTeam1 && localPlayer.team === 1) || (!scoredTeam1 && localPlayer.team === 2)) {
                  addGoal();
                }
              }
            }

            // Victory condition check
            if (nextState.score.team1 >= 5 || nextState.score.team2 >= 5) {
              nextState.status = 'ended';
              
              const localPlayer = nextState.players[myId];
              if (localPlayer) {
                const team1Won = nextState.score.team1 >= 5;
                const won = (team1Won && localPlayer.team === 1) || (!team1Won && localPlayer.team === 2);
                addGame(won);
              }

              confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: nextState.score.team1 >= 5 ? ['#06b6d4'] : ['#d946ef']
              });
            }

            setGameState(nextState);
            peerRef.current.broadcastState(nextState);
          }
        }

        // Detect score change and trigger highlight + haptics + announcement banner
        if (currentState.score.team1 !== lastScoreRef.current.team1 || currentState.score.team2 !== lastScoreRef.current.team2) {
          const isTeam1 = currentState.score.team1 > lastScoreRef.current.team1;
          if (rendererRef.current) {
            const targetZ = isTeam1 ? -30 : 30; 
            rendererRef.current.triggerHighlight([0, 0, targetZ], isTeam1 ? 0x00ffff : 0xff00ff);
          }

          setGoalBanner({
            team: isTeam1 ? 1 : 2,
            text: isTeam1 ? 'TEAM CYAN SCORED!' : 'TEAM MAGENTA SCORED!'
          });
          setTimeout(() => setGoalBanner(null), 2400);

          if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            navigator.vibrate([100, 50, 100]);
          }

          lastScoreRef.current = { ...currentState.score };
        }

        // Detect disc wall collision
        const currentV = currentState.disc.velocity;
        const lastV = lastVelocityRef.current;
        const xBounce = Math.sign(currentV[0]) !== Math.sign(lastV[0]) && Math.abs(currentV[0]) > 0.01;
        const yBounce = Math.sign(currentV[1]) !== Math.sign(lastV[1]) && Math.abs(currentV[1]) > 0.01;
        const zBounce = Math.sign(currentV[2]) !== Math.sign(lastV[2]) && Math.abs(currentV[2]) > 0.01;

        if (xBounce || yBounce || zBounce) {
          if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            navigator.vibrate(20);
          }
        }
        lastVelocityRef.current = [...currentV] as [number, number, number];

        if (rendererRef.current) {
          rendererRef.current.update(currentState, myId);
          rendererRef.current.render();
        }

        if (audioRef.current && audioEnabled) {
          const v = currentState.disc.velocity;
          const speed = Math.sqrt(v[0] ** 2 + v[1] ** 2 + v[2] ** 2);
          audioRef.current.update(speed, currentState.status);
        }
      }

      frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [isHost, myId, audioEnabled, addGoal, addGame, advanceReplayTime, getSynthesizedGameState, recordFrame]);

  // Matchmaking Actions
  const handleQuickMatch = async () => {
    if (!audioEnabled) await toggleAudio();

    const randomShapes: ChassisType[] = ['capsule', 'cube', 'sphere', 'octa'];
    const chosenShape = randomShapes[Math.floor(Math.random() * randomShapes.length)];
    const chosenColor = COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)].hex;
    const quickCallsign = playerName || `Pilot_${Math.floor(Math.random() * 900 + 100)}`;

    setAvatarShape(chosenShape);
    setCustomColor(chosenColor);
    setPlayerName(quickCallsign);

    setIsHost(true);
    peerRef.current?.host();
    setIsJoined(true);
    clearRecording();

    handleAction({ type: 'JOIN', name: quickCallsign, color: chosenColor, shape: chosenShape }, myId);

    setTimeout(() => {
      handleAction({ type: 'START_GAME' }, myId);
    }, 150);
  };

  const handleHost = async () => {
    if (!audioEnabled) await toggleAudio();
    setIsHost(true);
    peerRef.current?.host();
    setIsJoined(true);
    handleAction({ type: 'JOIN', name: playerName, color: customColor, shape: avatarShape }, myId);
  };

  const handleJoin = async () => {
    if (!roomCode || roomCode === 'JOIN_MODE') return;
    if (!audioEnabled) await toggleAudio();
    peerRef.current?.join(roomCode);
    setIsJoined(true);
    setTimeout(() => {
      peerRef.current?.sendAction({ type: 'JOIN', name: playerName, color: customColor, shape: avatarShape });
    }, 1000);
  };

  const handleLeave = () => {
    setIsJoined(false);
    setIsHost(false);
    setGameState(INITIAL_GAME_STATE);
    inputsRef.current = {};
    peerRef.current?.disconnect();
    
    const peer = new PeerManager(
      (state) => setGameState(state),
      (action, id) => handleAction(action, id)
    );
    peerRef.current = peer;
    peer.onOpen((id) => setMyId(id));
  };

  const handleCopyInvite = () => {
    const code = isHost ? myId : (roomCode || myId);
    const inviteUrl = `${window.location.origin}${window.location.pathname}?room=${code}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 2000);
  };

  const handleSwitchTeam = (team: 1 | 2) => {
    if (isHost) {
      handleAction({ type: 'SWITCH_TEAM', team }, myId);
    } else {
      peerRef.current?.sendAction({ type: 'SWITCH_TEAM', team });
    }
  };

  const handleStartGame = () => {
    clearRecording();
    if (isHost) {
      handleAction({ type: 'START_GAME' }, myId);
    }
  };

  const toggleAudio = async () => {
    if (!audioRef.current) {
      audioRef.current = new AudioManager();
      await audioRef.current.init();
      setAudioEnabled(true);
      return;
    }
    const next = !audioEnabled;
    audioRef.current.setMuted(!next);
    setAudioEnabled(next);
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#050505] text-white font-sans selection:bg-cyan-500/30">
      {/* 3D WebGL Canvas Layer */}
      <CanvasContainer containerRef={containerRef} />

      {/* Global Ambient Audio Toggle */}
      <div className="absolute top-4 sm:top-6 right-4 sm:right-6 z-30 pointer-events-auto">
        <SoundToggle 
          enabled={audioEnabled} 
          onToggle={toggleAudio} 
        />
      </div>

      {/* Screen Transitions */}
      <AnimatePresence mode="wait">
        {/* 1. Landing Screen */}
        {!isJoined && (
          <LandingOverlay
            playerName={playerName}
            onChangePlayerName={setPlayerName}
            avatarShape={avatarShape}
            onChangeShape={setAvatarShape}
            customColor={customColor}
            onChangeColor={setCustomColor}
            roomCode={roomCode}
            onChangeRoomCode={setRoomCode}
            careerStats={stats}
            rankInfo={rankInfo}
            winRate={winRate}
            onQuickMatch={handleQuickMatch}
            onHost={handleHost}
            onJoin={handleJoin}
          />
        )}

        {/* 2. Combat Lobby Screen */}
        {isJoined && gameState.status === 'lobby' && (
          <LobbyOverlay
            gameState={gameState}
            myId={myId}
            isHost={isHost}
            playerName={playerName}
            customColor={customColor}
            avatarShape={avatarShape}
            copiedInvite={copiedInvite}
            onCopyInvite={handleCopyInvite}
            onLeave={handleLeave}
            onOpenCustomizer={() => setShowCustomizer(true)}
            onSwitchTeam={handleSwitchTeam}
            onStartGame={handleStartGame}
          />
        )}

        {/* 3. Victory Post-Match Screen */}
        {isJoined && gameState.status === 'ended' && !isReplaying && (
          <VictoryOverlay
            gameState={gameState}
            isHost={isHost}
            hasReplay={hasReplayData}
            onWatchReplay={startReplay}
            onRematch={handleStartGame}
            onLeave={handleLeave}
          />
        )}
      </AnimatePresence>

      {/* 4. Avatar Customization Modal */}
      <CustomizerModal
        isOpen={showCustomizer}
        onClose={() => setShowCustomizer(false)}
        customColor={customColor}
        avatarShape={avatarShape}
        onSelectColor={(c) => {
          setCustomColor(c);
          peerRef.current?.sendAction({ type: 'CUSTOMIZE', color: c, shape: avatarShape });
        }}
        onSelectShape={(s) => {
          setAvatarShape(s);
          peerRef.current?.sendAction({ type: 'CUSTOMIZE', color: customColor, shape: s });
        }}
      />

      {/* 5. Active Match HUD */}
      {isJoined && gameState.status === 'playing' && !isReplaying && (
        <GameHud
          gameState={gameState}
          myId={myId}
          isTouch={isTouch}
          showControlsHud={showControlsHud}
          goalBanner={goalBanner}
          isChatOpen={isChatOpen}
          teamOnlyChat={teamOnlyChat}
          chatInput={chatInput}
          onLeaveMatch={handleLeave}
          onToggleControlsHud={() => setShowControlsHud(prev => !prev)}
          onChangeChatInput={setChatInput}
          onMoveDirection={(axis, val) => {
            localInputRef.current[axis] = val;
          }}
          onAltitude={(val) => {
            localInputRef.current.y = val;
          }}
          onThrow={triggerThrow}
        />
      )}

      {/* 6. 3D Match Replay Control HUD */}
      <ReplayHud
        isReplaying={isReplaying}
        isPlaying={isReplayPlaying}
        playbackSpeed={replayPlaybackSpeed}
        currentTime={currentReplayTime}
        minTime={minReplayTime}
        maxTime={maxReplayTime}
        cameraMode={replayCameraMode}
        onTogglePlayPause={toggleReplayPlayPause}
        onSetSpeed={setReplaySpeed}
        onSeekToTime={seekReplayToTime}
        onSetCameraMode={setReplayCameraMode}
        onExitReplay={stopReplay}
      />
    </div>
  );
}
