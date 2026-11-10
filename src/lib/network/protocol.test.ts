import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isGameState, parseClientAction, stateForPeer } from './protocol';
import { createInitialGameState } from '../game/state';
import { applyGameAction } from '../game/actions';

test('clients cannot send host-only actions', () => {
  assert.equal(parseClientAction({ type: 'START_GAME' }), null);
  assert.equal(parseClientAction({ type: 'LEAVE' }), null);
  assert.equal(parseClientAction({ type: 'MOVE', input: { x: Infinity, y: 0, z: 0 } }), null);
});

test('movement and chat input are bounded at the network boundary', () => {
  assert.deepEqual(parseClientAction({ type: 'MOVE', input: { x: 100, y: -7, z: 0, jump: 1, dash: true } }), {
    type: 'MOVE', input: { x: 1, y: -1, z: 0, jump: false, dash: true },
  });
  const chat = parseClientAction({ type: 'CHAT', text: 'x'.repeat(500), teamOnly: false });
  assert.equal(chat?.type, 'CHAT');
  if (chat?.type === 'CHAT') assert.equal(chat.text.length, 240);
});

test('malformed snapshots are not accepted as game state', () => {
  assert.equal(isGameState(createInitialGameState()), true);
  assert.equal(isGameState({ status: 'playing', players: {}, disc: null }), false);
});

test('team chat is excluded from other teams and spectators without a team', () => {
  let state = createInitialGameState();
  state = applyGameAction(state, { type: 'JOIN', name: 'Cyan' }, 'cyan');
  state = applyGameAction(state, { type: 'JOIN', name: 'Magenta' }, 'magenta');
  state = applyGameAction(state, { type: 'CHAT', text: 'team plan', teamOnly: true }, 'cyan');
  state = applyGameAction(state, { type: 'CHAT', text: 'hello', teamOnly: false }, 'cyan');
  assert.equal(stateForPeer(state, 'cyan').messages.length, 2);
  assert.deepEqual(stateForPeer(state, 'magenta').messages.map(message => message.text), ['hello']);
  assert.deepEqual(stateForPeer(state, 'unknown').messages.map(message => message.text), ['hello']);
});
