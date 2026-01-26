// Test script to demonstrate candidate registration validation
const mongoose = require('mongoose');
const User = require('./models/User');
const Candidate = require('./models/Candidate');
require('dotenv').config();

async function testCandidateValidation() {
    try {
        // Connect to database
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/hackathon-interview');
        console.log('Connected to MongoDB');

        // Test 1: Try to register candidate with email NOT in candidates collection
        console.log('\n--- Test 1: Candidate with unknown email ---');
        const unknownEmail = 'unknown.candidate@test.com';
        
        // Check if user already exists and delete for clean test
        await User.deleteOne({ email: unknownEmail });
        
        // Try to create user (this should fail in the actual API)
        const testUser1 = new User({
            name: 'Unknown Candidate',
            email: unknownEmail,
            password: 'password123',
            role: 'candidate'
        });
        
        // This would fail in the API, but let's check the validation logic
        const candidateExists = await Candidate.findOne({ email: unknownEmail });
        console.log(`Candidate exists in database: ${!!candidateExists}`);
        
        if (!candidateExists) {
            console.log('❌ Registration should be blocked: Email not found in candidate database');
        }

        // Test 2: Add candidate to database first
        console.log('\n--- Test 2: Adding candidate to database ---');
        const testCandidate = new Candidate({
            name: 'Test Candidate',
            email: 'test.candidate@test.com',
            phone: '+1234567890',
            domain: 'Frontend',
            experienceLevel: '1-2 years',
            status: 'Profile Submitted'
        });
        
        await testCandidate.save();
        console.log('✅ Candidate added to database');

        // Test 3: Try to register with the candidate email
        console.log('\n--- Test 3: Candidate with known email ---');
        const knownEmail = 'test.candidate@test.com';
        
        // Check if candidate exists
        const candidateExists2 = await Candidate.findOne({ email: knownEmail });
        console.log(`Candidate exists in database: ${!!candidateExists2}`);
        
        if (candidateExists2) {
            console.log('✅ Registration should be allowed: Email found in candidate database');
        }

        // Test 4: Admin registration (should always work)
        console.log('\n--- Test 4: Admin registration ---');
        const adminEmail = 'new.admin@test.com';
        const candidateExists3 = await Candidate.findOne({ email: adminEmail });
        console.log(`Candidate exists in database: ${!!candidateExists3}`);
        console.log('✅ Admin registration should be allowed regardless of candidate database');

        // Cleanup
        await User.deleteOne({ email: unknownEmail });
        await User.deleteOne({ email: knownEmail });
        await Candidate.deleteOne({ email: knownEmail });

        await mongoose.connection.close();
        console.log('\n✅ Test completed successfully!');

    } catch (error) {
        console.error('Error during test:', error);
        await mongoose.connection.close();
    }
}

testCandidateValidation();
