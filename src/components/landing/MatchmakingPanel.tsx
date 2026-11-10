import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { LucideZap, LucideUsers, LucideGamepad2, LucideHelpCircle, LucideChevronDown, LucideChevronUp, LucideLoaderCircle } from 'lucide-react';
import { cn } from '../../lib/ui/cn';

interface MatchmakingPanelProps {
  roomCode: string;
  onChangeRoomCode: (code: string) => void;
  onQuickMatch: () => void;
  onHost: () => void;
  onJoin: () => void;
  joining: boolean;
  joinError: string;
}

export function MatchmakingPanel({ roomCode, onChangeRoomCode, onQuickMatch, onHost, onJoin, joining, joinError }: MatchmakingPanelProps) {
  const [howToPlayOpen, setHowToPlayOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(Boolean(roomCode));
  const inputRef = useRef<HTMLInputElement | null>(null);
  const focusRequestedRef = useRef(false);

  useEffect(() => {
    if (roomCode) setJoinOpen(true);
  }, [roomCode]);

  const setJoinInput = (input: HTMLInputElement | null) => {
    inputRef.current = input;
    if (input && focusRequestedRef.current) {
      input.focus();
      focusRequestedRef.current = false;
    }
  };

  const openJoin = () => {
    focusRequestedRef.current = true;
    setJoinOpen(true);
    if (inputRef.current) {
      inputRef.current.focus();
      focusRequestedRef.current = false;
    }
  };

  return (
    <div className="space-y-3">
      {/* Quick Match Instant Play Button */}
      <button
        type="button"
        onClick={onQuickMatch}
        disabled={joining}
        className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-cyan-400 via-amber-400 to-magenta-500 text-black font-extrabold uppercase tracking-wider flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(6,182,212,0.5)] hover:scale-[1.02] active:scale-95 transition-all text-xs group"
      >
        <div className="w-8 h-8 rounded-xl bg-black/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
          <LucideZap size={20} className="fill-black text-black" />
        </div>
        <div className="text-left leading-tight">
          <div className="font-black text-xs tracking-wider flex items-center gap-2">
            QUICK MATCH <span className="text-[9px] bg-black text-cyan-300 font-mono-code px-1.5 py-0.2 rounded font-black">INSTANT PLAY</span>
          </div>
          <div className="text-[10px] opacity-80 font-bold uppercase">Start solo now; friends can join next round</div>
        </div>
      </button>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onHost}
          disabled={joining}
          className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold uppercase tracking-tight transition-all shadow-[0_0_25px_rgba(6,182,212,0.4)] hover:scale-[1.02] active:scale-95 group"
        >
          <LucideUsers size={20} className="mb-1 text-black group-hover:scale-110 transition-transform" />
          <span className="text-xs font-black">Host Arena</span>
          <span className="text-[9px] font-medium opacity-70">Create a room to invite friends</span>
        </button>
        <button
          type="button"
          onClick={openJoin}
          disabled={joining}
          aria-expanded={joinOpen}
          aria-controls="join-code-entry"
          className={cn(
            "flex flex-col items-center justify-center p-3.5 rounded-2xl border transition-all hover:scale-[1.02] active:scale-95 group disabled:opacity-60",
            joinOpen
              ? "bg-magenta-500/20 border-magenta-500 text-magenta-300"
              : "bg-white/5 hover:bg-white/10 border-white/15 text-white"
          )}
        >
          {joining && joinOpen
            ? <LucideLoaderCircle size={20} className="mb-1 animate-spin text-magenta-300" aria-hidden="true" />
            : <LucideGamepad2 size={20} className="mb-1 text-magenta-400 group-hover:scale-110 transition-transform" />}
          <span className="text-xs font-black uppercase">Join Arena</span>
          <span className="text-[10px] text-white/60">{joining && joinOpen ? 'Connecting now' : joinOpen ? 'Enter code below' : 'Connect via code'}</span>
        </button>
      </div>

      {/* Direct Join Code Input Drawer */}
      {joinOpen && (
        <motion.form
          id="join-code-entry"
          key="landing-join-box"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          onSubmit={(event) => { event.preventDefault(); onJoin(); }}
          className="space-y-2 rounded-2xl border border-magenta-400/30 bg-magenta-400/[0.06] p-3"
        >
          <p className="text-xs text-white/70">Paste the full room code or invite link.</p>
          <input
            ref={setJoinInput}
            type="text"
            aria-label="Room code or invite link"
            autoComplete="off"
            spellCheck={false}
            placeholder="Paste room code or invite link..."
            value={roomCode}
            onChange={(e) => onChangeRoomCode(e.target.value)}
            className="w-full min-h-11 bg-white/5 border border-magenta-500/40 rounded-xl px-4 py-2.5 text-base sm:text-sm outline-none focus:border-magenta-400 transition-colors font-mono-code text-center tracking-wider text-white"
          />
          <button
            type="submit"
            disabled={!roomCode.trim() || joining}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-magenta-500 py-2.5 text-xs font-extrabold uppercase tracking-wider text-black shadow-[0_0_20px_rgba(217,70,239,0.3)] transition-all hover:bg-magenta-400 disabled:opacity-40"
          >
            {joining && <LucideLoaderCircle size={17} className="animate-spin" aria-hidden="true" />}
            {joining ? 'Connecting to Arena' : 'Connect to Arena'}
          </button>
          {joining && <p role="status" aria-live="polite" className="text-center text-xs text-magenta-200">Finding the host and joining your room…</p>}
        </motion.form>
      )}

      {joinError && <p role="alert" className="text-xs text-red-300 text-center">{joinError}</p>}

      {/* Collapsible How-To-Play Guide */}
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
              One player hosts and shares the invite link. Others join that room. Fly into the white disc to pick it up; press E to throw into the other team's colored goal. First to 5 wins.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
