import { signalingService, type SignalingMessage } from './signaling';

export interface WebRTCConfig {
  iceServers: RTCIceServer[];
}

export class VideoCallManager {
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private peerConnection: RTCPeerConnection | null = null;
  private localVideoRef: HTMLVideoElement | null = null;
  private remoteVideoRef: HTMLVideoElement | null = null;
  private onRemoteStreamCallback?: (stream: MediaStream) => void;
  private onConnectionStateChangeCallback?: (state: RTCPeerConnectionState) => void;

  constructor(config?: WebRTCConfig) {
    const defaultConfig: WebRTCConfig = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ]
    };

    this.peerConnection = new RTCPeerConnection(config || defaultConfig);
    this.setupPeerConnection();
  }

  private setupPeerConnection() {
    if (!this.peerConnection) return;

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        // Send ICE candidate to remote peer
        this.sendSignalingMessage({
          type: 'ice-candidate',
          data: event.candidate,
          candidate: event.candidate
        });
      }
    };

    this.peerConnection.ontrack = (event) => {
      console.log('Received remote stream');
      this.remoteStream = event.streams[0];
      if (this.remoteVideoRef) {
        this.remoteVideoRef.srcObject = this.remoteStream;
      }
      if (this.onRemoteStreamCallback) {
        this.onRemoteStreamCallback(this.remoteStream);
      }
    };

    this.peerConnection.onconnectionstatechange = () => {
      console.log('Connection state:', this.peerConnection?.connectionState);
      if (this.onConnectionStateChangeCallback) {
        this.onConnectionStateChangeCallback(this.peerConnection?.connectionState || 'failed');
      }
    };
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

      // Add local stream to peer connection
      if (this.peerConnection) {
        this.localStream.getTracks().forEach(track => {
          this.peerConnection?.addTrack(track, this.localStream!);
        });
      }

      return this.localStream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      throw error;
    }
  }

  async createOffer(): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) throw new Error('Peer connection not initialized');

    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);

    return offer;
  }

  async createAnswer(offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) throw new Error('Peer connection not initialized');

    await this.peerConnection.setRemoteDescription(offer);
    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);

    return answer;
  }

  async handleAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
    if (!this.peerConnection) throw new Error('Peer connection not initialized');

    await this.peerConnection.setRemoteDescription(answer);
  }

  async handleIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    if (!this.peerConnection) throw new Error('Peer connection not initialized');

    await this.peerConnection.addIceCandidate(candidate);
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
          // @ts-ignore - Chrome specific
          monitorTypeSurfaces: "include",
          surfaceSwitching: "exclude",
          selfBrowserSurface: "exclude"
        },
        audio: true
      });

      // Strict Validation: Ensure user picked 'Entire Screen'
      const track = screenStream.getVideoTracks()[0];
      // @ts-ignore
      const settings = track.getSettings();
      if (settings.displaySurface !== 'monitor') {
        track.stop();
        throw new Error('ENTIRE_SCREEN_REQUIRED');
      }

      // Replace video track with screen share
      if (this.localStream && this.peerConnection) {
        const videoTrack = screenStream.getVideoTracks()[0];
        const sender = this.peerConnection.getSenders().find(
          s => s.track && s.track.kind === 'video'
        );

        if (sender) {
          await sender.replaceTrack(videoTrack);
        }

        // Handle screen share end
        videoTrack.onended = () => {
          this.stopScreenShare();
        };
      }

      return screenStream;
    } catch (error) {
      console.error('Error starting screen share:', error);
      throw error;
    }
  }

  async stopScreenShare(): Promise<void> {
    // Restore camera video
    if (this.localStream && this.peerConnection) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      const sender = this.peerConnection.getSenders().find(
        s => s.track && s.track.kind === 'video'
      );

      if (sender && videoTrack) {
        await sender.replaceTrack(videoTrack);
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
    if (ref && this.remoteStream) {
      ref.srcObject = this.remoteStream;
    }
  }

  onRemoteStream(callback: (stream: MediaStream) => void): void {
    this.onRemoteStreamCallback = callback;
  }

  onConnectionStateChange(callback: (state: RTCPeerConnectionState) => void): void {
    this.onConnectionStateChangeCallback = callback;
  }

  private sendSignalingMessage(message: SignalingMessage, targetUserId?: string): void {
    try {
      signalingService.sendSignalingMessage(message, targetUserId);
    } catch (error) {
      console.error('Failed to send signaling message:', error);
    }
  }

  disconnect(): void {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
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

  getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }
}
