const WebSocket = require('ws');

class WebSocketServer {
    constructor() {
        this.wss = null;
        this.rooms = new Map();
    }

    initialize(server) {
        this.wss = new WebSocket.Server({ server });
        
        this.wss.on('connection', (ws, req) => {
            console.log('WebSocket client connected');
            
            ws.userId = Math.random().toString(36).substr(2, 9);
            
            ws.on('message', (data) => {
                try {
                    const message = JSON.parse(data);
                    this.handleMessage(ws, message);
                } catch (error) {
                    console.error('Failed to parse message:', error);
                }
            });
            
            ws.on('close', () => {
                console.log('WebSocket client disconnected');
                this.handleDisconnect(ws);
            });
            
            ws.on('error', (error) => {
                console.error('WebSocket error:', error);
            });
        });
        
        console.log('WebSocket server initialized');
    }
    
    handleMessage(ws, message) {
        const { type, data } = message;
        
        switch (type) {
            case 'join-room':
                this.handleJoinRoom(ws, data);
                break;
            case 'leave-room':
                this.handleLeaveRoom(ws, data);
                break;
            case 'signaling-message':
                this.handleSignalingMessage(ws, data);
                break;
            case 'chat-message':
                this.handleChatMessage(ws, data);
                break;
            default:
                console.log('Unknown message type:', type);
        }
    }
    
    handleJoinRoom(ws, data) {
        const { roomId, userName, role, userId } = data;
        
        ws.roomId = roomId;
        ws.userName = userName;
        ws.role = role;
        ws.userId = userId;
        
        if (!this.rooms.has(roomId)) {
            this.rooms.set(roomId, new Map());
        }
        
        const room = this.rooms.get(roomId);
        room.set(userId, { userName, role, id: userId, ws });
        
        // Notify existing users
        this.broadcastToRoom(roomId, {
            type: 'user-joined',
            data: {
                userId,
                userName,
                role
            }
        }, ws);
        
        // Send current room users to new user
        const roomUsers = Array.from(room.values()).map(user => ({
            id: user.id,
            userName: user.userName,
            role: user.role
        }));
        
        ws.send(JSON.stringify({
            type: 'room-users',
            data: roomUsers
        }));
        
        console.log(`User ${userName} (${role}) joined room ${roomId}`);
    }
    
    handleLeaveRoom(ws, data) {
        const { roomId, userId } = data;
        
        if (this.rooms.has(roomId)) {
            const room = this.rooms.get(roomId);
            room.delete(userId);
            
            this.broadcastToRoom(roomId, {
                type: 'user-left',
                data: { userId }
            });
            
            if (room.size === 0) {
                this.rooms.delete(roomId);
            }
        }
        
        ws.roomId = null;
    }
    
    handleSignalingMessage(ws, data) {
        const { roomId, message, targetUserId, fromUserId } = data;
        
        if (targetUserId) {
            // Send to specific user
            this.sendToUser(roomId, targetUserId, {
                type: 'signaling-message',
                data: { message, fromUserId }
            });
        } else {
            // Broadcast to room (except sender)
            this.broadcastToRoom(roomId, {
                type: 'signaling-message',
                data: { message, fromUserId }
            }, ws);
        }
    }
    
    handleChatMessage(ws, data) {
        const { roomId, message, userName, userId } = data;
        
        const messageData = {
            id: Date.now().toString(),
            userName,
            message,
            timestamp: new Date().toISOString(),
            userId
        };
        
        this.broadcastToRoom(roomId, {
            type: 'chat-message',
            data: messageData
        });
    }
    
    handleDisconnect(ws) {
        if (ws.roomId && ws.userId) {
            this.handleLeaveRoom(ws, {
                roomId: ws.roomId,
                userId: ws.userId
            });
        }
    }
    
    broadcastToRoom(roomId, message, excludeWs = null) {
        if (!this.rooms.has(roomId)) return;
        
        const room = this.rooms.get(roomId);
        room.forEach(user => {
            if (user.ws !== excludeWs && user.ws.readyState === WebSocket.OPEN) {
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

module.exports = new WebSocketServer();
