import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { test } from 'node:test';
import type Peer from 'peerjs';
import type { DataConnection } from 'peerjs';
import type { GameAction, GameState } from '../../types/game';
import { applyGameAction } from '../game/actions';
import { createInitialGameState } from '../game/state';
import { PeerManager } from './PeerManager';

class FakeConnection extends EventEmitter {
  open = true;
  other?: FakeConnection;

  constructor(public peer: string) { super(); }

  send(data: unknown) {
    queueMicrotask(() => this.other?.emit('data', data));
  }

  close() {
    if (!this.open) return;
    this.open = false;
    this.emit('close');
  }
}

class FakePeer extends EventEmitter {
  remote?: FakePeer;

  connect(_hostId: string): DataConnection {
    const client = new FakeConnection('host');
    const host = new FakeConnection('guest');
    client.other = host;
    host.other = client;
    queueMicrotask(() => {
      this.remote?.emit('connection', host);
      host.emit('open');
      client.emit('open');
    });
    return client as unknown as DataConnection;
  }

  destroy() { this.removeAllListeners(); }
}

test('host delivers a guest chat message to every player immediately', async () => {
  const oldWindow = globalThis.window;
  Object.assign(globalThis, { window: globalThis });
  const hostPeer = new FakePeer();
  const guestPeer = new FakePeer();
  guestPeer.remote = hostPeer;
  let hostState = applyGameAction(createInitialGameState(), { type: 'JOIN', name: 'Host' }, 'host');
  const received: GameState[] = [];
  const host = new PeerManager(() => {}, (action: GameAction, id: string) => {
    hostState = applyGameAction(hostState, action, id);
    host.broadcastState(hostState);
  }, undefined, hostPeer as unknown as Peer);
  const guest = new PeerManager(state => received.push(state), () => {}, undefined, guestPeer as unknown as Peer);
  try {
    hostPeer.emit('open', 'host');
    guestPeer.emit('open', 'guest');
    host.host();
    await guest.join('host', { type: 'JOIN', name: 'Guest' });
    guest.sendAction({ type: 'CHAT', text: 'Can you see this?', teamOnly: false });
    await new Promise<void>(resolve => setTimeout(resolve, 0));
    assert.equal(hostState.messages.at(-1)?.text, 'Can you see this?');
    assert.equal(received.at(-1)?.messages.at(-1)?.text, 'Can you see this?');

    host.sendAction({ type: 'CHAT', text: 'Yes, I can', teamOnly: false });
    await new Promise<void>(resolve => setTimeout(resolve, 0));
    assert.equal(received.at(-1)?.messages.at(-1)?.text, 'Yes, I can');
  } finally {
    host.disconnect();
    guest.disconnect();
    Object.assign(globalThis, { window: oldWindow });
  }
});
