import React, { useEffect, useRef, useState, useCallback } from 'react';
import { PeerManager } from './lib/network/PeerManager';
import { applyGameAction } from './lib/game/actions';
import { createInitialGameState } from './lib/game/state';
import { useArenaAudio } from './hooks/useArenaAudio';
import { useCareerStats } from './hooks/useCareerStats';
import { useResponsive } from './hooks/useResponsive';
import { useFlightControls } from './hooks/useFlightControls';
import { useArenaRuntime } from './hooks/useArenaRuntime';
import { useMatchReplay } from './hooks/useMatchReplay';
import { AnimatePresence } from 'framer-motion';

import {
  GameState, GameAction, MoveInput, ChassisType, COLOR_PALETTE
} from './types/game';

import { CanvasContainer } from './components/game/CanvasContainer';
import { SoundToggle } from './components/ui/SoundToggle';
import { LandingOverlay } from './components/overlays/LandingOverlay';
import { LobbyOverlay } from './components/overlays/LobbyOverlay';
import { VictoryOverlay } from './components/overlays/VictoryOverlay';
import { CustomizerModal } from './components/overlays/CustomizerModal';
import { GameHud } from './components/hud/GameHud';
import { ReplayHud } from './components/hud/ReplayHud';

function parseRoomCode(value: string): string {
  const input = value.trim();
  try {
    return new URL(input).searchParams.get('room')?.trim() || input;
  } catch {
    return input;
  }
}

