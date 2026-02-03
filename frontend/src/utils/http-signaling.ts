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

class HttpSignalingService {
  private baseUrl: string;
  private roomId: string | null = null;
  private userId: string | null = null;
  private pollingInterval: NodeJS.Timeout | null = null;
  private lastPollTime: number = 0;

  constructor(baseUrl: string = 'http://localhost:5001') {
    this.baseUrl = baseUrl;
  }

  async connect() {
    console.log('Using HTTP polling signaling service');
    this.userId = Math.random().toString(36).substr(2, 9);
    console.log('Generated user ID:', this.userId);
    return Promise.resolve();
  }

  async joinRoom(roomId: string, userName: string, role: string) {
    console.log('Joining room via HTTP:', { roomId, userName, role });
    
    try {
      const response = await fetch(`${this.baseUrl}/api/signaling/${roomId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'join-room',
          data: { roomId, userName, role, userId: this.userId }
        })
      });
      
      const result = await response.json();
      this.roomId = roomId;
      
      // Start polling for messages
      this.startPolling();
      
      console.log('Successfully joined room:', result);
      return result;
    } catch (error) {
      console.error('Failed to join room:', error);
      throw error;
    }
  }

  async leaveRoom() {
    if (!this.roomId) return;

    try {
      await fetch(`${this.baseUrl}/api/signaling/${this.roomId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'leave-room',
          data: { roomId: this.roomId, userId: this.userId }
        })
      });
      
      this.roomId = null;
      this.stopPolling();
    } catch (error) {
      console.error('Failed to leave room:', error);
    }
  }

  async sendSignalingMessage(message: SignalingMessage, targetUserId?: string) {
    if (!this.roomId) {
      throw new Error('Not in a room');
    }

    try {
      await fetch(`${this.baseUrl}/api/signaling/${this.roomId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'signaling-message',
          data: { message, targetUserId, fromUserId: this.userId }
        })
      });
    } catch (error) {
      console.error('Failed to send signaling message:', error);
    }
  }

  async sendChatMessage(message: string, userName: string) {
    if (!this.roomId) {
      throw new Error('Not in a room');
    }

    try {
      await fetch(`${this.baseUrl}/api/signaling/${this.roomId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'chat-message',
          data: { message, userName, userId: this.userId }
        })
      });
    } catch (error) {
      console.error('Failed to send chat message:', error);
    }
  }

  private startPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }

    this.pollingInterval = setInterval(async () => {
      try {
        await this.pollForMessages();
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 1000); // Poll every second
  }

  private stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  private async pollForMessages() {
    if (!this.roomId) return;

    try {
      const response = await fetch(`${this.baseUrl}/api/room/${this.roomId}/users`);
      const users = await response.json();
      
      // Notify about room users
      if (this.onRoomUsersCallback) {
        this.onRoomUsersCallback(users);
      }
    } catch (error) {
      console.error('Failed to poll for room users:', error);
    }
  }

  // Callbacks
  private onUserJoinedCallback: ((user: RoomUser) => void) | null = null;
  private onUserLeftCallback: ((userId: string) => void) | null = null;
  private onRoomUsersCallback: ((users: RoomUser[]) => void) | null = null;
  private onSignalingMessageCallback: ((message: SignalingMessage, fromUserId: string) => void) | null = null;
  private onChatMessageCallback: ((message: ChatMessage) => void) | null = null;

  onUserJoined(callback: (user: RoomUser) => void) {
    this.onUserJoinedCallback = callback;
  }

  onUserLeft(callback: (userId: string) => void) {
    this.onUserLeftCallback = callback;
  }

  onRoomUsers(callback: (users: RoomUser[]) => void) {
    this.onRoomUsersCallback = callback;
  }

  onSignalingMessage(callback: (message: SignalingMessage, fromUserId: string) => void) {
    this.onSignalingMessageCallback = callback;
  }

  onChatMessage(callback: (message: ChatMessage) => void) {
    this.onChatMessageCallback = callback;
  }

  disconnect() {
    this.leaveRoom();
    this.stopPolling();
  }

  getSocketId(): string | null {
    return this.userId;
  }

  isConnected(): boolean {
    return true; // HTTP is always "connected"
  }
}

export const httpSignalingService = new HttpSignalingService();
