export interface SignalingMessage {
  type: 'offer' | 'answer' | 'ice-candidate';
  data: any;
  candidate?: RTCIceCandidateInit;
}

export interface RoomUser {
  id: string;
  userName: string;
  role: string;
}

export interface ChatMessage {
  id: string;
  userName: string;
  message: string;
  timestamp: string;
  userId: string;
}

class WebSocketSignalingService {
  private ws: WebSocket | null = null;
  private roomId: string | null = null;
  private userId: string | null = null;

  connect(serverUrl: string = 'ws://localhost:5000') {
    try {
      this.ws = new WebSocket(serverUrl);
      
      this.ws.onopen = () => {
        console.log('Connected to WebSocket signaling server');
        this.userId = Math.random().toString(36).substr(2, 9);
      };

      this.ws.onclose = () => {
        console.log('Disconnected from WebSocket signaling server');
        this.userId = null;
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      return this.ws;
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
      throw error;
    }
  }

  joinRoom(roomId: string, userName: string, role: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }

    this.roomId = roomId;
    this.ws.send(JSON.stringify({
      type: 'join-room',
      data: { roomId, userName, role, userId: this.userId }
    }));
  }

  leaveRoom() {
    if (!this.ws || !this.roomId) return;

    this.ws.send(JSON.stringify({
      type: 'leave-room',
      data: { roomId: this.roomId, userId: this.userId }
    }));
    this.roomId = null;
  }

  sendSignalingMessage(message: SignalingMessage, targetUserId?: string) {
    if (!this.ws || !this.roomId) {
      throw new Error('WebSocket not connected or not in room');
    }

    this.ws.send(JSON.stringify({
      type: 'signaling-message',
      data: {
        roomId: this.roomId,
        message,
        targetUserId,
        fromUserId: this.userId
      }
    }));
  }

  sendChatMessage(message: string, userName: string) {
    if (!this.ws || !this.roomId) {
      throw new Error('WebSocket not connected or not in room');
    }

    this.ws.send(JSON.stringify({
      type: 'chat-message',
      data: {
        roomId: this.roomId,
        message,
        userName,
        userId: this.userId
      }
    }));
  }

  onUserJoined(callback: (user: RoomUser) => void) {
    if (!this.ws) return;
    this.setupMessageHandler('user-joined', callback);
  }

  onUserLeft(callback: (userId: string) => void) {
    if (!this.ws) return;
    this.setupMessageHandler('user-left', callback);
  }

  onRoomUsers(callback: (users: RoomUser[]) => void) {
    if (!this.ws) return;
    this.setupMessageHandler('room-users', callback);
  }

  onSignalingMessage(callback: (message: SignalingMessage, fromUserId: string) => void) {
    if (!this.ws) return;
    this.setupMessageHandler('signaling-message', (data: { message: SignalingMessage; fromUserId: string }) => {
      callback(data.message, data.fromUserId);
    });
  }

  onChatMessage(callback: (message: ChatMessage) => void) {
    if (!this.ws) return;
    this.setupMessageHandler('chat-message', callback);
  }

  private setupMessageHandler(eventType: string, callback: (data: any) => void) {
    if (!this.ws) return;

    const messageHandler = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === eventType) {
          callback(message.data);
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    this.ws.addEventListener('message', messageHandler);
  }

  disconnect() {
    if (this.ws) {
      this.leaveRoom();
      this.ws.close();
      this.ws = null;
    }
  }

  getSocketId(): string | null {
    return this.userId;
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

export const webSocketSignalingService = new WebSocketSignalingService();
