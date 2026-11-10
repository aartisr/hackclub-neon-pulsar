import React from 'react';
import { LucideHome, LucideMenu, LucideX } from 'lucide-react';
import { GameState } from '../../types/game';
import { Scoreboard } from './Scoreboard';
import { GoalBanner } from './GoalBanner';
import { RadarMap } from './RadarMap';
import { Speedometer } from './Speedometer';
import { ControlsGuide } from './ControlsGuide';
import { TouchControls } from './TouchControls';
import { ChatOverlay } from './ChatOverlay';
import { SpectatorBadge } from './SpectatorBadge';

export interface GameHudProps {
  gameState: GameState;
  myId: string;
  isHost: boolean;
  isTouch: boolean;
  isMenuOpen: boolean;
  showControlsHud: boolean;
  goalBanner: { text: string; team: 1 | 2 } | null;
  isChatOpen: boolean;
  teamOnlyChat: boolean;
  chatInput: string;
  onLeaveMatch: () => void;
  onToggleMenu: () => void;
  onCloseMenu: () => void;
  onSwitchTeam: (team: 1 | 2) => void;
  onToggleControlsHud: () => void;
  onChangeChatInput: (text: string) => void;
  onMoveDirection: (axis: 'x' | 'z', value: number) => void;
  onAltitude: (value: number) => void;
  onThrow: () => void;
  onOpenChat: () => void;
  onSendChat: () => void;
  onCloseChat: () => void;
  onChangeTeamOnlyChat: (teamOnly: boolean) => void;
}

export const GameHud: React.FC<GameHudProps> = ({
  gameState,
  myId,
  isHost,
  isTouch,
  isMenuOpen,
  showControlsHud,
  goalBanner,
  isChatOpen,
  teamOnlyChat,
  chatInput,
  onLeaveMatch,
  onToggleMenu,
  onCloseMenu,
  onSwitchTeam,
  onToggleControlsHud,
  onChangeChatInput,
  onMoveDirection,
  onAltitude,
  onThrow,
  onOpenChat,
  onSendChat,
  onCloseChat,
  onChangeTeamOnlyChat,
}) => {
  const localPlayer = gameState.players[myId];
  const myTeam = localPlayer?.team;
  const discOwner = gameState.disc.ownerId ? gameState.players[gameState.disc.ownerId] : null;
  const possession = discOwner?.id === myId
    ? 'You have the disc — press E to throw!'
    : discOwner
      ? discOwner.team === myTeam ? `${discOwner.name} has the disc` : 'Opponent has the disc — intercept it!'
      : 'Fly into the white disc to pick it up';

  return (
    <div className="safe-screen absolute inset-0 pointer-events-none z-10 flex flex-col justify-between overflow-hidden">
      {/* Top Floating Bar */}
      <Scoreboard
        score={gameState.score}
        time={gameState.time}
      />

      <button type="button" onClick={onToggleMenu} aria-expanded={isMenuOpen} aria-label="Open game menu" className="pointer-events-auto absolute right-[max(1rem,env(safe-area-inset-right))] top-[max(1rem,env(safe-area-inset-top))] z-40 flex min-h-12 items-center gap-2 rounded-xl border border-cyan-300/50 bg-black/90 px-4 text-sm font-bold text-white shadow-xl hover:bg-cyan-950 sm:right-6 sm:top-6">
        <LucideMenu size={18} /> Menu <span className="hidden text-xs font-normal text-white/50 sm:inline">(Esc)</span>
      </button>

      {isMenuOpen && (
        <div className="pointer-events-auto absolute inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Game menu">
          <div className="premium-panel w-full max-w-sm rounded-2xl p-5 text-white shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-xl font-bold">Game Menu</h2>
              <button type="button" onClick={onCloseMenu} aria-label="Close game menu" className="rounded-lg p-2 hover:bg-white/10"><LucideX size={20} /></button>
            </div>
            <p className="mb-4 text-sm text-white/70">You are on <strong className={myTeam === 1 ? 'text-cyan-300' : 'text-fuchsia-300'}>{myTeam === 1 ? 'Team Cyan' : 'Team Magenta'}</strong>. Switch sides now or leave the room.</p>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => onSwitchTeam(1)} disabled={myTeam === 1} className="min-h-12 rounded-xl border border-cyan-400/50 bg-cyan-400/15 px-2 text-sm font-bold text-cyan-200 disabled:opacity-40">Join Cyan</button>
              <button type="button" onClick={() => onSwitchTeam(2)} disabled={myTeam === 2} className="min-h-12 rounded-xl border border-fuchsia-400/50 bg-fuchsia-400/15 px-2 text-sm font-bold text-fuchsia-200 disabled:opacity-40">Join Magenta</button>
            </div>
            <button type="button" onClick={onLeaveMatch} className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-bold text-slate-950 hover:bg-cyan-100"><LucideHome size={18} /> Home · Leave Match</button>
            <p className="mt-2 text-center text-xs text-white/50">{isHost ? 'Leaving ends this room for everyone.' : 'Leaving disconnects you from this room.'}</p>
          </div>
        </div>
      )}

      {!localPlayer?.isSpectator && myTeam && (
        <div className="absolute left-1/2 top-[calc(6.5rem+env(safe-area-inset-top))] z-10 w-[min(28rem,calc(100vw-2rem))] -translate-x-1/2 rounded-xl border border-white/20 bg-black/75 px-3 py-2 text-center text-xs text-white shadow-xl backdrop-blur-md sm:top-20" aria-live="polite">
          <div className="font-bold">
            <span className={myTeam === 1 ? 'text-cyan-300' : 'text-fuchsia-300'}>
              {myTeam === 1 ? 'CYAN' : 'MAGENTA'}
            </span>
            {' · '}Score in the {myTeam === 1 ? 'MAGENTA' : 'CYAN'} goal · First to 5
          </div>
          <div className="mt-0.5 text-white/75">{possession}</div>
        </div>
      )}

      {/* Goal Celebration Banner */}
      <GoalBanner banner={goalBanner} />

      {/* Spectator Feed Notification */}
      <SpectatorBadge isSpectator={!!localPlayer?.isSpectator} />

      {/* 2D Top-Down Radar Mini-Map */}
      <RadarMap
        players={gameState.players}
        disc={gameState.disc}
        myId={myId}
        className="absolute top-24 right-6 hidden sm:block"
      />

      {/* Velocity Gauge */}
      {!isTouch && <Speedometer velocity={gameState.disc.velocity} />}

      {/* Touch Flight Controls for Mobile/Tablet */}
      {isTouch && !isChatOpen && !isMenuOpen && (
        <TouchControls
          onMoveDirection={onMoveDirection}
          onAltitude={onAltitude}
          onThrow={onThrow}
          onOpenChat={onOpenChat}
        />
      )}

      {/* Keyboard Controls Guide */}
      {!isTouch && (
        <ControlsGuide
          isVisible={showControlsHud}
          onToggle={onToggleControlsHud}
        />
      )}

      {/* In-Game Chat System */}
      <ChatOverlay
        messages={gameState.messages}
        myTeam={localPlayer?.team}
        isChatOpen={isChatOpen}
        teamOnlyChat={teamOnlyChat}
        chatInput={chatInput}
        onChangeChatInput={onChangeChatInput}
        onSendChat={onSendChat}
        onCloseChat={onCloseChat}
        onChangeTeamOnlyChat={onChangeTeamOnlyChat}
        onOpenChat={onOpenChat}
        isTouch={isTouch}
      />
    </div>
  );
};
