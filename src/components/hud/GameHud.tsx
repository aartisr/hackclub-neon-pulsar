import React from 'react';
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
  isTouch: boolean;
  showControlsHud: boolean;
  goalBanner: { text: string; team: 1 | 2 } | null;
  isChatOpen: boolean;
  teamOnlyChat: boolean;
  chatInput: string;
  onLeaveMatch: () => void;
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
  isTouch,
  showControlsHud,
  goalBanner,
  isChatOpen,
  teamOnlyChat,
  chatInput,
  onLeaveMatch,
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

  return (
    <div className="safe-screen absolute inset-0 pointer-events-none z-10 flex flex-col justify-between overflow-hidden">
      {/* Top Floating Bar */}
      <Scoreboard
        score={gameState.score}
        time={gameState.time}
        onLeave={onLeaveMatch}
      />

      {/* Goal Celebration Banner */}
      <GoalBanner banner={goalBanner} />

      {/* Spectator Feed Notification */}
      <SpectatorBadge isSpectator={!!localPlayer?.isSpectator} />

      {/* 2D Top-Down Radar Mini-Map */}
      <RadarMap
        players={gameState.players}
        disc={gameState.disc}
        myId={myId}
        className="absolute top-6 right-6 hidden sm:block"
      />

      {/* Velocity Gauge */}
      {!isTouch && <Speedometer velocity={gameState.disc.velocity} />}

      {/* Touch Flight Controls for Mobile/Tablet */}
      {isTouch && !isChatOpen && (
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
        isTouch={isTouch}
      />
    </div>
  );
};
