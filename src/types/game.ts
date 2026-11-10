export type GameState = {
  players: Record<string, PlayerState>;
  disc: DiscState;
  score: { team1: number; team2: number };
  time: number;
  status: 'lobby' | 'playing' | 'ended';
  messages: ChatMessage[];
  powerUps: PowerUpState[];
  lightProbes?: LightProbeState[];
};

export type LightProbeState = {
  id: string;
  position: [number, number, number];
  intensity: number;
  color: string;
  pulsePhase: number;
  range: number;
};

export type PowerUpState = {
  id: string;
  type: 'speed' | 'size' | 'shield';
  position: [number, number, number];
  active: boolean;
};

export type PlayerEffect = {
  type: 'speed' | 'size' | 'shield';
  endTime: number;
};

export type ChatMessage = {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  team: 1 | 2;
  teamOnly: boolean;
  timestamp: number;
};

export type PlayerState = {
  id: string;
  name: string;
  position: [number, number, number];
  rotation: [number, number, number];
  team: 1 | 2;
  ready: boolean;
  isSpectator: boolean;
  effects: PlayerEffect[];
  customColor?: string;
  avatarShape?: 'capsule' | 'cube' | 'sphere' | 'octa';
};

export type DiscState = {
  position: [number, number, number];
  velocity: [number, number, number];
  ownerId: string | null;
};

export type MoveInput = { x: number; y: number; z: number; jump: boolean; dash: boolean };

export type GameAction =
  | { type: 'JOIN'; name: string; color?: string; shape?: 'capsule' | 'cube' | 'sphere' | 'octa' }
  | { type: 'LEAVE' }
  | { type: 'READY'; ready: boolean }
  | { type: 'MOVE'; input: MoveInput }
  | { type: 'THROW'; direction: [number, number, number] }
  | { type: 'CHAT'; text: string; teamOnly: boolean }
  | { type: 'CUSTOMIZE'; color: string; shape: 'capsule' | 'cube' | 'sphere' | 'octa' }
  | { type: 'SWITCH_TEAM'; team: 1 | 2 }
  | { type: 'START_GAME' };

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

export interface ReplayPlayerFrame {
  id: string;
  name: string;
  team: 1 | 2;
  position: [number, number, number];
  avatarShape?: ChassisType;
  customColor?: string;
}

export interface ReplayFrame {
  time: number;
  discPosition: [number, number, number];
  discVelocity: [number, number, number];
  players: Record<string, ReplayPlayerFrame>;
  score: { team1: number; team2: number };
}

