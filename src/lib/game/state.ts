import type { GameState } from '../../types/game';
import { DEFAULT_LIGHT_PROBES } from '../../types/game';

export function createInitialGameState(): GameState {
  return {
    players: {},
    disc: { position: [0, 0, 0], velocity: [0, 0, 0], ownerId: null },
    score: { team1: 0, team2: 0 },
    time: 0,
    status: 'lobby',
    messages: [],
    powerUps: [],
    lightProbes: DEFAULT_LIGHT_PROBES.map(probe => ({ ...probe, position: [...probe.position] })),
  };
}

export function cloneGameState(state: GameState): GameState {
  return {
    ...state,
    players: Object.fromEntries(Object.entries(state.players).map(([id, player]) => [id, {
      ...player,
      position: [...player.position],
      rotation: [...player.rotation],
      effects: player.effects.map(effect => ({ ...effect })),
    }])),
    disc: {
      ...state.disc,
      position: [...state.disc.position],
      velocity: [...state.disc.velocity],
    },
    score: { ...state.score },
    messages: [...state.messages],
    powerUps: state.powerUps.map(powerUp => ({ ...powerUp, position: [...powerUp.position] })),
    lightProbes: state.lightProbes?.map(probe => ({ ...probe, position: [...probe.position] })),
  };
}
