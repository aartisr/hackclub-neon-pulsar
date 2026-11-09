import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatMessage } from '../../types/game';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface ChatOverlayProps {
  messages: ChatMessage[];
  myTeam?: 1 | 2;
  isChatOpen: boolean;
  teamOnlyChat: boolean;
  chatInput: string;
  onChangeChatInput: (text: string) => void;
}

export const ChatOverlay: React.FC<ChatOverlayProps> = ({
  messages,
  myTeam,
  isChatOpen,
  teamOnlyChat,
  chatInput,
  onChangeChatInput,
}) => {
  const visibleMessages = messages
    .filter(msg => !msg.teamOnly || (msg.teamOnly && msg.team === myTeam))
    .slice(-4);

  return (
    <div className="absolute bottom-20 left-4 sm:left-6 w-72 sm:w-80 space-y-2 pointer-events-none z-20">
      <div className="flex flex-col gap-2 mb-2">
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
              teamOnlyChat ? (myTeam === 1 ? "text-cyan-400" : "text-magenta-400") : "text-white/40"
            )}>
              {teamOnlyChat ? "TEAM:" : "ALL:"}
            </div>
            <input
              autoFocus
              type="text"
              value={chatInput}
              onChange={(e) => onChangeChatInput(e.target.value)}
              placeholder="Press Enter to send, ESC to cancel..."
              className={cn(
                "w-full bg-black/80 border rounded-xl py-2 pl-12 pr-3 text-xs outline-none transition-all text-white",
                teamOnlyChat 
                  ? (myTeam === 1 ? "border-cyan-400 focus:border-cyan-300" : "border-magenta-400 focus:border-magenta-300")
                  : "border-white/20 focus:border-white/50"
              )}
            />
          </div>
        </motion.div>
      )}
    </div>
  );
};
