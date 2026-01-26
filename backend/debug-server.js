console.log('Starting server test...');

try {
    const mongoose = require('mongoose');
    const User = require('./models/User');
    
    console.log('Modules loaded successfully');
    
    // Test mongoose connection
    mongoose.connect('mongodb://localhost:27017/hackathon-interview')
        .then(() => {
            console.log('MongoDB connected successfully');
            
            // Test user creation
            const testUser = new User({
                name: 'Test User',
                email: 'test@test.com',
                password: 'test123',
                role: 'candidate'
            });
            
            console.log('User object created:', testUser);
            
            testUser.save()
                .then(() => {
                    console.log('User saved successfully');
                    process.exit(0);
                })
                .catch(err => {
                    console.error('Error saving user:', err);
                    process.exit(1);
                });
        })
        .catch(err => {
            console.error('MongoDB connection error:', err);
            process.exit(1);
        });
} catch (error) {
    console.error('Server startup error:', error);
    process.exit(1);
}
