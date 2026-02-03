// Simple WebSocket implementation using HTTP upgrade
class SimpleWebSocketServer {
    constructor() {
        this.rooms = new Map();
        this.clients = new Map();
    }

    initialize(server) {
        // Handle WebSocket upgrade requests
        server.on('upgrade', (request, socket, head) => {
            console.log('WebSocket upgrade request received for:', request.url);
            if (request.url === '/ws') {
                console.log('Handling WebSocket upgrade for /ws');
                this.handleUpgrade(request, socket, head);
            } else {
                console.log('Rejecting WebSocket upgrade for:', request.url);
                socket.destroy();
            }
        });
        
        console.log('Simple WebSocket server initialized on /ws endpoint');
    }

    handleUpgrade(request, socket, head) {
        console.log('Starting WebSocket upgrade process...');
        const clientId = Math.random().toString(36).substr(2, 9);
        const client = {
            id: clientId,
            socket: socket,
            roomId: null,
            userName: null,
            role: null
        };

        console.log('Created client with ID:', clientId);
        this.clients.set(clientId, client);

        // Send WebSocket handshake
        const key = request.headers['sec-websocket-key'];
        const acceptKey = this.generateAcceptKey(key);
        
        const response = [
            'HTTP/1.1 101 Switching Protocols',
            'Upgrade: websocket',
            'Connection: Upgrade',
            `Sec-WebSocket-Accept: ${acceptKey}`,
            '',
            ''
        ].join('\r\n');

        socket.write(response);

        // Handle WebSocket messages
        socket.on('data', (data) => {
            try {
                const message = this.parseWebSocketMessage(data);
                if (message) {
                    this.handleMessage(client, message);
                }
            } catch (error) {
                console.error('Failed to parse WebSocket message:', error);
            }
        });

        socket.on('close', () => {
            this.handleDisconnect(client);
        });

        socket.on('error', (error) => {
            console.error('WebSocket error:', error);
        });
    }

    generateAcceptKey(key) {
        const crypto = require('crypto');
        const MAGIC_STRING = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
        return crypto.createHash('sha1')
            .update(key + MAGIC_STRING)
            .digest('base64');
    }

    parseWebSocketMessage(data) {
        // Simple WebSocket frame parsing (text messages only)
        if (data.length < 2) return null;
        
        const firstByte = data[0];
        const secondByte = data[1];
        
        // Check if it's a text frame (opcode 0x1)
        if ((firstByte & 0x0F) !== 0x1) return null;
        
        const masked = (secondByte & 0x80) !== 0;
        let payloadLength = secondByte & 0x7F;
        let offset = 2;
        
        // Handle extended payload length
        if (payloadLength === 126) {
            payloadLength = data.readUInt16BE(offset);
            offset += 2;
        } else if (payloadLength === 127) {
            payloadLength = data.readUIntBE(offset, 8);
            offset += 8;
        }
        
        let maskKey = null;
        if (masked) {
            maskKey = data.slice(offset, offset + 4);
            offset += 4;
        }
        
        const payload = data.slice(offset, offset + payloadLength);
        
        // Unmask payload if needed
        let decodedPayload = payload;
        if (masked && maskKey) {
            decodedPayload = Buffer.alloc(payloadLength);
            for (let i = 0; i < payloadLength; i++) {
                decodedPayload[i] = payload[i] ^ maskKey[i % 4];
            }
        }
        
        try {
            return JSON.parse(decodedPayload.toString('utf8'));
        } catch (error) {
            return null;
        }
    }

