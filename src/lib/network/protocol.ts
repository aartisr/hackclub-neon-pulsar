import type { ChassisType, GameAction, GameState } from '../../types/game';

type Payload = Record<string, unknown>;
const isObject = (value: unknown): value is Payload => typeof value === 'object' && value !== null && !Array.isArray(value);
const isNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const isChassis = (value: unknown): value is ChassisType =>
  value === 'capsule' || value === 'cube' || value === 'sphere' || value === 'octa';
const isColor = (value: unknown): value is string =>
  typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value);
const isVector = (value: unknown): value is [number, number, number] =>
  Array.isArray(value) && value.length === 3 && value.every(isNumber);
const clamp = (value: number) => Math.max(-1, Math.min(1, value));

// Treat data from another browser as untrusted, even when it came through PeerJS.
export function parseClientAction(value: unknown): GameAction | null {
  if (!isObject(value)) return null;
  switch (value.type) {
    case 'JOIN':
      if (typeof value.name !== 'string') return null;
      return {
        type: 'JOIN',
        name: value.name.trim().slice(0, 32),
        color: isColor(value.color) ? value.color : undefined,
        shape: isChassis(value.shape) ? value.shape : undefined,
      };
    case 'MOVE': {
      const input = value.input;
      if (!isObject(input) || !isNumber(input.x) || !isNumber(input.y) || !isNumber(input.z)) return null;
      return { type: 'MOVE', input: {
        x: clamp(input.x), y: clamp(input.y), z: clamp(input.z),
        jump: input.jump === true, dash: input.dash === true,
      } };
    }
    case 'THROW':
      return isVector(value.direction)
        ? { type: 'THROW', direction: value.direction.map(clamp) as [number, number, number] }
        : null;
    case 'CHAT':
      return typeof value.text === 'string' && typeof value.teamOnly === 'boolean'
        ? { type: 'CHAT', text: value.text.slice(0, 240), teamOnly: value.teamOnly }
        : null;
    case 'CUSTOMIZE':
      return isColor(value.color) && isChassis(value.shape)
        ? { type: 'CUSTOMIZE', color: value.color, shape: value.shape }
        : null;
    case 'SWITCH_TEAM':
      return value.team === 1 || value.team === 2 ? { type: 'SWITCH_TEAM', team: value.team } : null;
    case 'READY':
      return typeof value.ready === 'boolean' ? { type: 'READY', ready: value.ready } : null;
    default:
      // START_GAME and LEAVE are host-only actions.
      return null;
  }
}

export function isGameState(value: unknown): value is GameState {
  if (!isObject(value) || !isObject(value.players) || !isObject(value.disc) || !isObject(value.score)) return false;
  if (!isVector(value.disc.position) || !isVector(value.disc.velocity)) return false;
  if (value.disc.ownerId !== null && typeof value.disc.ownerId !== 'string') return false;
  if (!isNumber(value.score.team1) || !isNumber(value.score.team2) || !isNumber(value.time)) return false;
  if (value.status !== 'lobby' && value.status !== 'playing' && value.status !== 'ended') return false;
  if (!Array.isArray(value.messages) || !Array.isArray(value.powerUps)) return false;
  if (Object.keys(value.players).length > 64 || value.messages.length > 50 || value.powerUps.length > 100) return false;
  if (!Object.values(value.players).every(player =>
    isObject(player) && typeof player.id === 'string' && typeof player.name === 'string' &&
    isVector(player.position) && isVector(player.rotation) &&
    (player.team === 1 || player.team === 2) && typeof player.ready === 'boolean' &&
    typeof player.isSpectator === 'boolean' && Array.isArray(player.effects) &&
    player.effects.every((effect: unknown) => isObject(effect) && isNumber(effect.endTime))
  )) return false;
  if (!value.powerUps.every((powerUp: unknown) =>
    isObject(powerUp) && typeof powerUp.id === 'string' && isVector(powerUp.position) &&
    typeof powerUp.active === 'boolean' &&
    (powerUp.type === 'speed' || powerUp.type === 'size' || powerUp.type === 'shield')
  )) return false;
  if (value.lightProbes !== undefined &&
    (!Array.isArray(value.lightProbes) || value.lightProbes.length > 100 ||
      !value.lightProbes.every((probe: unknown) => isObject(probe) && isVector(probe.position) && isNumber(probe.intensity))
    )) return false;
  return value.messages.every((message: unknown) =>
    isObject(message) && typeof message.id === 'string' && typeof message.text === 'string' &&
    typeof message.senderName === 'string' && (message.team === 1 || message.team === 2) &&
    typeof message.teamOnly === 'boolean'
  );
}

export function stateForPeer(state: GameState, peerId: string): GameState {
  const team = state.players[peerId]?.team;
  const visibleMessages = state.messages.filter(message => !message.teamOnly || message.team === team);
  return visibleMessages.length === state.messages.length
    ? state
    : { ...state, messages: visibleMessages };
}
