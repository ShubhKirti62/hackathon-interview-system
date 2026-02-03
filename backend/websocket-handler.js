const WebSocket = require('ws');

class WebSocketHandler {
    constructor() {
        this.wss = null;
        this.rooms = new Map();
    }

    initialize(server) {
        this.wss = new WebSocket.Server({ 
            server,
            path: '/ws'
        });
        
        console.log('WebSocket server initialized on path: /ws');
        
        this.wss.on('connection', (ws, request) => {
            console.log('New WebSocket connection established');
            
            const clientId = this.generateClientId();
            const client = {
                id: clientId,
                ws: ws,
                roomId: null,
                userName: null,
                role: null
            };
            
            ws.on('message', (data) => {
                try {
                    const message = JSON.parse(data.toString());
                    console.log('Received message:', message);
                    this.handleMessage(client, message);
                } catch (error) {
                    console.error('Failed to parse message:', error);
                }
            });
            
            ws.on('close', () => {
                console.log('WebSocket connection closed for client:', clientId);
                this.handleDisconnect(client);
            });
            
            ws.on('error', (error) => {
                console.error('WebSocket error:', error);
            });
            
            // Send client ID back to client
            ws.send(JSON.stringify({
                type: 'connected',
                data: { clientId }
            }));
        });
        
        this.wss.on('error', (error) => {
            console.error('WebSocket server error:', error);
        });
    }
    
    generateClientId() {
        return Math.random().toString(36).substr(2, 9);
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
        const { roomId, userName, role, userId } = data;
        
        console.log(`User ${userName} (${role}) joining room ${roomId}`);
        
        client.roomId = roomId;
        client.userName = userName;
        client.role = role;
        
        if (!this.rooms.has(roomId)) {
            this.rooms.set(roomId, new Map());
        }
        
        const room = this.rooms.get(roomId);
        room.set(userId || client.id, client);
        
        // Notify existing users
        this.broadcastToRoom(roomId, {
            type: 'user-joined',
            data: {
                userId: userId || client.id,
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
        
        client.ws.send(JSON.stringify({
            type: 'room-users',
            data: roomUsers
        }));
        
        console.log(`Room ${roomId} now has ${room.size} users`);
    }
    
    handleLeaveRoom(client, data) {
        const { roomId, userId } = data;
        
        if (this.rooms.has(roomId)) {
            const room = this.rooms.get(roomId);
            room.delete(userId || client.id);
            
            this.broadcastToRoom(roomId, {
                type: 'user-left',
                data: { userId: userId || client.id }
            });
            
            if (room.size === 0) {
                this.rooms.delete(roomId);
            }
            
            console.log(`User left room ${roomId}. Room now has ${room.size} users`);
        }
        
        client.roomId = null;
    }
    
    handleSignalingMessage(client, data) {
        const { roomId, message, targetUserId, fromUserId } = data;
        
        console.log('Relaying signaling message in room:', roomId);
        
        if (targetUserId) {
            // Send to specific user
            this.sendToUser(roomId, targetUserId, {
                type: 'signaling-message',
                data: { message, fromUserId: fromUserId || client.id }
            });
        } else {
            // Broadcast to room (except sender)
            this.broadcastToRoom(roomId, {
                type: 'signaling-message',
                data: { message, fromUserId: fromUserId || client.id }
            }, client);
        }
    }
    
    handleChatMessage(client, data) {
        const { roomId, message, userName, userId } = data;
        
        console.log(`Chat message in room ${roomId}: ${userName}: ${message}`);
        
        const messageData = {
            id: Date.now().toString(),
            userName,
            message,
            timestamp: new Date().toISOString(),
            userId: userId || client.id
        };
        
        this.broadcastToRoom(roomId, {
            type: 'chat-message',
            data: messageData
        });
    }
    
    handleDisconnect(client) {
        if (client.roomId) {
            this.handleLeaveRoom(client, { 
                roomId: client.roomId, 
                userId: client.id 
            });
        }
    }
    
    broadcastToRoom(roomId, message, excludeClient = null) {
        if (!this.rooms.has(roomId)) return;
        
        const room = this.rooms.get(roomId);
        room.forEach(user => {
            if (user !== excludeClient && user.ws.readyState === WebSocket.OPEN) {
                user.ws.send(JSON.stringify(message));
            }
        });
    }
    
    sendToUser(roomId, userId, message) {
        if (!this.rooms.has(roomId)) return;
        
        const room = this.rooms.get(roomId);
        const user = room.get(userId);
        
        if (user && user.ws.readyState === WebSocket.OPEN) {
            user.ws.send(JSON.stringify(message));
        }
    }
}

module.exports = new WebSocketHandler();
