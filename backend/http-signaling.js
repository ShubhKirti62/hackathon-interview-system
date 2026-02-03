class HttpSignalingService {
    constructor() {
        this.rooms = new Map();
        this.clients = new Map();
    }

    initialize(app) {
        // HTTP endpoint for signaling
        app.post('/api/signaling/:roomId', (req, res) => {
            const { roomId } = req.params;
            const { type, data } = req.body;
            
            console.log('HTTP signaling request:', { roomId, type, data });
            
            switch (type) {
                case 'join-room':
                    this.handleJoinRoom(req, res, roomId, data);
                    break;
                case 'leave-room':
                    this.handleLeaveRoom(req, res, roomId, data);
                    break;
                case 'signaling-message':
                    this.handleSignalingMessage(req, res, roomId, data);
                    break;
                case 'chat-message':
                    this.handleChatMessage(req, res, roomId, data);
                    break;
                default:
                    res.status(400).json({ error: 'Unknown message type' });
            }
        });
        
        // Endpoint for getting room users
        app.get('/api/room/:roomId/users', (req, res) => {
            const { roomId } = req.params;
            
            if (this.rooms.has(roomId)) {
                const room = this.rooms.get(roomId);
                const users = Array.from(room.values()).map(user => ({
                    id: user.id,
                    userName: user.userName,
                    role: user.role
                }));
                res.json(users);
            } else {
                res.json([]);
            }
        });
        
        console.log('HTTP signaling service initialized');
    }
    
    handleJoinRoom(req, res, roomId, data) {
        const { userName, role, userId } = data;
        
        console.log(`User ${userName} (${role}) joining room ${roomId}`);
        
        const client = {
            id: userId || Math.random().toString(36).substr(2, 9),
            userName,
            role,
            lastSeen: Date.now()
        };
        
        if (!this.rooms.has(roomId)) {
            this.rooms.set(roomId, new Map());
        }
        
        const room = this.rooms.get(roomId);
        room.set(client.id, client);
        
        // Broadcast to all clients in room (polling will pick this up)
        setTimeout(() => {
            this.broadcastToRoom(roomId, {
                type: 'user-joined',
                data: {
                    userId: client.id,
                    userName,
                    role,
                    timestamp: Date.now()
                }
            });
        }, 100);
        
        res.json({ success: true, clientId: client.id });
    }
    
    handleLeaveRoom(req, res, roomId, data) {
        const { userId } = data;
        
        if (this.rooms.has(roomId)) {
            const room = this.rooms.get(roomId);
            room.delete(userId);
            
            setTimeout(() => {
                this.broadcastToRoom(roomId, {
                    type: 'user-left',
                    data: {
                        userId,
                        timestamp: Date.now()
                    }
                });
            }, 100);
            
            if (room.size === 0) {
                this.rooms.delete(roomId);
            }
        }
        
        res.json({ success: true });
    }
    
    handleSignalingMessage(req, res, roomId, data) {
        const { message, targetUserId, fromUserId } = data;
        
        setTimeout(() => {
            if (targetUserId) {
                // Send to specific user
                this.broadcastToRoom(roomId, {
                    type: 'signaling-message',
                    data: { message, fromUserId, targetUserId }
                });
            } else {
                // Broadcast to room
                this.broadcastToRoom(roomId, {
                    type: 'signaling-message',
                    data: { message, fromUserId }
                });
            }
        }, 100);
        
        res.json({ success: true });
    }
    
    handleChatMessage(req, res, roomId, data) {
        const { message, userName, userId } = data;
        
        const messageData = {
            id: Date.now().toString(),
            userName,
            message,
            timestamp: new Date().toISOString(),
            userId: userId
        };
        
        setTimeout(() => {
            this.broadcastToRoom(roomId, {
                type: 'chat-message',
                data: messageData
            });
        }, 100);
        
        res.json({ success: true });
    }
    
    broadcastToRoom(roomId, message) {
        // Store message for polling clients
        if (!this.rooms.has(roomId)) {
            this.rooms.set(roomId, new Map());
        }
        
        const room = this.rooms.get(roomId);
        room.set(`broadcast_${Date.now()}`, message);
        
        // Clean old broadcast messages (keep only last 50)
        const messages = Array.from(room.keys()).filter(key => key.startsWith('broadcast_'));
        if (messages.length > 50) {
            messages.slice(0, messages.length - 50).forEach(key => room.delete(key));
        }
    }
    
    getMessages(roomId, since = 0) {
        if (!this.rooms.has(roomId)) {
            return [];
        }
        
        const room = this.rooms.get(roomId);
        const messages = Array.from(room.entries())
            .filter(([key, value]) => key.startsWith('broadcast_') && parseInt(key.split('_')[1]) > since)
            .map(([key, value]) => value)
            .sort((a, b) => a.timestamp - b.timestamp);
        
        return messages;
    }
}

module.exports = new HttpSignalingService();
