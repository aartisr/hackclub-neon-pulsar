import Peer, { DataConnection } from 'peerjs';
import type { GameAction, GameState } from '../../types/game';
import { isGameState, parseClientAction, stateForPeer } from './protocol';

export class PeerManager {
  private peer: Peer;
  private connections: Map<string, DataConnection> = new Map();
  private onStateUpdate: (state: GameState) => void;
  private onAction: (action: GameAction, peerId: string) => void;
  private onConnectionLost?: () => void;
  private disposed = false;
  public isHost: boolean = false;
  public myId: string = '';

  constructor(
    onStateUpdate: (state: GameState) => void,
    onAction: (action: GameAction, peerId: string) => void,
    onConnectionLost?: () => void,
    peer?: Peer
  ) {
    this.onStateUpdate = onStateUpdate;
    this.onAction = onAction;
    this.onConnectionLost = onConnectionLost;
    // Generate a clean ID or let PeerJS generate one
    this.peer = peer ?? new Peer();
    
    this.peer.on('open', (id) => {
      this.myId = id;
      console.log('My peer ID is: ' + id);
    });

    this.peer.on('connection', (conn) => {
      if (this.isHost) this.handleConnection(conn);
      else conn.close();
    });
  }

  public onOpen(callback: (id: string) => void) {
    if (this.myId) {
      callback(this.myId);
    } else {
      this.peer.on('open', callback);
    }
  }

  public ready(): Promise<string> {
    if (this.disposed) return Promise.reject(new Error('Network connection was closed. Try again.'));
    if (this.myId) return Promise.resolve(this.myId);
    return new Promise((resolve, reject) => {
      const timeout = window.setTimeout(() => finish(new Error('Signaling server did not respond. Check your connection and try again.')), 10000);
      const onOpen = (id: string) => finish(undefined, id);
      const onError = (error: Error) => finish(error);
      const finish = (error?: Error, id?: string) => {
        window.clearTimeout(timeout);
        this.peer.off('open', onOpen);
        this.peer.off('error', onError);
        if (error) reject(error);
        else resolve(id || this.myId);
      };
      this.peer.on('open', onOpen);
      this.peer.on('error', onError);
    });
  }

  public host() {
    this.isHost = true;
  }

  public join(hostId: string, joinAction: GameAction): Promise<void> {
    if (this.disposed) return Promise.reject(new Error('Network connection was closed. Try again.'));
    return new Promise((resolve, reject) => {
      const conn = this.peer.connect(hostId);
      this.handleConnection(conn);

      let settled = false;
      const timeout = window.setTimeout(() => finish(new Error('Connection timed out. Check the room code and try again.')), 15000);
      const onPeerError = (error: Error) => finish(error);
      const onClose = () => finish(new Error('Connection closed before joining the arena.'));
      const onOpen = () => {
        try {
          conn.send(joinAction);
        } catch (error) {
          finish(error instanceof Error ? error : new Error('Could not send join request.'));
        }
      };
      const onData = (data: unknown) => {
        if (isGameState(data) && Object.hasOwn(data.players, this.myId)) finish();
      };
      const finish = (error?: Error) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timeout);
        this.peer.off('error', onPeerError);
        conn.off('error', onPeerError);
        conn.off('close', onClose);
        conn.off('open', onOpen);
        conn.off('data', onData);
        if (error) {
          this.connections.delete(conn.peer);
          conn.close();
          reject(error);
        } else {
          resolve();
        }
      };

      this.peer.on('error', onPeerError);
      conn.on('error', onPeerError);
      conn.on('close', onClose);
      conn.on('open', onOpen);
      conn.on('data', onData);
    });
  }

  private handleConnection(conn: DataConnection) {
    conn.on('open', () => {
      this.connections.set(conn.peer, conn);
      console.log('Connected to: ' + conn.peer);
    });

    conn.on('data', (data: unknown) => {
      if (this.isHost) {
        const action = parseClientAction(data);
        if (action) this.onAction(action, conn.peer);
      } else if (isGameState(data)) {
        this.onStateUpdate(data);
      }
    });

    conn.on('close', () => {
      const wasOpen = this.connections.delete(conn.peer);
      if (!this.disposed && wasOpen) {
        if (this.isHost) this.onAction({ type: 'LEAVE' }, conn.peer);
        else this.onConnectionLost?.();
      }
      console.log('Connection closed: ' + conn.peer);
    });
  }

  public broadcastState(state: GameState) {
    if (!this.isHost) return;
    this.connections.forEach((conn) => {
      if (!conn.open) return;
        try { conn.send(stateForPeer(state, conn.peer)); } catch { conn.close(); }
    });
  }

  public sendAction(action: GameAction) {
    if (this.isHost) {
      this.onAction(action, this.myId);
    } else {
      this.connections.forEach((conn) => {
        if (!conn.open) return;
        try { conn.send(action); } catch { conn.close(); }
      });
    }
  }

  public disconnect() {
    this.disposed = true;
    this.peer.destroy();
    this.connections.clear();
  }
}
