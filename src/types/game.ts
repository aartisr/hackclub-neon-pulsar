import { GameState, PlayerState, DiscState, GameAction, PowerUpState, ChatMessage } from '../lib/network/PeerManager';

export type { GameState, PlayerState, DiscState, GameAction, PowerUpState, ChatMessage };

export type ChassisType = 'capsule' | 'cube' | 'sphere' | 'octa';

export interface ChassisOption {
  id: ChassisType;
  label: string;
  desc: string;
}

export interface ColorOption {
  hex: string;
  name: string;
}

export const CHASSIS_TYPES: ChassisOption[] = [
  { id: 'capsule', label: 'Capsule', desc: 'Aerodynamic Zero-G' },
  { id: 'cube', label: 'Cube', desc: 'Reinforced Bulkhead' },
  { id: 'sphere', label: 'Sphere', desc: 'Isotropic Kinetic' },
  { id: 'octa', label: 'Octa', desc: 'Crystalline Interceptor' },
];

export const COLOR_PALETTE: ColorOption[] = [
  { hex: '#06b6d4', name: 'Cyan Pulsar' },
  { hex: '#d946ef', name: 'Magenta Nova' },
  { hex: '#10b981', name: 'Emerald Flux' },
  { hex: '#f59e0b', name: 'Amber Core' },
  { hex: '#ef4444', name: 'Crimson Surge' },
  { hex: '#ffffff', name: 'Radiant White' },
];

export const INITIAL_GAME_STATE: GameState = {
  players: {},
  disc: { position: [0, 0, 0], velocity: [0, 0, 0], ownerId: null },
  score: { team1: 0, team2: 0 },
  time: 0,
  status: 'lobby',
  messages: [],
  powerUps: [],
};