export default function App() {
  const [gameState, setGameState] = useState<GameState>(createInitialGameState);
  const [myId, setMyId] = useState('');
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
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [copiedRoomCode, setCopiedRoomCode] = useState(false);
  const [copyError, setCopyError] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState('');
  const [showControlsHud, setShowControlsHud] = useState(true);

  // Responsive device detection
  const { isTouch } = useResponsive();
  const { audioRef, audioEnabled, audioError, toggleAudio } = useArenaAudio();
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

  const peerRef = useRef<PeerManager | null>(null);
  const inputsRef = useRef<Record<string, MoveInput>>({});
  const gameStateRef = useRef(gameState);
  const sessionEpochRef = useRef(0);

  const handleAction = useCallback((action: GameAction, peerId: string) => {
    if (action.type === 'MOVE') {
      inputsRef.current[peerId] = action.input;
      return;
    }
    if (action.type === 'LEAVE') {
      delete inputsRef.current[peerId];
    }
    if (action.type === 'JOIN') {
      delete inputsRef.current[peerId];
    }
    const next = applyGameAction(gameStateRef.current, action, peerId);
    gameStateRef.current = next;
    setGameState(next);
  }, []);

  const createPeerManager = useCallback(() => {
    const peer = new PeerManager(
      (state) => {
        gameStateRef.current = state;
        setGameState(state);
      },
      (action, id) => handleAction(action, id),
      () => {
        sessionEpochRef.current++;
        setJoining(false);
        setIsJoined(false);
        setIsHost(false);
        const initial = createInitialGameState();
        gameStateRef.current = initial;
        setGameState(initial);
        setJoinError('The host disconnected. Ask for a new room code to rejoin.');
      }
    );
    peerRef.current = peer;
    peer.onOpen((id) => setMyId(id));
    return peer;
  }, [handleAction]);

  // Initialize Network & URL Parameter Detection
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const r = params.get('room');
      if (r) {
        setRoomCode(r);
      }
    }

    createPeerManager();

    return () => peerRef.current?.disconnect();
  }, [createPeerManager]);

  // Send lobby changes as players join or switch teams.
  useEffect(() => {
    if (isHost && gameState.status === 'lobby') {
      peerRef.current?.broadcastState(gameState);
    }
  }, [gameState, isHost]);

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

  const localInputRef = useFlightControls({
    enabled: isJoined && gameState.status === 'playing' && !isReplaying && !showCustomizer,
    isChatOpen,
    onThrow: triggerThrow,
    onToggleGuide: () => setShowControlsHud(value => !value),
    onOpenChat: (teamOnly) => {
      setTeamOnlyChat(teamOnly);
      setIsChatOpen(true);
    },
    onSendChat: sendChat,
    onCloseChat: () => setIsChatOpen(false),
  });

  const { containerRef, goalBanner, renderError } = useArenaRuntime({
    stateRef: gameStateRef,
    setGameState,
    isHost,
    myId,
    audioEnabled,
    peerRef,
    audioRef,
    inputsRef,
    localInputRef,
    addGoal,
    addGame,
    replay: {
      isReplaying,
      currentTime: currentReplayTime,
      cameraMode: replayCameraMode,
      advance: advanceReplayTime,
      synthesize: getSynthesizedGameState,
      record: recordFrame,
    },
  });

  const startHosting = async (name: string, color: string, shape: ChassisType, quickMatch: boolean) => {
    if (joining) return;
    const epoch = ++sessionEpochRef.current;
    setJoining(true);
    setJoinError('');
    if (!audioEnabled) await toggleAudio();
    const peer = peerRef.current;
    try {
      if (!peer) throw new Error('Network is not ready. Try again in a moment.');
      const id = await peer.ready();
      if (epoch !== sessionEpochRef.current) return;
      peer.host();
      setIsHost(true);
      setIsJoined(true);
      handleAction({ type: 'JOIN', name, color, shape }, id);
      if (quickMatch) {
        clearRecording();
        setTimeout(() => {
          if (epoch === sessionEpochRef.current) handleAction({ type: 'START_GAME' }, id);
        }, 150);
      }
    } catch (error) {
      if (epoch !== sessionEpochRef.current) return;
      setJoinError(error instanceof Error ? error.message : 'Could not start an arena.');
      if (peer && peerRef.current === peer) {
        peer.disconnect();
        createPeerManager();
      }
    } finally {
      if (epoch === sessionEpochRef.current) setJoining(false);
    }
  };

  const handleQuickMatch = async () => {
    const shapes: ChassisType[] = ['capsule', 'cube', 'sphere', 'octa'];
    const shape = shapes[Math.floor(Math.random() * shapes.length)];
    const color = COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)].hex;
    const name = playerName || `Pilot_${Math.floor(Math.random() * 900 + 100)}`;
    setAvatarShape(shape);
    setCustomColor(color);
    setPlayerName(name);
    await startHosting(name, color, shape, true);
  };

  const handleHost = () => startHosting(playerName, customColor, avatarShape, false);

  const handleJoin = async () => {
    const code = parseRoomCode(roomCode);
    if (!code || joining) return;
    if (code.includes('...')) {
      setJoinError('That room code is shortened. Ask the host to use Copy Code.');
      return;
    }
    if (/^https?:\/\//i.test(code)) {
      setJoinError('That invite link has no room code. Ask the host to copy a new link.');
      return;
    }
    setJoinError('');
    setJoining(true);
    const epoch = ++sessionEpochRef.current;
    if (!audioEnabled) await toggleAudio();
    const peer = peerRef.current;
    try {
      if (!peer) throw new Error('Network is not ready. Try again in a moment.');
      await peer.ready();
      if (epoch !== sessionEpochRef.current) return;
      await peer.join(code, { type: 'JOIN', name: playerName, color: customColor, shape: avatarShape });
      if (epoch !== sessionEpochRef.current) return;
      setRoomCode(code);
      setIsJoined(true);
    } catch (error) {
      if (epoch !== sessionEpochRef.current) return;
      setJoinError(
        error instanceof Error && 'type' in error && error.type === 'peer-unavailable'
          ? 'Room not found. Check the full code and make sure the host is still connected.'
          : error instanceof Error ? error.message : 'Could not connect to the arena.'
      );
      if (peer && peerRef.current === peer) {
        peer.disconnect();
        createPeerManager();
      }
    } finally {
      if (epoch === sessionEpochRef.current) setJoining(false);
    }
  };

  const handleLeave = () => {
    sessionEpochRef.current++;
    setJoining(false);
    setIsJoined(false);
    setIsHost(false);
    setJoinError('');
    const initial = createInitialGameState();
    gameStateRef.current = initial;
    setGameState(initial);
    inputsRef.current = {};
    peerRef.current?.disconnect();

    createPeerManager();
  };

  const handleCopyInvite = async () => {
    const code = isHost ? myId : parseRoomCode(roomCode);
    const inviteUrl = `${window.location.origin}${window.location.pathname}?room=${encodeURIComponent(code)}`;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopyError('');
      setCopiedInvite(true);
      setTimeout(() => setCopiedInvite(false), 2000);
    } catch {
      setCopyError('Clipboard unavailable. Select and copy the room code shown below.');
    }
  };

  const handleCopyRoomCode = async () => {
    const code = isHost ? myId : parseRoomCode(roomCode);
    try {
      await navigator.clipboard.writeText(code);
      setCopyError('');
      setCopiedRoomCode(true);
      setTimeout(() => setCopiedRoomCode(false), 2000);
    } catch {
      setCopyError('Clipboard unavailable. Select and copy the room code shown above.');
    }
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

  return (
    <div className="relative w-full h-screen h-dvh overflow-hidden bg-[#050505] text-white font-sans selection:bg-cyan-500/30">
      {/* 3D WebGL Canvas Layer */}
      <CanvasContainer containerRef={containerRef} />
      <div className="ambient-glow pointer-events-none absolute inset-0 z-0" />
      {(renderError || audioError) && <div role="alert" className="absolute top-[max(1rem,env(safe-area-inset-top))] left-4 z-50 max-w-[calc(100vw-2rem)] rounded-lg bg-red-950/90 p-3 text-sm text-red-100">{renderError || audioError}</div>}

      {/* Global Ambient Audio Toggle */}
      <div className={isJoined && (gameState.status === 'playing' || isReplaying)
        ? 'absolute top-[calc(5.5rem+env(safe-area-inset-top))] left-1/2 z-30 -translate-x-1/2 pointer-events-auto sm:top-6'
        : 'absolute top-[max(1rem,env(safe-area-inset-top))] right-[max(1rem,env(safe-area-inset-right))] z-30 pointer-events-auto'}>
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
            onChangeRoomCode={(value) => {
              setRoomCode(value);
              setJoinError('');
            }}
            careerStats={stats}
            rankInfo={rankInfo}
            winRate={winRate}
            onQuickMatch={handleQuickMatch}
            onHost={handleHost}
            onJoin={handleJoin}
            joining={joining}
            joinError={joinError}
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
            copiedRoomCode={copiedRoomCode}
            copyError={copyError}
            roomCode={isHost ? myId : parseRoomCode(roomCode)}
            onCopyInvite={handleCopyInvite}
            onCopyRoomCode={handleCopyRoomCode}
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
          onSendChat={sendChat}
          onCloseChat={() => setIsChatOpen(false)}
          onChangeTeamOnlyChat={setTeamOnlyChat}
          onOpenChat={() => {
            Object.assign(localInputRef.current, { x: 0, y: 0, z: 0 });
            setTeamOnlyChat(false);
            setIsChatOpen(true);
          }}
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
