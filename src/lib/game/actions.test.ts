import assert from 'node:assert/strict';
import { test } from 'node:test';
import { applyGameAction } from './actions';
import { PhysicsEngine } from './Physics';
import { createInitialGameState } from './state';

test('new matches have independent state', () => {
  const first = createInitialGameState();
  const second = createInitialGameState();
  first.disc.position[0] = 42;
  first.lightProbes![0].position[0] = 42;
  assert.equal(second.disc.position[0], 0);
  assert.equal(second.lightProbes![0].position[0], -17);
});

test('joining, switching teams, and leaving preserve previous snapshots', () => {
  const initial = createInitialGameState();
  const host = applyGameAction(initial, { type: 'JOIN', name: 'Host' }, 'host');
  const joined = applyGameAction(host, { type: 'JOIN', name: 'Guest' }, 'guest');
  assert.deepEqual([joined.players.host.team, joined.players.guest.team], [1, 2]);
  assert.equal(Object.keys(initial.players).length, 0);
  assert.equal(Object.keys(host.players).length, 1);

  const switched = applyGameAction(joined, { type: 'SWITCH_TEAM', team: 1 }, 'guest');
  assert.equal(switched.players.guest.team, 1);
  assert.equal(joined.players.guest.team, 2);

  switched.disc.ownerId = 'guest';
  const left = applyGameAction(switched, { type: 'LEAVE' }, 'guest');
  assert.equal(left.players.guest, undefined);
  assert.equal(left.disc.ownerId, null);
  assert.equal(switched.players.guest.team, 1);
});

test('physics updates do not mutate previous game state and spectators cannot collect the disc', () => {
  let state = createInitialGameState();
  state = applyGameAction(state, { type: 'JOIN', name: 'Host' }, 'host');
  state = applyGameAction(state, { type: 'JOIN', name: 'Spectator' }, 'spectator');
  state.players.spectator.isSpectator = true;
  state.players.spectator.position = [0, 0, 0];
  state.disc.position = [0, 0, 0];
  const next = PhysicsEngine.update(state, { spectator: { x: 1, y: 0, z: 0, jump: false, dash: false } });
  assert.deepEqual(state.players.spectator.position, [0, 0, 0]);
  assert.deepEqual(next.players.spectator.position, [0, 0, 0]);
  assert.notEqual(next.disc.ownerId, 'spectator');
  assert.equal(state.time, 0);
  assert.ok(next.time > 0);
});
