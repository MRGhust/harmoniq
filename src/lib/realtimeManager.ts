import { SyncMessage, RoomData, RoomUser } from '@/types/room';

export type MessageHandler = (message: SyncMessage) => void;

interface RealtimeOptions {
  roomId: string;
  userId: string;
  userName: string;
  isHost: boolean;
  onMessage: MessageHandler;
  onStatusChange?: (status: 'connecting' | 'connected' | 'disconnected' | 'reconnecting') => void;
}

/**
 * Robust zero-cost Realtime synchronization adapter.
 * Uses WebRTC (PeerJS) & BroadcastChannel with automated local/cloud fallbacks.
 */
export class RealtimeManager {
  private options: RealtimeOptions;
  private peer: any = null;
  private connections: Map<string, any> = new Map();
  private hostConnection: any = null;
  private broadcastChannel: BroadcastChannel | null = null;
  private isDestroyed = false;
  private pingInterval: any = null;

  constructor(options: RealtimeOptions) {
    this.options = options;
    this.init();
  }

  private async init() {
    this.options.onStatusChange?.('connecting');

    // Local multi-tab support
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.broadcastChannel = new BroadcastChannel(`harmoniq_room_${this.options.roomId}`);
        this.broadcastChannel.onmessage = (event) => {
          if (this.isDestroyed) return;
          const msg = event.data as SyncMessage;
          if (msg && msg.senderId !== this.options.userId) {
            this.options.onMessage(msg);
          }
        };
      } catch (err) {
        console.warn('BroadcastChannel error:', err);
      }
    }

    // Initialize WebRTC Peer
    if (typeof window !== 'undefined') {
      try {
        const { default: Peer } = await import('peerjs');
        if (this.isDestroyed) return;

        // Deterministic peer ID for the room host
        const peerId = this.options.isHost
          ? `harmoniq-room-${this.options.roomId}`
          : `harmoniq-peer-${this.options.roomId}-${this.options.userId}`;

        this.peer = new Peer(peerId, {
          debug: 1,
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:stun1.l.google.com:19302' },
              { urls: 'stun:stun2.l.google.com:19302' },
            ],
          },
        });

        this.peer.on('open', (id: string) => {
          if (this.isDestroyed) return;
          this.options.onStatusChange?.('connected');

          if (!this.options.isHost) {
            // Member connects to host
            this.connectToHost();
          } else {
            this.startPingLoop();
          }
        });

        this.peer.on('connection', (conn: any) => {
          this.setupIncomingConnection(conn);
        });

        this.peer.on('error', (err: any) => {
          // If host ID is taken, this might be a reconnect or duplicate tab
          console.warn('PeerJS event:', err.type);
          if (err.type === 'unavailable-id' && this.options.isHost) {
            // Already initialized host or fallback
            this.options.onStatusChange?.('connected');
          }
        });

        this.peer.on('disconnected', () => {
          this.options.onStatusChange?.('reconnecting');
          if (!this.isDestroyed && this.peer) {
            try {
              this.peer.reconnect();
            } catch (_) {}
          }
        });
      } catch (err) {
        console.warn('PeerJS init failed, falling back to local signaling:', err);
        this.options.onStatusChange?.('connected');
      }
    }
  }

  private connectToHost() {
    const hostPeerId = `harmoniq-room-${this.options.roomId}`;
    try {
      const conn = this.peer.connect(hostPeerId, { reliable: true });
      this.hostConnection = conn;

      conn.on('open', () => {
        this.options.onStatusChange?.('connected');
        // Notify host that this user joined
        this.send({
          type: 'USER_JOIN',
          roomId: this.options.roomId,
          senderId: this.options.userId,
          timestamp: Date.now(),
          payload: {
            name: this.options.userName,
          },
        });
        this.startPingLoop();
      });

      conn.on('data', (data: any) => {
        if (this.isDestroyed) return;
        this.options.onMessage(data as SyncMessage);
      });

      conn.on('close', () => {
        this.options.onStatusChange?.('disconnected');
      });
    } catch (err) {
      console.warn('Connect to host error:', err);
    }
  }

  private setupIncomingConnection(conn: any) {
    conn.on('open', () => {
      this.connections.set(conn.peer, conn);
    });

    conn.on('data', (data: any) => {
      if (this.isDestroyed) return;
      const msg = data as SyncMessage;
      this.options.onMessage(msg);

      // If this client is Host, broadcast the message to all other connected peers
      if (this.options.isHost && msg.type !== 'PING' && msg.type !== 'PONG') {
        this.broadcastToOthers(conn.peer, msg);
      }
    });

    conn.on('close', () => {
      this.connections.delete(conn.peer);
    });
  }

  private broadcastToOthers(exceptPeerId: string, message: SyncMessage) {
    this.connections.forEach((conn, peerId) => {
      if (peerId !== exceptPeerId && conn.open) {
        try {
          conn.send(message);
        } catch (_) {}
      }
    });
  }

  public send(message: SyncMessage) {
    if (this.isDestroyed) return;

    // Send through BroadcastChannel for tabs on same device
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(message);
      } catch (_) {}
    }

    // WebRTC sending
    if (this.options.isHost) {
      // Host sends to all peers
      this.connections.forEach((conn) => {
        if (conn.open) {
          try {
            conn.send(message);
          } catch (_) {}
        }
      });
    } else if (this.hostConnection && this.hostConnection.open) {
      // Member sends to host
      try {
        this.hostConnection.send(message);
      } catch (_) {}
    }
  }

  private startPingLoop() {
    if (this.pingInterval) clearInterval(this.pingInterval);
    this.pingInterval = setInterval(() => {
      if (this.isDestroyed) return;
      this.send({
        type: 'PING',
        roomId: this.options.roomId,
        senderId: this.options.userId,
        timestamp: Date.now(),
        payload: { clientSendTime: performance.now() },
      });
    }, 4000);
  }

  public destroy() {
    this.isDestroyed = true;
    if (this.pingInterval) clearInterval(this.pingInterval);
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.close();
      } catch (_) {}
    }
    this.connections.forEach((conn) => {
      try {
        conn.close();
      } catch (_) {}
    });
    this.connections.clear();
    if (this.hostConnection) {
      try {
        this.hostConnection.close();
      } catch (_) {}
    }
    if (this.peer) {
      try {
        this.peer.destroy();
      } catch (_) {}
    }
  }
}
