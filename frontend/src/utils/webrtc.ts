import { io, Socket } from 'socket.io-client';

export interface WebRTCConfig {
  iceServers: RTCIceServer[];
}

// Socket.io needs the base URL without /api path
const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');

export class VideoCallManager {
  private localStream: MediaStream | null = null;
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private localVideoRef: HTMLVideoElement | null = null;
  private remoteVideoRef: HTMLVideoElement | null = null;
  private onRemoteStreamCallback?: (stream: MediaStream) => void;
  private onConnectionStateChangeCallback?: (state: RTCPeerConnectionState) => void;
  private onUserJoinedCallback?: (user: { socketId: string; userName: string; role: string }) => void;
  private onUserLeftCallback?: (user: { socketId: string; userName: string }) => void;
  private socket: Socket | null = null;
  private config: WebRTCConfig;

  constructor(customConfig?: WebRTCConfig) {
    this.config = customConfig || {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ]
    };
  }

  connectToSignalingServer(roomId: string, userId: string, userName: string, role: string): void {
    this.socket = io(BASE_URL, {
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      console.log('Connected to signaling server');
      this.socket?.emit('join-room', { roomId, userId, userName, role });
    });

    // When existing users are in the room, create offers to connect to them
    this.socket.on('existing-users', (users: Array<{ socketId: string; userName: string; role: string }>) => {
      console.log('Existing users in room:', users);
      users.forEach(user => {
        this.createPeerConnection(user.socketId);
        this.createAndSendOffer(user.socketId);
      });
    });

    // When a new user joins, wait for their offer
    this.socket.on('user-joined', (user: { socketId: string; userName: string; role: string }) => {
      console.log('User joined:', user);
      this.createPeerConnection(user.socketId);
      if (this.onUserJoinedCallback) {
        this.onUserJoinedCallback(user);
      }
    });

    // Receive offer from another peer
    this.socket.on('offer', async ({ from, offer }: { from: string; offer: RTCSessionDescriptionInit }) => {
      console.log('Received offer from:', from);
      if (!this.peerConnections.has(from)) {
        this.createPeerConnection(from);
      }
      const pc = this.peerConnections.get(from);
      if (pc) {
        await pc.setRemoteDescription(offer);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        this.socket?.emit('answer', { to: from, answer });
      }
    });

    // Receive answer
    this.socket.on('answer', async ({ from, answer }: { from: string; answer: RTCSessionDescriptionInit }) => {
      console.log('Received answer from:', from);
      const pc = this.peerConnections.get(from);
      if (pc) {
        await pc.setRemoteDescription(answer);
      }
    });

    // Receive ICE candidate
    this.socket.on('ice-candidate', async ({ from, candidate }: { from: string; candidate: RTCIceCandidateInit }) => {
      const pc = this.peerConnections.get(from);
      if (pc && candidate) {
        await pc.addIceCandidate(candidate);
      }
    });

    // Handle user leaving
    this.socket.on('user-left', ({ socketId, userName }: { socketId: string; userName: string }) => {
      console.log('User left:', userName);
      const pc = this.peerConnections.get(socketId);
      if (pc) {
        pc.close();
        this.peerConnections.delete(socketId);
      }
      if (this.onUserLeftCallback) {
        this.onUserLeftCallback({ socketId, userName });
      }
    });
  }

  private createPeerConnection(socketId: string): RTCPeerConnection {
    const pc = new RTCPeerConnection(this.config);
    this.peerConnections.set(socketId, pc);

    // Add local stream tracks to the connection
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        pc.addTrack(track, this.localStream!);
      });
    }

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.socket?.emit('ice-candidate', {
          to: socketId,
          candidate: event.candidate
        });
      }
    };

    // Handle receiving remote stream
    pc.ontrack = (event) => {
      console.log('Received remote track from:', socketId);
      const remoteStream = event.streams[0];
      if (this.remoteVideoRef) {
        this.remoteVideoRef.srcObject = remoteStream;
      }
      if (this.onRemoteStreamCallback) {
        this.onRemoteStreamCallback(remoteStream);
      }
    };

    // Connection state changes
    pc.onconnectionstatechange = () => {
      console.log(`Connection state with ${socketId}:`, pc.connectionState);
      if (this.onConnectionStateChangeCallback) {
        this.onConnectionStateChangeCallback(pc.connectionState);
      }
    };

    return pc;
  }

  private async createAndSendOffer(socketId: string): Promise<void> {
    const pc = this.peerConnections.get(socketId);
    if (!pc) return;

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    this.socket?.emit('offer', { to: socketId, offer });
  }

  async initializeLocalStream(video: boolean = true, audio: boolean = true): Promise<MediaStream> {
    try {
      const constraints: MediaStreamConstraints = {
        video: video ? {
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } : false,
        audio: audio
      };

      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);

      if (this.localVideoRef) {
        this.localVideoRef.srcObject = this.localStream;
      }

      return this.localStream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      throw error;
    }
  }

  toggleVideo(enabled: boolean): void {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = enabled;
      }
    }
  }

  toggleAudio(enabled: boolean): void {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = enabled;
      }
    }
  }

  async startScreenShare(): Promise<MediaStream> {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'monitor',
        },
        audio: true
      });

      const videoTrack = screenStream.getVideoTracks()[0];

      // Replace video track in all peer connections
      this.peerConnections.forEach((pc) => {
        const sender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
        if (sender) {
          sender.replaceTrack(videoTrack);
        }
      });

      // Handle screen share end
      videoTrack.onended = () => {
        this.stopScreenShare();
      };

      return screenStream;
    } catch (error) {
      console.error('Error starting screen share:', error);
      throw error;
    }
  }

  async stopScreenShare(): Promise<void> {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        this.peerConnections.forEach((pc) => {
          const sender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
          if (sender) {
            sender.replaceTrack(videoTrack);
          }
        });
      }
    }
  }

  setLocalVideoRef(ref: HTMLVideoElement | null): void {
    this.localVideoRef = ref;
    if (ref && this.localStream) {
      ref.srcObject = this.localStream;
    }
  }

  setRemoteVideoRef(ref: HTMLVideoElement | null): void {
    this.remoteVideoRef = ref;
  }

  onRemoteStream(callback: (stream: MediaStream) => void): void {
    this.onRemoteStreamCallback = callback;
  }

  onConnectionStateChange(callback: (state: RTCPeerConnectionState) => void): void {
    this.onConnectionStateChangeCallback = callback;
  }

  onUserJoined(callback: (user: { socketId: string; userName: string; role: string }) => void): void {
    this.onUserJoinedCallback = callback;
  }

  onUserLeft(callback: (user: { socketId: string; userName: string }) => void): void {
    this.onUserLeftCallback = callback;
  }

  disconnect(): void {
    // Stop all local tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    // Close all peer connections
    this.peerConnections.forEach((pc) => {
      pc.close();
    });
    this.peerConnections.clear();

    // Disconnect socket
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    if (this.localVideoRef) {
      this.localVideoRef.srcObject = null;
    }

    if (this.remoteVideoRef) {
      this.remoteVideoRef.srcObject = null;
    }
  }

  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}
