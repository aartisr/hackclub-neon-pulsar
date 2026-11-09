import Peer, { DataConnection } from 'peerjs';

export type GameState = {
  players: Record<string, PlayerState>;
  disc: DiscState;
  score: { team1: number; team2: number };
  time: number;
  status: 'lobby' | 'playing' | 'ended';
  messages: ChatMessage[];
  powerUps: PowerUpState[];
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

export type GameAction = 
  | { type: 'JOIN'; name: string; color?: string; shape?: 'capsule' | 'cube' | 'sphere' | 'octa' }
  | { type: 'READY'; ready: boolean }
  | { type: 'MOVE'; input: { x: number; y: number; z: number; jump: boolean; dash: boolean } }
  | { type: 'THROW'; direction: [number, number, number] }
  | { type: 'CHAT'; text: string; teamOnly: boolean }
  | { type: 'CUSTOMIZE'; color: string; shape: 'capsule' | 'cube' | 'sphere' | 'octa' }
  | { type: 'START_GAME' };

export class PeerManager {
  private peer: Peer;
  private connections: Map<string, DataConnection> = new Map();
  private onStateUpdate: (state: GameState) => void;
  private onAction: (action: GameAction, peerId: string) => void;
  public isHost: boolean = false;
  public myId: string = '';

  constructor(
    onStateUpdate: (state: GameState) => void,
    onAction: (action: GameAction, peerId: string) => void
  ) {
    this.onStateUpdate = onStateUpdate;
    this.onAction = onAction;
    // Generate a clean ID or let PeerJS generate one
    this.peer = new Peer();
    
    this.peer.on('open', (id) => {
      this.myId = id;
      console.log('My peer ID is: ' + id);
    });

    this.peer.on('connection', (conn) => {
      this.handleConnection(conn);
    });
  }

  public host() {
    this.isHost = true;
  }

  public join(hostId: string) {
    const conn = this.peer.connect(hostId);
    this.handleConnection(conn);
  }

  private handleConnection(conn: DataConnection) {
    conn.on('open', () => {
      this.connections.set(conn.peer, conn);
      console.log('Connected to: ' + conn.peer);
    });

    conn.on('data', (data: any) => {
      if (this.isHost) {
        this.onAction(data as GameAction, conn.peer);
      } else {
        this.onStateUpdate(data as GameState);
      }
    });

    conn.on('close', () => {
      this.connections.delete(conn.peer);
      console.log('Connection closed: ' + conn.peer);
    });
  }

  public broadcastState(state: GameState) {
    if (!this.isHost) return;
    this.connections.forEach((conn) => {
      conn.send(state);
    });
  }

  public sendAction(action: GameAction) {
    if (this.isHost) {
      this.onAction(action, this.myId);
    } else {
      this.connections.forEach((conn) => {
        conn.send(action);
      });
    }
  }

  public disconnect() {
    this.peer.destroy();
  }
}
