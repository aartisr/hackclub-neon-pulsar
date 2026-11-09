import React, { useEffect, useRef, useState } from 'react';
import { PeerManager, GameState, GameAction, PlayerState } from './lib/network/PeerManager';
import { GameRenderer } from './lib/game/Renderer';
import { PhysicsEngine } from './lib/game/Physics';
import { AudioManager } from './lib/audio/AudioManager';
import { useCareerStats } from './hooks/useCareerStats';
import { LucideGamepad2, LucideUsers, LucideShare2, LucideCheck, LucidePlay, LucideCopy, LucideVolume2, LucideVolumeX, LucideTrophy } from 'lucide-react';
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

export default function App() {
  const [gameState, setGameState] = useState<GameState>(INITIAL_STATE);
  const [myId, setMyId] = useState<string>(() => `pilot_${Math.random().toString(36).substring(2, 9)}`);
  const [roomCode, setRoomCode] = useState<string>('');
  const [isJoined, setIsJoined] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [playerName, setPlayerName] = useState(() => `Pilot_${Math.floor(Math.random() * 1000)}`);
  const [chatInput, setChatInput] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [teamOnlyChat, setTeamOnlyChat] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [customColor, setCustomColor] = useState('#06b6d4');
  const [avatarShape, setAvatarShape] = useState<'capsule' | 'cube' | 'sphere' | 'octa'>('capsule');
  
  const { stats, addGoal, addGame } = useCareerStats();

  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<GameRenderer | null>(null);
  const peerRef = useRef<PeerManager | null>(null);
  const audioRef = useRef<AudioManager | null>(null);
  const inputsRef = useRef<Record<string, any>>({});
  const localInputRef = useRef({ x: 0, y: 0, z: 0, jump: false, dash: false });

  // Initialize Network
  useEffect(() => {
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

  // Initialize Renderer
  useEffect(() => {
    if (isJoined && containerRef.current && !rendererRef.current) {
      rendererRef.current = new GameRenderer(containerRef.current);
    }
    return () => {
      rendererRef.current?.dispose();
      rendererRef.current = null;
    };
  }, [isJoined]);

  // Input Handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const input = localInputRef.current;
      if (e.key === 'w' || e.key === 'ArrowUp') input.z = -1;
      if (e.key === 's' || e.key === 'ArrowDown') input.z = 1;
      if (e.key === 'a' || e.key === 'ArrowLeft') input.x = -1;
      if (e.key === 'd' || e.key === 'ArrowRight') input.x = 1;
      if (e.key === ' ') input.y = 1;
      if (e.key === 'Shift') input.y = -1;
      if (e.key === 'e') {
        const dir = [0, 0, -1] as [number, number, number]; // Simplified throw
        peerRef.current?.sendAction({ type: 'THROW', direction: dir });
      }
      if (e.key === 't' && !isChatOpen) {
        e.preventDefault();
        setIsChatOpen(true);
        setTeamOnlyChat(false);
      }
      if (e.key === 'y' && !isChatOpen) {
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
      if (['w', 's', 'ArrowUp', 'ArrowDown'].includes(e.key)) input.z = 0;
      if (['a', 'd', 'ArrowLeft', 'ArrowRight'].includes(e.key)) input.x = 0;
      if (e.key === ' ') input.y = 0;
      if (e.key === 'Shift') input.y = 0;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

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
            // If the local player is on the scoring team, count it as a career goal
            const localPlayer = nextState.players[myId];
            if (localPlayer) {
              const scoredTeam1 = nextState.score.team1 > currentState.score.team1;
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

      // Detect score change and trigger highlight + haptics
      if (currentState.score.team1 !== lastScoreRef.current.team1 || currentState.score.team2 !== lastScoreRef.current.team2) {
        if (rendererRef.current) {
          const isTeam1 = currentState.score.team1 > lastScoreRef.current.team1;
          const targetZ = isTeam1 ? -30 : 30; 
          rendererRef.current.triggerHighlight([0, 0, targetZ], isTeam1 ? 0x00ffff : 0xff00ff);
        }

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

      if (audioRef.current) {
        const v = currentState.disc.velocity;
        const speed = Math.sqrt(v[0] ** 2 + v[1] ** 2 + v[2] ** 2);
        audioRef.current.update(speed, currentState.status);
      }

      frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [isHost, myId]);

  const handleAction = (action: GameAction, peerId: string) => {
    if (!isHost) return;

    setGameState((prev) => {
      const next = { ...prev };
      switch (action.type) {
        case 'JOIN':
          const id = peerId || `temp-${Math.random()}`;
          next.players[id] = {
            id: id,
            name: action.name || 'Unknown Pilot',
            position: [0, 0, id === myId ? 25 : -25],
            rotation: [0, 0, 0],
            team: id === myId ? 1 : 2,
            ready: false,
            isSpectator: next.status === 'playing',
            effects: [],
            customColor: action.color,
            avatarShape: action.shape || 'capsule',
          };
          break;
        case 'READY':
          if (next.players[peerId]) {
            next.players[peerId].ready = action.ready;
          }
          break;
        case 'MOVE':
          inputsRef.current[peerId] = action.input;
          break;
        case 'THROW':
          if (next.disc.ownerId === peerId) {
            next.disc.ownerId = null;
            next.disc.velocity = [0, 0, -2] as [number, number, number]; // Simplified
          }
          break;
        case 'CHAT':
          const sender = next.players[peerId];
          if (sender) {
            next.messages = [
              ...next.messages.slice(-9), // Keep last 10
              {
                id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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
    // Send join action after short delay for connection
    setTimeout(() => {
      peerRef.current?.sendAction({ type: 'JOIN', name: playerName, color: customColor, shape: avatarShape });
    }, 1000);
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(myId);
  };

  const toggleAudio = async () => {
    if (!audioRef.current) {
      audioRef.current = new AudioManager();
    }
    await audioRef.current.init();
    setAudioEnabled(true);
  };

  const startGame = () => {
    if (isHost) {
      handleAction({ type: 'START_GAME' }, myId);
    }
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
    <div className="relative w-full h-screen overflow-hidden bg-black text-white font-sans selection:bg-cyan-500/30">
      <div ref={containerRef} className="absolute inset-0 z-0" />

      {/* UI Overlays */}
      <AnimatePresence mode="wait">
        {!isJoined && (
          <motion.div
            key="overlay-landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl"
          >
            <div className="w-full max-w-md p-8 rounded-3xl bg-white/5 border border-white/10 shadow-2xl">
              <div className="flex flex-col items-center mb-8">
                <div className="w-16 h-16 bg-cyan-500 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(6,182,212,0.5)] mb-4">
                  <LucideGamepad2 size={32} />
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-white uppercase italic">NEON PULSAR</h1>
                <p className="text-white/40 text-sm mt-1">Zero-G Tactical Arena</p>
              </div>

              {/* Career Totals Badge */}
              <div className="mb-8 p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-yellow-500/10 text-yellow-500">
                    <LucideTrophy size={18} />
                  </div>
                  <div>
                    <div className="text-[10px] font-black text-white/30 uppercase tracking-widest">Career Stats</div>
                    <div className="text-sm font-bold text-white/90">Master Pilot</div>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="text-right">
                    <div className="text-[10px] font-bold text-white/20 uppercase">Goals</div>
                    <div className="text-sm font-black tabular-nums text-cyan-400">{stats.goals}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-bold text-white/20 uppercase">Wins</div>
                    <div className="text-sm font-black tabular-nums text-magenta-400">{stats.victories}</div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-xs font-medium text-white/50 uppercase tracking-widest mb-2 block">Pilot Handle</label>
                  <input
                    type="text"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-cyan-500/50 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={async () => {
                      await toggleAudio();
                      createRoom();
                    }}
                    className="flex flex-col items-center justify-center p-4 rounded-2xl bg-cyan-500 hover:bg-cyan-400 transition-colors group"
                  >
                    <LucideUsers className="mb-2 group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-bold uppercase tracking-tight">Host Arena</span>
                  </button>
                  <button
                    onClick={async () => {
                      await toggleAudio();
                      setRoomCode('JOIN_MODE');
                    }}
                    className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors group"
                  >
                    <LucideGamepad2 className="mb-2 group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-bold uppercase tracking-tight">Join Arena</span>
                  </button>
                </div>

                {roomCode === 'JOIN_MODE' && (
                  <motion.div key="join-mode-box" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="space-y-4">
                    <input
                      type="text"
                      placeholder="Enter Arena Code..."
                      onChange={(e) => setRoomCode(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-magenta-500/50 transition-colors"
                    />
                    <button
                      onClick={joinRoom}
                      className="w-full py-3 rounded-xl bg-magenta-500 hover:bg-magenta-400 font-bold uppercase tracking-widest transition-colors"
                    >
                      Initialize Connection
                    </button>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {isJoined && gameState.status === 'lobby' && (
          <motion.div
            key="overlay-lobby"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          >
            <div className="w-full max-w-2xl p-8 rounded-3xl bg-black/60 border border-white/10 backdrop-blur-2xl">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-2xl font-bold tracking-tighter uppercase italic">Combat Lobby</h2>
                  <div className="flex items-center gap-2 text-white/40 text-xs mt-1">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    SERVER ONLINE · {Object.keys(gameState.players).length} PILOTS CONNECTED
                  </div>
                </div>
                <button
                  onClick={copyRoomCode}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold transition-all"
                >
                  <LucideShare2 size={14} />
                  {myId.substring(0, 8)}...
                  <LucideCopy size={14} className="ml-2 text-white/30" />
                </button>
              </div>

              <div className="flex items-center justify-between mb-8 p-4 rounded-2xl bg-white/[0.03] border border-white/10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center border border-white/10" style={{ backgroundColor: customColor + '20' }}>
                    <div className="w-4 h-4 rounded-sm border-2" style={{ borderColor: customColor, backgroundColor: customColor + '40' }} />
                  </div>
                  <div>
                    <div className="text-[10px] font-black text-white/30 uppercase tracking-widest">Active Blueprint</div>
                    <div className="text-sm font-bold uppercase">{avatarShape} Chassis</div>
                  </div>
                </div>
                <button
                  onClick={() => setShowCustomizer(true)}
                  className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-black uppercase tracking-widest transition-colors"
                >
                  Modify Avatar
                </button>
              </div>

              <div className="grid grid-cols-2 gap-8 mb-8">
                <div className="space-y-4">
                  <h3 className="text-xs font-black text-cyan-400 uppercase tracking-widest">Team Cyan</h3>
                  {Object.values(gameState.players).filter(p => p.team === 1).map((p, pIdx) => (
                    <div key={`lobby-cyan-${p.id || 'pilot'}-${pIdx}`} className="flex items-center justify-between p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                      <span className="font-medium">{p.name} {p.id === myId && "(You)"}</span>
                      {p.ready ? <LucideCheck className="text-cyan-400" size={16} /> : <div className="w-4 h-4 rounded-full border-2 border-cyan-500/30" />}
                    </div>
                  ))}
                </div>
                <div className="space-y-4">
                  <h3 className="text-xs font-black text-magenta-400 uppercase tracking-widest">Team Magenta</h3>
                  {Object.values(gameState.players).filter(p => p.team === 2).map((p, pIdx) => (
                    <div key={`lobby-magenta-${p.id || 'pilot'}-${pIdx}`} className="flex items-center justify-between p-3 rounded-xl bg-magenta-500/10 border border-magenta-500/20">
                      <span className="font-medium">{p.name} {p.id === myId && "(You)"}</span>
                      {p.ready ? <LucideCheck className="text-magenta-400" size={16} /> : <div className="w-4 h-4 rounded-full border-2 border-magenta-500/30" />}
                    </div>
                  ))}
                </div>
              </div>

              {isHost && (
                <button
                  onClick={startGame}
                  className="w-full py-4 rounded-2xl bg-white text-black font-black uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 shadow-[0_0_50px_rgba(255,255,255,0.3)]"
                >
                  <LucidePlay size={20} fill="currentColor" />
                  Initiate Combat
                </button>
              )}
              {!isHost && (
                <div className="text-center text-white/40 text-sm italic py-4 animate-pulse">
                  Waiting for Host to Initiate...
                </div>
              )}
            </div>
          </motion.div>
        )}

        {isJoined && gameState.status === 'ended' && (
          <motion.div
            key="overlay-ended"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl"
          >
            <div className="text-center">
              <h2 className={cn(
                "text-7xl font-black italic uppercase tracking-tighter mb-2",
                gameState.score.team1 >= 5 ? "text-cyan-400" : "text-magenta-400"
              )}>
                {gameState.score.team1 >= 5 ? "Cyan Victory" : "Magenta Victory"}
              </h2>
              <p className="text-white/40 uppercase tracking-widest mb-12">The Arena has been Conquered</p>
              
              <div className="flex justify-center gap-12 mb-12">
                <div>
                  <div className="text-sm font-bold text-cyan-400 uppercase tracking-widest mb-2">Cyan</div>
                  <div className="text-5xl font-black">{gameState.score.team1}</div>
                </div>
                <div className="w-px h-16 bg-white/10" />
                <div>
                  <div className="text-sm font-bold text-magenta-400 uppercase tracking-widest mb-2">Magenta</div>
                  <div className="text-5xl font-black">{gameState.score.team2}</div>
                </div>
              </div>

              {isHost && (
                <button
                  onClick={startGame}
                  className="px-12 py-4 rounded-2xl bg-white text-black font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-[0_0_50px_rgba(255,255,255,0.2)]"
                >
                  Rematch
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Avatar Customizer Modal */}
      <AnimatePresence>
        {showCustomizer && (
          <motion.div
            key="overlay-customizer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md"
          >
            <div className="w-full max-w-sm p-8 rounded-3xl bg-black border border-white/10 shadow-2xl mx-4">
              <h3 className="text-xl font-bold uppercase italic tracking-tighter mb-6">Pilot Configuration</h3>
              
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-3 block">Energy Core Color</label>
                  <div className="flex flex-wrap gap-3">
                    {['#06b6d4', '#d946ef', '#10b981', '#f59e0b', '#ef4444', '#ffffff'].map((c, cIdx) => (
                      <button
                        key={`config-color-${c}-${cIdx}`}
                        onClick={() => {
                          setCustomColor(c);
                          peerRef.current?.sendAction({ type: 'CUSTOMIZE', color: c, shape: avatarShape });
                        }}
                        className={cn(
                          "w-8 h-8 rounded-full border-2 transition-all",
                          customColor === c ? "border-white scale-110 shadow-[0_0_10px_rgba(255,255,255,0.5)]" : "border-transparent opacity-50"
                        )}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-3 block">Chassis Geometry</label>
                  <div className="grid grid-cols-4 gap-2">
                    {(['capsule', 'cube', 'sphere', 'octa'] as const).map((s, sIdx) => (
                      <button
                        key={`config-shape-${s}-${sIdx}`}
                        onClick={() => {
                          setAvatarShape(s);
                          peerRef.current?.sendAction({ type: 'CUSTOMIZE', color: customColor, shape: s });
                        }}
                        className={cn(
                          "py-3 rounded-xl border transition-all text-[10px] font-black uppercase tracking-tighter",
                          avatarShape === s ? "bg-white text-black border-white" : "bg-white/5 border-white/10 text-white/40"
                        )}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => setShowCustomizer(false)}
                  className="w-full py-4 rounded-2xl bg-cyan-500 text-black font-black uppercase tracking-widest hover:bg-cyan-400 transition-colors"
                >
                  Confirm Blueprint
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HUD during gameplay */}
      {isJoined && gameState.status === 'playing' && (
        <div className="absolute inset-0 pointer-events-none z-10 p-8 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="bg-black/60 backdrop-blur-xl border border-white/10 p-4 rounded-2xl flex items-center gap-8">
              <div className="text-center">
                <div className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-1">Cyan</div>
                <div className="text-4xl font-black tabular-nums leading-none">{gameState.score.team1}</div>
              </div>
              <div className="w-px h-10 bg-white/10" />
              <div className="text-center">
                <div className="text-[10px] font-black text-magenta-400 uppercase tracking-widest mb-1">Magenta</div>
                <div className="text-4xl font-black tabular-nums leading-none">{gameState.score.team2}</div>
              </div>
            </div>

            <div className="bg-black/60 backdrop-blur-xl border border-white/10 px-6 py-3 rounded-full flex items-center gap-4">
              <div className="flex flex-col items-center">
                <div className="text-xs font-medium text-white/50 text-center uppercase tracking-widest mb-1">Arena Time</div>
                <div className="text-xl font-bold tabular-nums tracking-tighter">
                  {(() => {
                    const totalSecs = Math.floor(gameState.time);
                    const mins = Math.floor(totalSecs / 60);
                    const secs = totalSecs % 60;
                    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
                  })()}
                </div>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <button 
                onClick={toggleAudio}
                className="hover:text-cyan-400 transition-colors pointer-events-auto"
              >
                {audioEnabled ? <LucideVolume2 size={20} /> : <LucideVolumeX size={20} />}
              </button>
            </div>
          </div>

          {/* Spectator Indicator */}
          {gameState.players[myId]?.isSpectator && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none text-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-black/80 backdrop-blur-2xl border border-white/10 px-8 py-4 rounded-3xl"
              >
                <div className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mb-1">Live Feed</div>
                <div className="text-2xl font-black italic uppercase tracking-tighter text-cyan-400">SPECTATING</div>
                <div className="text-[10px] font-medium text-white/30 uppercase mt-2">Joining Next Round...</div>
              </motion.div>
            </div>
          )}

          {/* Mini-Map */}
          <div className="absolute top-8 right-8 pointer-events-none">
            <div className="relative w-48 h-72 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden p-2 shadow-2xl">
              {/* Arena Floor Representation */}
              <div className="absolute inset-2 border border-white/5 rounded-lg bg-white/[0.02]" />
              
              {/* Goals */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1 bg-cyan-500/50 blur-[1px]" />
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-12 h-1 bg-magenta-500/50 blur-[1px]" />

              {/* Grid Lines */}
              <div className="absolute inset-2 flex flex-col justify-between opacity-10">
                {[...Array(5)].map((_, i) => <div key={`grid-h-${i}`} className="w-full h-px bg-white" />)}
              </div>

              {/* Dynamic Entities */}
              <div className="absolute inset-2">
                {/* Players */}
                {Object.values(gameState.players).map((player, idx) => {
                  // Map X (-20 to 20) and Z (-30 to 30) to percentage
                  const xPerc = ((player.position[0] + 20) / 40) * 100;
                  const zPerc = ((player.position[2] + 30) / 60) * 100;
                  
                  return (
                    <motion.div
                      key={`map-p-${player.id || 'pilot'}-${idx}`}
                      animate={{ left: `${xPerc}%`, top: `${zPerc}%` }}
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      className={cn(
                        "absolute w-3 h-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/50 z-10",
                        player.team === 1 ? "bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]" : "bg-magenta-500 shadow-[0_0_8px_rgba(217,70,239,0.8)]",
                        player.id === myId && "ring-2 ring-white scale-125"
                      )}
                    >
                      {player.id === myId && (
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[8px] font-black uppercase text-white whitespace-nowrap">You</div>
                      )}
                    </motion.div>
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

              {/* Label */}
              <div className="absolute bottom-2 right-2 text-[8px] font-black text-white/20 uppercase tracking-widest">
                Top-Down Radar
              </div>
            </div>
          </div>

          {/* Speed Indicator */}
          <div className="absolute top-1/2 left-8 -translate-y-1/2 flex flex-col items-center gap-4">
            <div className="h-64 w-2 bg-white/5 rounded-full overflow-hidden border border-white/10 relative">
              {(() => {
                const v = gameState.disc.velocity;
                const speed = Math.sqrt(v[0] ** 2 + v[1] ** 2 + v[2] ** 2);
                const maxSpeed = 2.0; // Based on throw force and physics
                const ratio = Math.min(speed / maxSpeed, 1);
                
                // Color interpolation: blue -> cyan -> magenta -> red
                let color = "rgb(6, 182, 212)"; // Default cyan
                let glow = "rgba(6, 182, 212, 0)";
                if (ratio > 0.8) {
                  color = "rgb(239, 68, 68)"; // Red
                  glow = "rgba(239, 68, 68, 0.8)";
                } else if (ratio > 0.5) {
                  color = "rgb(217, 70, 239)"; // Magenta
                  glow = "rgba(217, 70, 239, 0.5)";
                }

                return (
                  <>
                    <motion.div 
                      className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-cyan-500 via-magenta-500 to-red-500"
                      initial={false}
                      animate={{ height: `${ratio * 100}%` }}
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      style={{ 
                        filter: ratio > 0.5 ? `drop-shadow(0 0 10px ${color})` : 'none',
                        boxShadow: ratio > 0.7 ? `0 0 20px ${color}` : 'none'
                      }}
                    />
                  </>
                );
              })()}
            </div>
            <div className="flex flex-col items-center">
              <div className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] [writing-mode:vertical-lr]">Velocity</div>
              {(() => {
                const v = gameState.disc.velocity;
                const speed = Math.sqrt(v[0] ** 2 + v[1] ** 2 + v[2] ** 2);
                return (
                  <motion.div 
                    animate={{ 
                      scale: speed > 1.5 ? [1, 1.1, 1] : 1,
                      color: speed > 1.5 ? "#ef4444" : "#ffffff"
                    }}
                    transition={{ repeat: speed > 1.5 ? Infinity : 0, duration: 0.2 }}
                    className="text-lg font-black tabular-nums mt-2"
                  >
                    {(speed * 100).toFixed(0)}
                  </motion.div>
                );
              })()}
            </div>
          </div>

          <div className="flex justify-center">
             <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex gap-4 pointer-events-auto">
                <div className="flex flex-col items-center gap-1">
                  <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-xs font-bold">W</div>
                  <div className="flex gap-1">
                    <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-xs font-bold">A</div>
                    <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-xs font-bold">S</div>
                    <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-xs font-bold">D</div>
                  </div>
                  <div className="text-[10px] text-white/40 uppercase mt-1">Move</div>
                </div>
                <div className="w-px h-full bg-white/10" />
                <div className="flex flex-col items-center gap-1">
                  <div className="w-24 h-10 rounded-lg bg-white/10 flex items-center justify-center text-xs font-bold">SPACE</div>
                  <div className="w-24 h-10 rounded-lg bg-white/10 flex items-center justify-center text-xs font-bold">SHIFT</div>
                  <div className="text-[10px] text-white/40 uppercase mt-1">Ascend/Descend</div>
                </div>
                <div className="w-px h-full bg-white/10" />
                <div className="flex flex-col items-center gap-1">
                  <div className="w-10 h-10 rounded-lg bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center text-xs font-bold">E</div>
                  <div className="mt-auto text-[10px] text-white/40 uppercase">Throw</div>
                </div>
                <div className="w-px h-full bg-white/10" />
                <div className="flex flex-col items-center gap-1">
                  <div className="flex gap-1">
                    <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-xs font-bold">T</div>
                    <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-xs font-bold">Y</div>
                  </div>
                  <div className="text-[10px] text-white/40 uppercase mt-1 text-center leading-tight">Chat /<br/>Team</div>
                </div>
             </div>
          </div>

          {/* Chat Toasts & Input */}
          <div className="absolute bottom-32 left-8 w-80 space-y-2 pointer-events-none">
            <div className="flex flex-col gap-2 mb-4">
              <AnimatePresence>
                {gameState.messages
                  .filter(msg => !msg.teamOnly || (msg.teamOnly && msg.team === gameState.players[myId]?.team))
                  .slice(-5)
                  .map((msg, idx) => (
                    <motion.div
                      key={`chat-msg-${msg.id || 'msg'}-${idx}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className={cn(
                        "p-3 rounded-xl border backdrop-blur-md text-sm",
                        msg.teamOnly 
                          ? (msg.team === 1 ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-100" : "bg-magenta-500/10 border-magenta-500/20 text-magenta-100")
                          : "bg-white/5 border-white/10 text-white/90"
                      )}
                    >
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={cn(
                          "text-[10px] font-black uppercase tracking-widest",
                          msg.team === 1 ? "text-cyan-400" : "text-magenta-400"
                        )}>
                          {msg.senderName}
                        </span>
                        {msg.teamOnly && (
                          <span className="text-[8px] bg-white/10 px-1 rounded uppercase font-bold text-white/40">TEAM</span>
                        )}
                      </div>
                      <div className="break-words leading-relaxed">{msg.text}</div>
                    </motion.div>
                  ))}
              </AnimatePresence>
            </div>

            {isChatOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="pointer-events-auto"
              >
                <div className="relative">
                  <div className={cn(
                    "absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase tracking-widest pointer-events-none",
                    teamOnlyChat ? (gameState.players[myId]?.team === 1 ? "text-cyan-400" : "text-magenta-400") : "text-white/40"
                  )}>
                    {teamOnlyChat ? "TEAM:" : "GLOBAL:"}
                  </div>
                  <input
                    autoFocus
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    className={cn(
                      "w-full bg-black/60 border rounded-xl py-3 pl-16 pr-4 outline-none transition-all",
                      teamOnlyChat 
                        ? (gameState.players[myId]?.team === 1 ? "border-cyan-500/50" : "border-magenta-500/50")
                        : "border-white/20 focus:border-white/40"
                    )}
                    placeholder="Enter message..."
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
