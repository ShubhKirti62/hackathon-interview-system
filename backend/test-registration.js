const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function testRegistration() {
    try {
        console.log('Connecting to database...');
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/hackathon-interview');
        console.log('Connected to MongoDB');

        // Test creating a candidate user
        console.log('Testing candidate user creation...');
        const testUser = {
            name: 'Test Candidate',
            email: 'test@example.com',
            password: 'password123',
            role: 'candidate'
        };

        console.log('User data to create:', testUser);

        // Check if user already exists
        const existingUser = await User.findOne({ email: testUser.email });
        if (existingUser) {
            console.log('User already exists, deleting...');
            await User.deleteOne({ email: testUser.email });
        }

        // Create new user
        const user = new User(testUser);
        console.log('User object created:', user);

        await user.save();
        console.log('User saved successfully!');

        // Verify the user was created
        const savedUser = await User.findOne({ email: testUser.email });
        console.log('Saved user from DB:', savedUser);

        await mongoose.connection.close();
        console.log('Test completed successfully!');

    } catch (error) {
        console.error('Error during test:', error);
        await mongoose.connection.close();
    }
}

testRegistration();
