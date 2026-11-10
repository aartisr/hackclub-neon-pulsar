import type { GameAction, GameState } from '../../types/game';
import { PhysicsEngine } from './Physics';
import { cloneGameState } from './state';

export function applyGameAction(state: GameState, action: GameAction, peerId: string): GameState {
  if (action.type === 'MOVE' || !peerId) return state;
  const next = cloneGameState(state);
  const player = next.players[peerId];

  switch (action.type) {
    case 'JOIN': {
      // Keep snapshots within the network protocol's player limit.
      if (player || Object.keys(next.players).length >= 64) return state;
      const team1Count = Object.values(next.players).filter(p => p.team === 1).length;
      const team2Count = Object.values(next.players).filter(p => p.team === 2).length;
      const team: 1 | 2 = team1Count <= team2Count ? 1 : 2;
      next.players[peerId] = {
        id: peerId,
        name: action.name.trim().slice(0, 32) || 'Unknown Pilot',
        position: [0, 0, team === 1 ? 25 : -25],
        rotation: [0, 0, 0],
        team,
        ready: false,
        isSpectator: state.status !== 'lobby',
        effects: [],
        customColor: action.color,
        avatarShape: action.shape || 'capsule',
      };
      break;
    }
    case 'LEAVE':
      if (!player) return state;
      delete next.players[peerId];
      if (next.disc.ownerId === peerId) next.disc.ownerId = null;
      break;
    case 'SWITCH_TEAM':
      if (!player || state.status !== 'lobby') return state;
      player.team = action.team;
      player.position[2] = action.team === 1 ? 25 : -25;
      break;
    case 'READY':
      if (!player) return state;
      player.ready = action.ready;
      break;
    case 'THROW':
      if (!player || next.disc.ownerId !== peerId || state.status !== 'playing') return state;
      next.disc.ownerId = null;
      next.disc.velocity = [
        Number.isFinite(action.direction[0]) ? Math.max(-2, Math.min(2, action.direction[0] * 1.8)) : 0,
        Number.isFinite(action.direction[1]) ? Math.max(-2, Math.min(2, action.direction[1] * 1.8)) : 0.05,
        Number.isFinite(action.direction[2]) ? Math.max(-2, Math.min(2, action.direction[2] * 1.8)) : (player.team === 1 ? -1.8 : 1.8),
      ];
      break;
    case 'CHAT': {
      if (!player) return state;
      const message = action.text.trim().slice(0, 240);
      if (!message) return state;
      next.messages = [
        ...next.messages.slice(-9),
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          senderId: peerId,
          senderName: player.name,
          text: message,
          team: player.team,
          teamOnly: action.teamOnly,
          timestamp: Date.now(),
        },
      ];
      break;
    }
    case 'CUSTOMIZE':
      if (!player) return state;
      player.customColor = action.color;
      player.avatarShape = action.shape;
      break;
    case 'START_GAME':
      if (state.status === 'playing') return state;
      next.status = 'playing';
      for (const participant of Object.values(next.players)) {
        participant.isSpectator = false;
        participant.effects = [];
      }
      next.powerUps = [];
      PhysicsEngine.resetDisc(next, true);
      break;
  }
  return next;
}
