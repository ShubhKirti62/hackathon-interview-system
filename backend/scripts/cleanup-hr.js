const mongoose = require('mongoose');
const User = require('./models/User');
const Question = require('./models/Question');
require('dotenv').config({ path: '.env' });

async function cleanupHR() {
    try {
        // Connect to database
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/hackathon-interview');
        console.log('Connected to MongoDB');

        // Find and delete HR users
        const hrUsers = await User.find({ role: 'hr' });
        console.log(`Found ${hrUsers.length} HR users to delete`);

        if (hrUsers.length > 0) {
            const deleteResult = await User.deleteMany({ role: 'hr' });
            console.log(`Deleted ${deleteResult.deletedCount} HR users`);
        }

        // Update any interviewer users to candidate role
        const interviewerUsers = await User.find({ role: 'interviewer' });
        console.log(`Found ${interviewerUsers.length} interviewer users to update to candidate role`);

        if (interviewerUsers.length > 0) {
            const updateResult = await User.updateMany(
                { role: 'interviewer' },
                { $set: { role: 'candidate' } }
            );
            console.log(`Updated ${updateResult.modifiedCount} interviewer users to candidate role`);
        }

        // Verify final user counts
        const adminCount = await User.countDocuments({ role: 'admin' });
        const candidateCount = await User.countDocuments({ role: 'candidate' });
        const hrCount = await User.countDocuments({ role: 'hr' });
        const interviewerCount = await User.countDocuments({ role: 'interviewer' });

        console.log(`Final user counts:`);
        console.log(`- Admin: ${adminCount}`);
        console.log(`- Candidate: ${candidateCount}`);
        console.log(`- HR: ${hrCount} (should be 0)`);
        console.log(`- Interviewer: ${interviewerCount} (should be 0)`);

        // Close connection
        await mongoose.connection.close();
        console.log('Database connection closed');
        console.log('HR cleanup completed successfully!');

    } catch (error) {
        console.error('Error during HR cleanup:', error);
        process.exit(1);
    }
}

cleanupHR();
