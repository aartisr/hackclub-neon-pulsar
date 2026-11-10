import { cn } from '../../lib/ui/cn';
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatMessage } from '../../types/game';
import { LucideSend, LucideX } from 'lucide-react';

export interface ChatOverlayProps {
  messages: ChatMessage[];
  myTeam?: 1 | 2;
  isChatOpen: boolean;
  teamOnlyChat: boolean;
  chatInput: string;
  onChangeChatInput: (text: string) => void;
  onSendChat: () => void;
  onCloseChat: () => void;
  onChangeTeamOnlyChat: (teamOnly: boolean) => void;
  onOpenChat: () => void;
  isTouch: boolean;
}

export const ChatOverlay: React.FC<ChatOverlayProps> = ({
  messages,
  myTeam,
  isChatOpen,
  teamOnlyChat,
  chatInput,
  onChangeChatInput,
  onSendChat,
  onCloseChat,
  onChangeTeamOnlyChat,
  onOpenChat,
  isTouch,
}) => {
  const visibleMessages = messages
    .filter(msg => !msg.teamOnly || (msg.teamOnly && msg.team === myTeam))
    .slice(isTouch ? -2 : -4);

  return (
    <div className={cn(
      'absolute z-20 space-y-2 pointer-events-none max-w-[calc(100vw-2rem)]',
      isTouch
        ? isChatOpen ? 'bottom-[max(1rem,env(safe-area-inset-bottom))] left-4 right-4' : 'bottom-[calc(11rem+env(safe-area-inset-bottom))] left-4 w-64'
        : 'bottom-20 left-4 sm:left-6 w-72 sm:w-80'
    )}>
      <div aria-live="polite" className="flex flex-col gap-2 mb-2">
        <AnimatePresence>
          {visibleMessages.map((msg, idx) => (
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

      {!isChatOpen && !isTouch && (
        <button type="button" onClick={onOpenChat} className="pointer-events-auto rounded-xl border border-cyan-400/40 bg-black/85 px-3 py-2 text-xs font-bold text-cyan-200 shadow-lg hover:bg-cyan-950" aria-label="Open chat">
          Chat with everyone (T) · Team chat (Y)
        </button>
      )}

      {isChatOpen && (
        <motion.div
          key="chat-input-container"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="pointer-events-auto"
        >
          <div className="mb-2 flex items-center justify-between rounded-xl border border-white/15 bg-black/85 p-1.5 text-xs text-white">
              <div className="flex gap-1" aria-label="Chat audience">
                <button type="button" onClick={() => onChangeTeamOnlyChat(false)} aria-pressed={!teamOnlyChat} className={cn('min-h-10 rounded-lg px-3 font-bold', !teamOnlyChat ? 'bg-cyan-400 text-black' : 'text-white/70')}>Everyone</button>
                <button type="button" onClick={() => onChangeTeamOnlyChat(true)} aria-pressed={teamOnlyChat} className={cn('min-h-10 rounded-lg px-3 font-bold', teamOnlyChat ? 'bg-cyan-400 text-black' : 'text-white/70')}>Team</button>
              </div>
              <button type="button" onClick={onCloseChat} aria-label="Close chat" className="flex h-10 w-10 items-center justify-center rounded-lg text-white/70"><LucideX size={18} /></button>
            </div>
          <div className="relative flex gap-2">
            <div className={cn(
              "absolute left-3 top-1/2 -translate-y-1/2 text-[9px] font-black uppercase tracking-widest pointer-events-none",
              teamOnlyChat ? (myTeam === 1 ? "text-cyan-400" : "text-magenta-400") : "text-white/40"
            )}>
              {teamOnlyChat ? "TEAM:" : "ALL:"}
            </div>
            <input
              autoFocus
              type="text"
              value={chatInput}
              onChange={(e) => onChangeChatInput(e.target.value)}
              onKeyDown={(event) => {
                event.stopPropagation();
                if (event.key === 'Enter') { event.preventDefault(); onSendChat(); }
                if (event.key === 'Escape') onCloseChat();
              }}
              maxLength={240}
              placeholder="Press Enter to send, ESC to cancel..."
              className={cn(
                "min-w-0 flex-1 bg-black/90 border rounded-xl py-3 pl-12 pr-3 text-base sm:text-sm outline-none transition-all text-white",
                teamOnlyChat 
                  ? (myTeam === 1 ? "border-cyan-400 focus:border-cyan-300" : "border-magenta-400 focus:border-magenta-300")
                  : "border-white/20 focus:border-white/50"
              )}
            />
            <button type="button" onClick={onSendChat} disabled={!chatInput.trim()} aria-label="Send chat message" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-cyan-400 text-black disabled:opacity-40"><LucideSend size={19} /></button>
          </div>
        </motion.div>
      )}
    </div>
  );
};
