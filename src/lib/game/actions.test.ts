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

test('a throw into the opposing colored goal scores for the attacking team', () => {
  for (const [goalZ, scoringTeam] of [[-29, 1], [29, 2]] as const) {
    const state = createInitialGameState();
    state.status = 'playing';
    state.disc.position = [0, 0, goalZ];
    state.disc.velocity = [0, 0, goalZ < 0 ? -2 : 2];
    const next = PhysicsEngine.update(state, {});
    assert.equal(next.score.team1, scoringTeam === 1 ? 1 : 0);
    assert.equal(next.score.team2, scoringTeam === 2 ? 1 : 0);
    assert.deepEqual(next.disc.position, [0, 0, 0]);
  }
});

test('each team can score with a straight throw toward the opposing goal', () => {
  for (const [team, direction] of [[1, -1], [2, 1]] as const) {
    let state = applyGameAction(createInitialGameState(), { type: 'JOIN', name: 'Pilot' }, 'pilot');
    state = applyGameAction(state, { type: 'SWITCH_TEAM', team }, 'pilot');
    state = applyGameAction(state, { type: 'START_GAME' }, 'pilot');
    state.disc.ownerId = 'pilot';
    state.players.pilot.position = [0, 0, 0];
    state = applyGameAction(state, { type: 'THROW', direction: [0, 0, direction] }, 'pilot');
    for (let i = 0; i < 40 && state.score.team1 + state.score.team2 === 0; i++) {
      state = PhysicsEngine.update(state, {});
    }
    assert.equal(state.score.team1, team === 1 ? 1 : 0);
    assert.equal(state.score.team2, team === 2 ? 1 : 0);
  }
});

test('rematch resets the clock and moves pilots back to their team ends', () => {
  let state = applyGameAction(createInitialGameState(), { type: 'JOIN', name: 'Host' }, 'host');
  state.time = 42;
  state.status = 'ended';
  state.players.host.position = [8, 3, -10];
  const next = applyGameAction(state, { type: 'START_GAME' }, 'host');
  assert.equal(next.time, 0);
  assert.deepEqual(next.players.host.position, [0, 0, 25]);
});

test('switching sides during a match moves the player and releases the disc', () => {
  let state = applyGameAction(createInitialGameState(), { type: 'JOIN', name: 'Host' }, 'host');
  state = applyGameAction(state, { type: 'START_GAME' }, 'host');
  state.players.host.position = [3, 4, 0];
  state.players.host.effects = [{ type: 'speed', endTime: 8 }];
  state.disc.ownerId = 'host';
  state.disc.position = [3, 4, 0];
  const next = applyGameAction(state, { type: 'SWITCH_TEAM', team: 2 }, 'host');
  assert.equal(next.players.host.team, 2);
  assert.deepEqual(next.players.host.position, [0, 0, -25]);
  assert.deepEqual(next.players.host.effects, []);
  assert.equal(next.disc.ownerId, null);
  assert.deepEqual(next.disc.position, [0, 0, 0]);
  assert.equal(state.players.host.team, 1);
});
