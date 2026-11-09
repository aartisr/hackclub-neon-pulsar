import { GameState, PlayerState, DiscState, GameAction, PowerUpState, ChatMessage, LightProbeState } from '../lib/network/PeerManager';

export type { GameState, PlayerState, DiscState, GameAction, PowerUpState, ChatMessage, LightProbeState };

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

export const DEFAULT_LIGHT_PROBES: LightProbeState[] = [
  { id: 'probe-cyan-left', position: [-17, 6, -20], intensity: 1.0, color: '#00ffff', pulsePhase: 0, range: 18 },
  { id: 'probe-cyan-right', position: [17, 6, -20], intensity: 1.0, color: '#00ffff', pulsePhase: Math.PI / 4, range: 18 },
  { id: 'probe-cyan-goal', position: [0, 8, -28], intensity: 1.2, color: '#06b6d4', pulsePhase: Math.PI / 2, range: 22 },
  { id: 'probe-center-high', position: [0, 9, 0], intensity: 1.5, color: '#ffffff', pulsePhase: 0, range: 24 },
  { id: 'probe-center-low', position: [0, -8, 0], intensity: 1.2, color: '#ffffff', pulsePhase: Math.PI, range: 20 },
  { id: 'probe-magenta-left', position: [-17, 6, 20], intensity: 1.0, color: '#ff00ff', pulsePhase: Math.PI / 4, range: 18 },
  { id: 'probe-magenta-right', position: [17, 6, 20], intensity: 1.0, color: '#ff00ff', pulsePhase: Math.PI / 2, range: 18 },
  { id: 'probe-magenta-goal', position: [0, 8, 28], intensity: 1.2, color: '#d946ef', pulsePhase: 0, range: 22 },
];

export const INITIAL_GAME_STATE: GameState = {
  players: {},
  disc: { position: [0, 0, 0], velocity: [0, 0, 0], ownerId: null },
  score: { team1: 0, team2: 0 },
  time: 0,
  status: 'lobby',
  messages: [],
  powerUps: [],
  lightProbes: DEFAULT_LIGHT_PROBES,
};
