import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { ReplayFrame } from '../../types/game';
import { synthesizeReplayState } from './synthesize';

const frames: ReplayFrame[] = [
  { time: 0, discPosition: [0, 0, 0], discVelocity: [1, 0, 0], score: { team1: 0, team2: 0 }, players: { pilot: { id: 'pilot', name: 'Pilot', team: 1, position: [0, 0, 0] } } },
  { time: 1, discPosition: [10, 0, 0], discVelocity: [1, 0, 0], score: { team1: 1, team2: 0 }, players: { pilot: { id: 'pilot', name: 'Pilot', team: 1, position: [2, 0, 0] } } },
];

test('replay interpolation clamps time and interpolates positions', () => {
  assert.equal(synthesizeReplayState([], 0), null);
  assert.deepEqual(synthesizeReplayState(frames, 0.5)?.disc.position, [5, 0, 0]);
  assert.deepEqual(synthesizeReplayState(frames, 0.5)?.players.pilot.position, [1, 0, 0]);
  assert.deepEqual(synthesizeReplayState(frames, 3)?.disc.position, [10, 0, 0]);
});
