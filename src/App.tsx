import React, { useEffect, useRef, useState } from 'react';
import { PeerManager, GameState, GameAction, PlayerState } from './lib/network/PeerManager';
import { GameRenderer } from './lib/game/Renderer';
import { PhysicsEngine } from './lib/game/Physics';
import { AudioManager } from './lib/audio/AudioManager';
import { useCareerStats } from './hooks/useCareerStats';
import { 
  LucideGamepad2, LucideUsers, LucideShare2, LucideCheck, LucidePlay, 
  LucideCopy, LucideVolume2, LucideVolumeX, LucideTrophy, LucideHelpCircle,
  LucideChevronDown, LucideChevronUp, LucideLogOut, LucideSparkles,
  LucideEye, LucideShield, LucideZap, LucideArrowUp, LucideArrowDown,
  LucideArrowLeft, LucideArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import confetti from 'canvas-confetti';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const INITIAL_STATE: GameState = {
  players: {},
  disc: { position: [0, 0, 0], velocity: [0, 0, 0], ownerId: null },
  score: { team1: 0, team2: 0 },
  time: 0,
  status: 'lobby',
  messages: [],
  powerUps: [],
};

const COLOR_PALETTE = [
  { hex: '#06b6d4', name: 'Cyan Pulsar' },
  { hex: '#d946ef', name: 'Magenta Nova' },
  { hex: '#10b981', name: 'Emerald Flux' },
  { hex: '#f59e0b', name: 'Amber Core' },
  { hex: '#ef4444', name: 'Crimson Surge' },
  { hex: '#ffffff', name: 'Radiant White' },
];

const CHASSIS_TYPES: Array<{ id: 'capsule' | 'cube' | 'sphere' | 'octa'; label: string; desc: string }> = [
  { id: 'capsule', label: 'Capsule', desc: 'Aerodynamic Zero-G' },
  { id: 'cube', label: 'Cube', desc: 'Reinforced Bulkhead' },
  { id: 'sphere', label: 'Sphere', desc: 'Isotropic Kinetic' },
  { id: 'octa', label: 'Octa', desc: 'Crystalline Interceptor' },
];

export default function App() {
  const [gameState, setGameState] = useState<GameState>(INITIAL_STATE);
  const [myId, setMyId] = useState<string>(() => `pilot_${Math.random().toString(36).substring(2, 9)}`);
  const [roomCode, setRoomCode] = useState<string>('');
  const [isJoined, setIsJoined] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [playerName, setPlayerName] = useState(() => `Pilot_${Math.floor(Math.random() * 900 + 100)}`);
  const [chatInput, setChatInput] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [teamOnlyChat, setTeamOnlyChat] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [customColor, setCustomColor] = useState('#06b6d4');
  const [avatarShape, setAvatarShape] = useState<'capsule' | 'cube' | 'sphere' | 'octa'>('capsule');
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [howToPlayOpen, setHowToPlayOpen] = useState(false);
  const [showControlsHud, setShowControlsHud] = useState(true);
  const [goalBanner, setGoalBanner] = useState<{ text: string; team: 1 | 2 } | null>(null);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  
  const { stats, addGoal, addGame } = useCareerStats();

  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<GameRenderer | null>(null);
  const peerRef = useRef<PeerManager | null>(null);
  const audioRef = useRef<AudioManager | null>(null);
  const inputsRef = useRef<Record<string, any>>({});
  const localInputRef = useRef({ x: 0, y: 0, z: 0, jump: false, dash: false });

  // Initialize Network & Check URL parameters for direct room joins
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const r = params.get('room');
      if (r) {
        setRoomCode(r);
      }
      setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
    }

    const peer = new PeerManager(
      (state) => setGameState(state),
      (action, id) => handleAction(action, id)
    );
    peerRef.current = peer;

    const checkId = setInterval(() => {
      if (peer.myId) {
        setMyId(peer.myId);
        clearInterval(checkId);
      }
    }, 100);

    return () => {
      peer.disconnect();
      clearInterval(checkId);
    };
  }, []);

  // Initialize 3D Renderer immediately so background arena is visually alluring on initial page load
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
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture gameplay keys while typing in chat
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
  }, [isChatOpen, gameState.players, myId]);

  const lastScoreRef = useRef({ team1: 0, team2: 0 });
  const lastVelocityRef = useRef<[number, number, number]>([0, 0, 0]);
  const stateRef = useRef(gameState);

  useEffect(() => {
    stateRef.current = gameState;
  }, [gameState]);

  // Game Loop
  useEffect(() => {
    let frameId: number;
    const tick = () => {
      const currentState = stateRef.current;
      
      if (peerRef.current) {
        // Send local input to host
        peerRef.current.sendAction({ type: 'MOVE', input: localInputRef.current });

        if (isHost && currentState.status === 'playing') {
          const nextState = PhysicsEngine.update(currentState, inputsRef.current);
          
          // Detect score change and trigger highlight
          if (nextState.score.team1 > currentState.score.team1 || nextState.score.team2 > currentState.score.team2) {
            const scoredTeam1 = nextState.score.team1 > currentState.score.team1;
            const localPlayer = nextState.players[myId];
            if (localPlayer) {
              if ((scoredTeam1 && localPlayer.team === 1) || (!scoredTeam1 && localPlayer.team === 2)) {
                addGoal();
              }
            }
          }

          // Victory check
          if (nextState.score.team1 >= 5 || nextState.score.team2 >= 5) {
            nextState.status = 'ended';
            
            // Career stats for games played
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

        // On-screen announcement
        setGoalBanner({
          team: isTeam1 ? 1 : 2,
          text: isTeam1 ? 'TEAM CYAN SCORED!' : 'TEAM MAGENTA SCORED!'
        });
        setTimeout(() => setGoalBanner(null), 2400);

        // Goal Haptic: Double impact pulse
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          navigator.vibrate([100, 50, 100]);
        }

        lastScoreRef.current = { ...currentState.score };
      }

      // Detect disc wall collision (velocity inversion)
      const currentV = currentState.disc.velocity;
      const lastV = lastVelocityRef.current;
      const xBounce = Math.sign(currentV[0]) !== Math.sign(lastV[0]) && Math.abs(currentV[0]) > 0.01;
      const yBounce = Math.sign(currentV[1]) !== Math.sign(lastV[1]) && Math.abs(currentV[1]) > 0.01;
      const zBounce = Math.sign(currentV[2]) !== Math.sign(lastV[2]) && Math.abs(currentV[2]) > 0.01;

      if (xBounce || yBounce || zBounce) {
        // Wall Haptic: Short subtle tap
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

      frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [isHost, myId, audioEnabled]);

  const handleAction = (action: GameAction, peerId: string) => {
    if (!isHost) return;

    setGameState((prev) => {
      const next = { ...prev };
      switch (action.type) {
        case 'JOIN': {
          const id = peerId || `temp-${Math.random()}`;
          // Evenly distribute teams upon joining
          const team1Count = Object.values(next.players).filter(p => p.team === 1).length;
          const team2Count = Object.values(next.players).filter(p => p.team === 2).length;
          const assignedTeam: 1 | 2 = team1Count <= team2Count ? 1 : 2;

          next.players[id] = {
            id: id,
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
              ...next.messages.slice(-9), // Keep last 10
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
  };

  const createRoom = () => {
    setIsHost(true);
    peerRef.current?.host();
    setIsJoined(true);
    handleAction({ type: 'JOIN', name: playerName, color: customColor, shape: avatarShape }, myId);
  };

  const joinRoom = () => {
    if (!roomCode) return;
    peerRef.current?.join(roomCode);
    setIsJoined(true);
    setTimeout(() => {
      peerRef.current?.sendAction({ type: 'JOIN', name: playerName, color: customColor, shape: avatarShape });
    }, 1000);
  };

  const leaveRoom = () => {
    setIsJoined(false);
    setIsHost(false);
    setGameState(INITIAL_STATE);
    inputsRef.current = {};
    peerRef.current?.disconnect();
    const peer = new PeerManager(
      (state) => setGameState(state),
      (action, id) => handleAction(action, id)
    );
    peerRef.current = peer;
    peer.onOpen((id) => setMyId(id));
  };

  const copyInviteLink = () => {
    const code = isHost ? myId : (roomCode || myId);
    const inviteUrl = `${window.location.origin}${window.location.pathname}?room=${code}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 2000);
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

  const startGame = () => {
    if (isHost) {
      handleAction({ type: 'START_GAME' }, myId);
    }
  };

  const switchTeam = (team: 1 | 2) => {
    if (isHost) {
      handleAction({ type: 'SWITCH_TEAM', team }, myId);
    } else {
      peerRef.current?.sendAction({ type: 'SWITCH_TEAM', team });
    }
  };

  const triggerThrow = () => {
    const localPlayer = gameState.players[myId];
    const throwDirZ = localPlayer?.team === 1 ? -1 : 1;
    peerRef.current?.sendAction({ type: 'THROW', direction: [0, 0, throwDirZ] });
  };

  const sendChat = () => {
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
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#050505] text-white font-sans selection:bg-cyan-500/30">
      {/* 3D WebGL Canvas Layer */}
      <div ref={containerRef} className="absolute inset-0 z-0" />

      {/* Global Sound Ambient Toggle in Top Corner */}
      <div className="absolute top-6 right-6 z-30 pointer-events-auto">
        <button
          onClick={toggleAudio}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold backdrop-blur-md transition-all shadow-lg",
            audioEnabled 
              ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.2)]" 
              : "bg-black/50 border-white/10 text-white/50 hover:text-white"
          )}
          title={audioEnabled ? "Mute audio synthesis" : "Enable procedural synth audio"}
        >
          {audioEnabled ? <LucideVolume2 size={14} className="text-cyan-400" /> : <LucideVolumeX size={14} />}
          <span className="hidden sm:inline font-mono-code text-[11px]">{audioEnabled ? "AUDIO ON" : "AUDIO MUTED"}</span>
        </button>
      </div>

      {/* UI Overlays */}
      <AnimatePresence mode="wait">
        {/* ========================================================================= */}
        {/* 1. LANDING & MATCHMAKING SCREEN                                           */}
        {/* ========================================================================= */}
        {!isJoined && (
          <motion.div
            key="overlay-landing"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md overflow-y-auto"
          >
            <div className="w-full max-w-lg my-auto rounded-3xl bg-black/80 border border-white/15 p-6 sm:p-8 shadow-[0_0_60px_rgba(0,0,0,0.8)] backdrop-blur-2xl">
              
              {/* Brand Header */}
              <div className="flex flex-col items-center text-center mb-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-400 to-magenta-500 flex items-center justify-center shadow-[0_0_35px_rgba(6,182,212,0.6)] mb-3">
                  <LucideGamepad2 size={28} className="text-black" />
                </div>
                <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-white uppercase italic">
                  NEON PULSAR
                </h1>
                <p className="text-white/50 text-xs sm:text-sm mt-1">
                  Zero-G Tactical Disc Arena <span className="text-white/20">·</span> WebRTC P2P
                </p>
              </div>

              {/* Career Totals Bar (Clean unboxed typography) */}
              <div className="mb-6 px-4 py-3 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-yellow-500/10 text-yellow-400">
                    <LucideTrophy size={16} />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Pilot Record</div>
                    <div className="text-xs font-semibold text-white/90">Master Pilot</div>
                  </div>
                </div>
                <div className="flex gap-5 text-xs font-mono-code tabular-nums">
                  <div className="text-right">
                    <div className="text-[10px] text-white/40 uppercase">Goals</div>
                    <div className="font-bold text-cyan-400">{stats.goals}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-white/40 uppercase">Wins</div>
                    <div className="font-bold text-magenta-400">{stats.victories}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-white/40 uppercase">Games</div>
                    <div className="font-bold text-white/80">{stats.gamesPlayed}</div>
                  </div>
                </div>
              </div>

              {/* Pilot Customization Quick-Bar */}
              <div className="space-y-4 mb-6">
                <div>
                  <label className="text-[11px] font-bold text-white/60 uppercase tracking-wider mb-1.5 block">
                    Pilot Call-Sign
                  </label>
                  <input
                    type="text"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    maxLength={20}
                    placeholder="Enter pilot name..."
                    className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-cyan-400/60 focus:bg-white/[0.08] transition-all font-medium"
                  />
                </div>

                {/* Chassis Geometry & Core Color Preview */}
                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Drone Chassis</span>
                    <span className="text-[11px] font-semibold uppercase text-cyan-400">{avatarShape}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {CHASSIS_TYPES.map(ch => (
                      <button
                        key={`chassis-${ch.id}`}
                        onClick={() => setAvatarShape(ch.id)}
                        className={cn(
                          "py-2 px-1 rounded-xl text-[11px] font-bold uppercase transition-all border",
                          avatarShape === ch.id 
                            ? "bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.4)]" 
                            : "bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10"
                        )}
                      >
                        {ch.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Energy Core Wavelength</span>
                    <div className="flex gap-2">
                      {COLOR_PALETTE.map((c, i) => (
                        <button
                          key={`core-color-${c.hex}-${i}`}
                          onClick={() => setCustomColor(c.hex)}
                          className={cn(
                            "w-6 h-6 rounded-full border transition-transform",
                            customColor === c.hex 
                              ? "scale-125 border-white shadow-[0_0_12px_rgba(255,255,255,0.8)]" 
                              : "border-transparent opacity-60 hover:opacity-100"
                          )}
                          style={{ backgroundColor: c.hex }}
                          title={c.name}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Matchmaking Actions */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={async () => {
                      if (!audioEnabled) await toggleAudio();
                      createRoom();
                    }}
                    className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold uppercase tracking-tight transition-all shadow-[0_0_25px_rgba(6,182,212,0.4)] hover:scale-[1.02] active:scale-95 group"
                  >
                    <LucideUsers size={20} className="mb-1 text-black group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-black">Host Arena</span>
                    <span className="text-[9px] font-medium opacity-70">Solo or Multiplayer</span>
                  </button>
                  <button
                    onClick={async () => {
                      if (!audioEnabled) await toggleAudio();
                      setRoomCode(prev => prev === 'JOIN_MODE' ? '' : 'JOIN_MODE');
                    }}
                    className={cn(
                      "flex flex-col items-center justify-center p-3.5 rounded-2xl border transition-all hover:scale-[1.02] active:scale-95 group",
                      roomCode === 'JOIN_MODE'
                        ? "bg-magenta-500/20 border-magenta-500 text-magenta-300"
                        : "bg-white/5 hover:bg-white/10 border-white/15 text-white"
                    )}
                  >
                    <LucideGamepad2 size={20} className="mb-1 text-magenta-400 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-black uppercase">Join Arena</span>
                    <span className="text-[9px] text-white/40">Connect via Code</span>
                  </button>
                </div>

                {/* Direct Join Code Input Drawer */}
                {roomCode !== '' && (
                  <motion.div
                    key="landing-join-box"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-2 pt-2"
                  >
                    <input
                      type="text"
                      placeholder="Paste Arena Code or Peer ID..."
                      value={roomCode === 'JOIN_MODE' ? '' : roomCode}
                      onChange={(e) => setRoomCode(e.target.value)}
                      className="w-full bg-white/5 border border-magenta-500/40 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-magenta-400 transition-colors font-mono-code text-center tracking-wider"
                    />
                    <button
                      onClick={joinRoom}
                      disabled={!roomCode || roomCode === 'JOIN_MODE'}
                      className="w-full py-2.5 rounded-xl bg-magenta-500 hover:bg-magenta-400 disabled:opacity-40 text-black font-extrabold uppercase text-xs tracking-wider transition-all shadow-[0_0_20px_rgba(217,70,239,0.3)]"
                    >
                      Connect to Arena
                    </button>
                  </motion.div>
                )}

                {/* Collapsible How-To-Play Guide for Instant Clarity */}
                <div className="pt-2 border-t border-white/10">
                  <button
                    onClick={() => setHowToPlayOpen(prev => !prev)}
                    className="w-full flex items-center justify-between text-xs text-white/60 hover:text-white py-1 transition-colors"
                  >
                    <span className="flex items-center gap-1.5 font-medium">
                      <LucideHelpCircle size={14} className="text-cyan-400" />
                      Flight Controls & Rules
                    </span>
                    {howToPlayOpen ? <LucideChevronUp size={14} /> : <LucideChevronDown size={14} />}
                  </button>

                  {howToPlayOpen && (
                    <motion.div
                      key="how-to-play-drawer"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-2.5 p-3.5 rounded-xl bg-white/[0.02] border border-white/10 text-xs text-white/70 space-y-2 leading-relaxed"
                    >
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div><strong className="text-cyan-400">WASD:</strong> Zero-G Flight</div>
                        <div><strong className="text-cyan-400">Space/Shift:</strong> Ascend/Descend</div>
                        <div><strong className="text-cyan-400">E:</strong> Throw Energy Disc</div>
                        <div><strong className="text-cyan-400">T / Y:</strong> Global / Team Chat</div>
                      </div>
                      <p className="text-[11px] text-white/50 pt-1 border-t border-white/5">
                        Fly into the disc to gain possession. Score in the opposing team's glowing portal. First to 5 points conquers the arena!
                      </p>
                    </motion.div>
                  )}
                </div>
              </div>

            </div>
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* 2. COMBAT LOBBY SCREEN                                                    */}
        {/* ========================================================================= */}
        {isJoined && gameState.status === 'lobby' && (
          <motion.div
            key="overlay-lobby"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 z-40 flex items-center justify-center p-4 sm:p-6 bg-black/50 backdrop-blur-md"
          >
            <div className="w-full max-w-2xl p-6 sm:p-8 rounded-3xl bg-black/80 border border-white/15 backdrop-blur-2xl shadow-[0_0_60px_rgba(0,0,0,0.9)]">
              
              {/* Lobby Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-6 border-b border-white/10">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="font-display text-2xl font-black uppercase italic tracking-tight">Combat Lobby</h2>
                    {isHost && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 uppercase">
                        HOST
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-white/50 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>{Object.keys(gameState.players).length} Pilots Connected</span>
                    <span className="text-white/20">·</span>
                    <span>Standard Match (First to 5)</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={copyInviteLink}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-semibold transition-all hover:border-cyan-400/50"
                    title="Click to copy invite link"
                  >
                    {copiedInvite ? (
                      <>
                        <LucideCheck size={14} className="text-emerald-400" />
                        <span className="text-emerald-300 font-bold">Link Copied!</span>
                      </>
                    ) : (
                      <>
                        <LucideShare2 size={14} className="text-cyan-400" />
                        <span className="font-mono-code text-[11px]">{myId.substring(0, 8)}...</span>
                        <LucideCopy size={13} className="text-white/40" />
                      </>
                    )}
                  </button>

                  <button
                    onClick={leaveRoom}
                    className="p-2 rounded-xl bg-white/5 hover:bg-red-500/20 border border-white/15 hover:border-red-500/40 text-white/50 hover:text-red-400 transition-colors"
                    title="Leave Lobby"
                  >
                    <LucideLogOut size={16} />
                  </button>
                </div>
              </div>

              {/* Pilot Active Chassis Badge & Customize Trigger */}
              <div className="flex items-center justify-between mb-6 p-3.5 rounded-2xl bg-white/[0.03] border border-white/10">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center border border-white/20 shadow-md"
                    style={{ backgroundColor: customColor + '25', borderColor: customColor }}
                  >
                    <LucideSparkles size={18} style={{ color: customColor }} />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Active Blueprint</div>
                    <div className="text-xs font-bold uppercase tracking-tight">{avatarShape} Chassis · {playerName}</div>
                  </div>
                </div>
                <button
                  onClick={() => setShowCustomizer(true)}
                  className="px-3.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-bold uppercase tracking-wider transition-colors hover:border-cyan-400/50"
                >
                  Configure
                </button>
              </div>

              {/* Team Rosters with Team Switch Ability */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                
                {/* Team Cyan */}
                <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-xs font-black text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                      Team Cyan
                    </h3>
                    {gameState.players[myId]?.team !== 1 && (
                      <button
                        onClick={() => switchTeam(1)}
                        className="text-[10px] font-bold text-cyan-300 hover:text-white uppercase tracking-wider underline underline-offset-2"
                      >
                        Join Team
                      </button>
                    )}
                  </div>
                  <div className="space-y-2 min-h-[90px]">
                    {Object.values(gameState.players).filter(p => p.team === 1).map((p, pIdx) => (
                      <div 
                        key={`lobby-cyan-${p.id || 'pilot'}-${pIdx}`} 
                        className="flex items-center justify-between p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-xs font-medium"
                      >
                        <span className="truncate">
                          {p.name} {p.id === myId && <span className="text-cyan-400 font-bold">(You)</span>}
                        </span>
                        <span className="text-[10px] font-mono-code text-cyan-300/60 uppercase">{p.avatarShape}</span>
                      </div>
                    ))}
                    {Object.values(gameState.players).filter(p => p.team === 1).length === 0 && (
                      <div className="text-xs text-white/30 italic py-4 text-center">No pilots assigned</div>
                    )}
                  </div>
                </div>

                {/* Team Magenta */}
                <div className="p-4 rounded-2xl bg-magenta-950/20 border border-magenta-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-xs font-black text-magenta-400 uppercase tracking-wider flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-magenta-400 shadow-[0_0_8px_rgba(217,70,239,0.8)]" />
                      Team Magenta
                    </h3>
                    {gameState.players[myId]?.team !== 2 && (
                      <button
                        onClick={() => switchTeam(2)}
                        className="text-[10px] font-bold text-magenta-300 hover:text-white uppercase tracking-wider underline underline-offset-2"
                      >
                        Join Team
                      </button>
                    )}
                  </div>
                  <div className="space-y-2 min-h-[90px]">
                    {Object.values(gameState.players).filter(p => p.team === 2).map((p, pIdx) => (
                      <div 
                        key={`lobby-magenta-${p.id || 'pilot'}-${pIdx}`} 
                        className="flex items-center justify-between p-2.5 rounded-xl bg-magenta-500/10 border border-magenta-500/20 text-xs font-medium"
                      >
                        <span className="truncate">
                          {p.name} {p.id === myId && <span className="text-magenta-400 font-bold">(You)</span>}
                        </span>
                        <span className="text-[10px] font-mono-code text-magenta-300/60 uppercase">{p.avatarShape}</span>
                      </div>
                    ))}
                    {Object.values(gameState.players).filter(p => p.team === 2).length === 0 && (
                      <div className="text-xs text-white/30 italic py-4 text-center">No pilots assigned</div>
                    )}
                  </div>
                </div>

              </div>

              {/* Launch Action */}
              {isHost ? (
                <button
                  onClick={startGame}
                  className="w-full py-4 rounded-2xl bg-white hover:bg-cyan-100 text-black font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2.5 shadow-[0_0_40px_rgba(255,255,255,0.4)] hover:scale-[1.01] active:scale-95"
                >
                  <LucidePlay size={18} fill="currentColor" />
                  Initiate Combat Round
                </button>
              ) : (
                <div className="text-center py-3 text-xs text-white/50 animate-pulse font-mono-code">
                  Waiting for arena host to initiate combat sequence...
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* 3. POST-MATCH VICTORY SCREEN                                              */}
        {/* ========================================================================= */}
        {isJoined && gameState.status === 'ended' && (
          <motion.div
            key="overlay-ended"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl"
          >
            <div className="text-center max-w-md w-full">
              <h2 className={cn(
                "font-display text-4xl sm:text-6xl font-black italic uppercase tracking-tighter mb-2",
                gameState.score.team1 >= 5 ? "text-cyan-400 shadow-[0_0_40px_rgba(6,182,212,0.6)]" : "text-magenta-400 shadow-[0_0_40px_rgba(217,70,239,0.6)]"
              )}>
                {gameState.score.team1 >= 5 ? "Cyan Victory" : "Magenta Victory"}
              </h2>
              <p className="text-white/40 uppercase tracking-widest text-xs mb-8">The Arena has been Conquered</p>
              
              {/* Final Scoreboard */}
              <div className="flex justify-center items-center gap-8 mb-8 p-6 rounded-3xl bg-white/[0.04] border border-white/10">
                <div>
                  <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-1">Cyan</div>
                  <div className="font-display text-4xl font-extrabold tabular-nums">{gameState.score.team1}</div>
                </div>
                <div className="w-px h-12 bg-white/10" />
                <div>
                  <div className="text-xs font-bold text-magenta-400 uppercase tracking-wider mb-1">Magenta</div>
                  <div className="font-display text-4xl font-extrabold tabular-nums">{gameState.score.team2}</div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-3">
                {isHost && (
                  <button
                    onClick={startGame}
                    className="w-full py-3.5 rounded-2xl bg-white text-black font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(255,255,255,0.3)] text-sm"
                  >
                    Instant Rematch
                  </button>
                )}
                {!isHost && (
                  <div className="text-xs text-white/50 animate-pulse py-2">
                    Waiting for host to initiate rematch...
                  </div>
                )}
                <button
                  onClick={leaveRoom}
                  className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold uppercase tracking-wider text-white/70 hover:text-white transition-colors"
                >
                  Return to Main Menu
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 4. AVATAR CUSTOMIZATION MODAL                                             */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showCustomizer && (
          <motion.div
            key="overlay-customizer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          >
            <div className="w-full max-w-sm p-6 sm:p-8 rounded-3xl bg-black border border-white/20 shadow-2xl">
              <h3 className="font-display text-xl font-bold uppercase italic tracking-tight mb-5">
                Pilot Configuration
              </h3>
              
              <div className="space-y-5">
                <div>
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2.5 block">
                    Energy Core Color
                  </label>
                  <div className="grid grid-cols-6 gap-2">
                    {COLOR_PALETTE.map((c, cIdx) => (
                      <button
                        key={`custom-palette-${c.hex}-${cIdx}`}
                        onClick={() => {
                          setCustomColor(c.hex);
                          peerRef.current?.sendAction({ type: 'CUSTOMIZE', color: c.hex, shape: avatarShape });
                        }}
                        className={cn(
                          "w-10 h-10 rounded-full border-2 transition-all mx-auto",
                          customColor === c.hex 
                            ? "border-white scale-110 shadow-[0_0_12px_rgba(255,255,255,0.7)]" 
                            : "border-transparent opacity-60 hover:opacity-100"
                        )}
                        style={{ backgroundColor: c.hex }}
                        title={c.name}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2.5 block">
                    Chassis Geometry
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {CHASSIS_TYPES.map((s, sIdx) => (
                      <button
                        key={`custom-chassis-${s.id}-${sIdx}`}
                        onClick={() => {
                          setAvatarShape(s.id);
                          peerRef.current?.sendAction({ type: 'CUSTOMIZE', color: customColor, shape: s.id });
                        }}
                        className={cn(
                          "p-3 rounded-xl border text-left transition-all",
                          avatarShape === s.id 
                            ? "bg-white text-black border-white font-bold" 
                            : "bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10"
                        )}
                      >
                        <div className="text-xs font-bold uppercase">{s.label}</div>
                        <div className="text-[10px] opacity-60">{s.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => setShowCustomizer(false)}
                  className="w-full py-3.5 rounded-2xl bg-cyan-500 text-black font-extrabold uppercase tracking-wider hover:bg-cyan-400 transition-colors text-xs"
                >
                  Confirm Blueprint
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 5. IN-GAME HUD & OVERLAYS (ACTIVE MATCH)                                   */}
      {/* ========================================================================= */}
      {isJoined && gameState.status === 'playing' && (
        <div className="absolute inset-0 pointer-events-none z-10 p-4 sm:p-6 flex flex-col justify-between">
          
          {/* Top Bar: Clean Floating Scoreboard & Match Clock */}
          <div className="flex justify-between items-start">
            
            {/* Scoreboard */}
            <div className="bg-black/70 backdrop-blur-xl border border-white/15 px-5 py-3 rounded-2xl flex items-center gap-6 shadow-2xl pointer-events-auto">
              <div className="text-center">
                <div className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-0.5">Team Cyan</div>
                <div className="font-display text-3xl font-black tabular-nums text-white leading-none">
                  {gameState.score.team1}
                </div>
              </div>
              <div className="w-px h-8 bg-white/15" />
              <div className="text-center">
                <div className="text-[10px] font-black text-magenta-400 uppercase tracking-widest mb-0.5">Team Magenta</div>
                <div className="font-display text-3xl font-black tabular-nums text-white leading-none">
                  {gameState.score.team2}
                </div>
              </div>
            </div>

            {/* Arena Clock & Audio */}
            <div className="bg-black/70 backdrop-blur-xl border border-white/15 px-4 py-2.5 rounded-2xl flex items-center gap-4 shadow-2xl pointer-events-auto">
              <div className="text-right">
                <div className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Time</div>
                <div className="font-mono-code text-base font-bold tabular-nums">
                  {(() => {
                    const totalSecs = Math.floor(gameState.time);
                    const mins = Math.floor(totalSecs / 60);
                    const secs = totalSecs % 60;
                    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
                  })()}
                </div>
              </div>
              <div className="w-px h-6 bg-white/15" />
              <button
                onClick={leaveRoom}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-colors"
                title="Leave Match"
              >
                <LucideLogOut size={16} />
              </button>
            </div>
          </div>

          {/* Goal Scored Cinematic Banner */}
          <AnimatePresence>
            {goalBanner && (
              <motion.div
                key="goal-banner-notification"
                initial={{ opacity: 0, y: -30, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                className="absolute top-24 left-1/2 -translate-x-1/2 pointer-events-none"
              >
                <div className={cn(
                  "px-8 py-3.5 rounded-2xl border font-display text-xl sm:text-2xl font-black tracking-widest uppercase italic shadow-2xl backdrop-blur-xl",
                  goalBanner.team === 1
                    ? "bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_40px_rgba(6,182,212,0.6)]"
                    : "bg-magenta-500/20 border-magenta-400 text-magenta-300 shadow-[0_0_40px_rgba(217,70,239,0.6)]"
                )}>
                  {goalBanner.text}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Spectator Indicator */}
          {gameState.players[myId]?.isSpectator && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none text-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-black/85 backdrop-blur-2xl border border-cyan-500/40 px-8 py-5 rounded-3xl shadow-[0_0_40px_rgba(6,182,212,0.3)]"
              >
                <div className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.3em] mb-1">Live Feed</div>
                <div className="font-display text-2xl font-black italic uppercase tracking-wider text-white">SPECTATING</div>
                <div className="text-[11px] font-medium text-white/40 uppercase mt-2">Joining on next round reset</div>
              </motion.div>
            </div>
          )}

          {/* Top-Down Radar Mini-Map */}
          <div className="absolute top-6 right-6 pointer-events-none hidden sm:block">
            <div className="relative w-44 h-64 bg-black/60 backdrop-blur-xl border border-white/15 rounded-2xl overflow-hidden p-2 shadow-2xl">
              <div className="absolute inset-2 border border-white/5 rounded-lg bg-white/[0.02]" />
              
              {/* Goals */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,1)]" />
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-10 h-1 bg-magenta-400 shadow-[0_0_8px_rgba(217,70,239,1)]" />

              {/* Grid Lines */}
              <div className="absolute inset-2 flex flex-col justify-between opacity-15">
                {[...Array(5)].map((_, i) => <div key={`grid-h-${i}`} className="w-full h-px bg-white" />)}
              </div>

              {/* Dynamic Entities */}
              <div className="absolute inset-2">
                {Object.values(gameState.players).map((player, idx) => {
                  const xPerc = ((player.position[0] + 20) / 40) * 100;
                  const zPerc = ((player.position[2] + 30) / 60) * 100;
                  
                  return (
                    <motion.div
                      key={`map-p-${player.id || 'pilot'}-${idx}`}
                      animate={{ left: `${xPerc}%`, top: `${zPerc}%` }}
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      className={cn(
                        "absolute w-2.5 h-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/60 z-10",
                        player.team === 1 ? "bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.9)]" : "bg-magenta-400 shadow-[0_0_8px_rgba(217,70,239,0.9)]",
                        player.id === myId && "ring-2 ring-white scale-125"
                      )}
                    />
                  );
                })}

                {/* Disc */}
                <motion.div
                  animate={{ 
                    left: `${((gameState.disc.position[0] + 20) / 40) * 100}%`,
                    top: `${((gameState.disc.position[2] + 30) / 60) * 100}%`,
                    scale: gameState.disc.ownerId ? 0.8 : 1
                  }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  className="absolute w-2 h-2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,1)] z-20"
                />
              </div>

              <div className="absolute bottom-1.5 right-2 text-[8px] font-bold text-white/30 uppercase tracking-widest font-mono-code">
                Radar
              </div>
            </div>
          </div>

          {/* Velocity Speedometer Gauge */}
          <div className="absolute top-1/2 left-6 -translate-y-1/2 flex flex-col items-center gap-2 pointer-events-none">
            <div className="h-44 w-1.5 bg-white/10 rounded-full overflow-hidden border border-white/10 relative">
              {(() => {
                const v = gameState.disc.velocity;
                const speed = Math.sqrt(v[0] ** 2 + v[1] ** 2 + v[2] ** 2);
                const maxSpeed = 2.0;
                const ratio = Math.min(speed / maxSpeed, 1);
                
                return (
                  <motion.div 
                    className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-cyan-400 via-magenta-400 to-red-500"
                    initial={false}
                    animate={{ height: `${ratio * 100}%` }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                );
              })()}
            </div>
            <div className="text-[8px] font-bold text-white/40 uppercase tracking-widest font-mono-code [writing-mode:vertical-lr]">
              Speed
            </div>
          </div>

          {/* Virtual Mobile Touch Flight Controls */}
          {isTouchDevice && (
            <div className="w-full flex justify-between items-end pointer-events-auto pb-4">
              {/* Virtual D-Pad (Left Thumb) */}
              <div className="grid grid-cols-3 gap-1.5 bg-black/60 p-2.5 rounded-3xl border border-white/15 backdrop-blur-md">
                <div />
                <button
                  onTouchStart={() => { localInputRef.current.z = -1; }}
                  onTouchEnd={() => { localInputRef.current.z = 0; }}
                  className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center active:bg-cyan-500/40 text-white"
                >
                  <LucideArrowUp size={20} />
                </button>
                <div />
                <button
                  onTouchStart={() => { localInputRef.current.x = -1; }}
                  onTouchEnd={() => { localInputRef.current.x = 0; }}
                  className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center active:bg-cyan-500/40 text-white"
                >
                  <LucideArrowLeft size={20} />
                </button>
                <button
                  onTouchStart={() => { localInputRef.current.z = 1; }}
                  onTouchEnd={() => { localInputRef.current.z = 0; }}
                  className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center active:bg-cyan-500/40 text-white"
                >
                  <LucideArrowDown size={20} />
                </button>
                <button
                  onTouchStart={() => { localInputRef.current.x = 1; }}
                  onTouchEnd={() => { localInputRef.current.x = 0; }}
                  className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center active:bg-cyan-500/40 text-white"
                >
                  <LucideArrowRight size={20} />
                </button>
              </div>

              {/* Altitude & Throw Impulse (Right Thumb) */}
              <div className="flex flex-col items-end gap-2">
                <div className="flex gap-2">
                  <button
                    onTouchStart={() => { localInputRef.current.y = 1; }}
                    onTouchEnd={() => { localInputRef.current.y = 0; }}
                    className="w-12 h-12 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center active:bg-white/30 text-xs font-bold font-mono-code"
                  >
                    UP
                  </button>
                  <button
                    onTouchStart={() => { localInputRef.current.y = -1; }}
                    onTouchEnd={() => { localInputRef.current.y = 0; }}
                    className="w-12 h-12 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center active:bg-white/30 text-xs font-bold font-mono-code"
                  >
                    DN
                  </button>
                </div>
                <button
                  onClick={triggerThrow}
                  className="w-26 h-14 rounded-2xl bg-cyan-500 text-black font-black uppercase tracking-wider shadow-[0_0_20px_rgba(6,182,212,0.6)] active:scale-95 text-xs flex items-center justify-center gap-1.5"
                >
                  <LucideZap size={16} /> THROW
                </button>
              </div>
            </div>
          )}

          {/* Non-Intrusive Bottom Controls HUD with [H] Toggle */}
          {!isTouchDevice && (
            <div className="flex justify-center pointer-events-auto">
              {showControlsHud ? (
                <div className="bg-black/60 backdrop-blur-md border border-white/15 rounded-2xl px-5 py-2.5 flex items-center gap-5 text-xs text-white/80 shadow-2xl">
                  <div className="flex items-center gap-2">
                    <span className="font-mono-code bg-white/10 px-1.5 py-0.5 rounded text-[11px] font-bold">WASD</span>
                    <span className="text-[11px] text-white/50">Thrust</span>
                  </div>
                  <div className="w-px h-4 bg-white/15" />
                  <div className="flex items-center gap-2">
                    <span className="font-mono-code bg-white/10 px-1.5 py-0.5 rounded text-[11px] font-bold">SPACE/SHIFT</span>
                    <span className="text-[11px] text-white/50">Altitude</span>
                  </div>
                  <div className="w-px h-4 bg-white/15" />
                  <div className="flex items-center gap-2">
                    <span className="font-mono-code bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-1.5 py-0.5 rounded text-[11px] font-bold">E</span>
                    <span className="text-[11px] text-white/50">Throw</span>
                  </div>
                  <div className="w-px h-4 bg-white/15" />
                  <button
                    onClick={() => setShowControlsHud(false)}
                    className="text-[10px] text-white/40 hover:text-white uppercase font-bold tracking-wider"
                    title="Press H to toggle HUD"
                  >
                    [H] Hide
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowControlsHud(true)}
                  className="bg-black/40 hover:bg-black/70 backdrop-blur-md border border-white/10 rounded-full px-3 py-1 text-[10px] font-mono-code text-white/40 hover:text-white uppercase tracking-wider transition-colors"
                >
                  [H] Controls
                </button>
              )}
            </div>
          )}

          {/* Chat System (Bottom-Left Toast Notifications & Input) */}
          <div className="absolute bottom-20 left-6 w-72 sm:w-80 space-y-2 pointer-events-none">
            <div className="flex flex-col gap-2 mb-2">
              <AnimatePresence>
                {gameState.messages
                  .filter(msg => !msg.teamOnly || (msg.teamOnly && msg.team === gameState.players[myId]?.team))
                  .slice(-4)
                  .map((msg, idx) => (
                    <motion.div
                      key={`chat-msg-${msg.id || 'msg'}-${idx}`}
                      initial={{ opacity: 0, x: -15 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className={cn(
                        "p-2.5 rounded-xl border backdrop-blur-md text-xs shadow-lg leading-relaxed",
                        msg.teamOnly 
                          ? (msg.team === 1 ? "bg-cyan-950/40 border-cyan-500/30 text-cyan-100" : "bg-magenta-950/40 border-magenta-500/30 text-magenta-100")
                          : "bg-black/60 border-white/15 text-white/90"
                      )}
                    >
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className={cn(
                          "text-[10px] font-extrabold uppercase tracking-wider",
                          msg.team === 1 ? "text-cyan-400" : "text-magenta-400"
                        )}>
                          {msg.senderName}
                        </span>
                        {msg.teamOnly && (
                          <span className="text-[8px] bg-white/15 px-1 rounded uppercase font-bold text-white/50">TEAM</span>
                        )}
                      </div>
                      <div className="break-words">{msg.text}</div>
                    </motion.div>
                  ))}
              </AnimatePresence>
            </div>

            {isChatOpen && (
              <motion.div
                key="chat-input-container"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="pointer-events-auto"
              >
                <div className="relative">
                  <div className={cn(
                    "absolute left-3 top-1/2 -translate-y-1/2 text-[9px] font-black uppercase tracking-widest pointer-events-none",
                    teamOnlyChat ? (gameState.players[myId]?.team === 1 ? "text-cyan-400" : "text-magenta-400") : "text-white/40"
                  )}>
                    {teamOnlyChat ? "TEAM:" : "ALL:"}
                  </div>
                  <input
                    autoFocus
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Press Enter to send, ESC to cancel..."
                    className={cn(
                      "w-full bg-black/80 border rounded-xl py-2 pl-12 pr-3 text-xs outline-none transition-all",
                      teamOnlyChat 
                        ? (gameState.players[myId]?.team === 1 ? "border-cyan-400 focus:border-cyan-300" : "border-magenta-400 focus:border-magenta-300")
                        : "border-white/20 focus:border-white/50"
                    )}
                  />
                </div>
              </motion.div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