    sendWebSocketMessage(client, message) {
        const data = JSON.stringify(message);
        const payload = Buffer.from(data);
        const payloadLength = payload.length;
        
        let frame;
        if (payloadLength < 126) {
            frame = Buffer.alloc(2 + payloadLength);
            frame[0] = 0x81; // FIN=1, opcode=1 (text)
            frame[1] = payloadLength;
            payload.copy(frame, 2);
        } else if (payloadLength < 65536) {
            frame = Buffer.alloc(4 + payloadLength);
            frame[0] = 0x81;
            frame[1] = 126;
            frame.writeUInt16BE(payloadLength, 2);
            payload.copy(frame, 4);
        } else {
            frame = Buffer.alloc(10 + payloadLength);
            frame[0] = 0x81;
            frame[1] = 127;
            frame.writeUIntBE(payloadLength, 2);
            payload.copy(frame, 10);
        }
        
        client.socket.write(frame);
    }

    handleMessage(client, message) {
        const { type, data } = message;
        
        switch (type) {
            case 'join-room':
                this.handleJoinRoom(client, data);
                break;
            case 'leave-room':
                this.handleLeaveRoom(client, data);
                break;
            case 'signaling-message':
                this.handleSignalingMessage(client, data);
                break;
            case 'chat-message':
                this.handleChatMessage(client, data);
                break;
            default:
                console.log('Unknown message type:', type);
        }
    }
    
    handleJoinRoom(client, data) {
        const { roomId, userName, role } = data;
        
        client.roomId = roomId;
        client.userName = userName;
        client.role = role;
        
        if (!this.rooms.has(roomId)) {
            this.rooms.set(roomId, new Map());
        }
        
        const room = this.rooms.get(roomId);
        room.set(client.id, client);
        
        // Notify existing users
        this.broadcastToRoom(roomId, {
            type: 'user-joined',
            data: {
                userId: client.id,
                userName,
                role
            }
        }, client);
        
        // Send current room users to new user
        const roomUsers = Array.from(room.values()).map(user => ({
            id: user.id,
            userName: user.userName,
            role: user.role
        }));
        
        this.sendWebSocketMessage(client, {
            type: 'room-users',
            data: roomUsers
        });
        
        console.log(`User ${userName} (${role}) joined room ${roomId}`);
    }
    
    handleLeaveRoom(client, data) {
        const { roomId } = data;
        
        if (this.rooms.has(roomId)) {
            const room = this.rooms.get(roomId);
            room.delete(client.id);
            
            this.broadcastToRoom(roomId, {
                type: 'user-left',
                data: { userId: client.id }
            });
            
            if (room.size === 0) {
                this.rooms.delete(roomId);
            }
        }
        
        client.roomId = null;
    }
    
    handleSignalingMessage(client, data) {
        const { roomId, message, targetUserId } = data;
        
        if (targetUserId) {
            // Send to specific user
            this.sendToUser(roomId, targetUserId, {
                type: 'signaling-message',
                data: { message, fromUserId: client.id }
            });
        } else {
            // Broadcast to room (except sender)
            this.broadcastToRoom(roomId, {
                type: 'signaling-message',
                data: { message, fromUserId: client.id }
            }, client);
        }
    }
    
    handleChatMessage(client, data) {
        const { roomId, message, userName } = data;
        
        const messageData = {
            id: Date.now().toString(),
            userName,
            message,
            timestamp: new Date().toISOString(),
            userId: client.id
        };
        
        this.broadcastToRoom(roomId, {
            type: 'chat-message',
            data: messageData
        });
    }
    
    handleDisconnect(client) {
        if (client.roomId) {
            this.handleLeaveRoom(client, { roomId: client.roomId });
        }
        
        this.clients.delete(client.id);
    }
    
    broadcastToRoom(roomId, message, excludeClient = null) {
        if (!this.rooms.has(roomId)) return;
        
        const room = this.rooms.get(roomId);
        room.forEach(client => {
            if (client !== excludeClient) {
                this.sendWebSocketMessage(client, message);
            }
        });
    }
    
    sendToUser(roomId, userId, message) {
        if (!this.rooms.has(roomId)) return;
        
        const room = this.rooms.get(roomId);
        const client = room.get(userId);
        
        if (client) {
            this.sendWebSocketMessage(client, message);
        }
    }
}

module.exports = new SimpleWebSocketServer();
