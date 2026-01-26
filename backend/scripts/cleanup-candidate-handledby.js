const mongoose = require('mongoose');
const Candidate = require('./models/Candidate');
require('dotenv').config({ path: '.env' });

async function cleanupCandidateHandledBy() {
    try {
        // Connect to database
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/hackathon-interview');
        console.log('Connected to MongoDB');

        // Find all candidates that have handledBy referencing HR users
        const User = require('./models/User');
        const hrUsers = await User.find({ role: 'hr' });
        console.log(`Found ${hrUsers.length} HR users in database`);

        if (hrUsers.length > 0) {
            const hrUserIds = hrUsers.map(hr => hr._id);
            
            // Find candidates handled by HR users
            const candidatesHandledByHR = await Candidate.find({ handledBy: { $in: hrUserIds } });
            console.log(`Found ${candidatesHandledByHR.length} candidates handled by HR users`);

            if (candidatesHandledByHR.length > 0) {
                // Remove the handledBy reference for these candidates
                await Candidate.updateMany(
                    { handledBy: { $in: hrUserIds } },
                    { $unset: { handledBy: 1, handledAt: 1 } }
                );
                console.log(`Removed handledBy reference from ${candidatesHandledByHR.length} candidates`);
            }

            // Delete HR users
            const deleteResult = await User.deleteMany({ role: 'hr' });
            console.log(`Deleted ${deleteResult.deletedCount} HR users`);
        }

        // Verify cleanup
        const finalHRCount = await User.countDocuments({ role: 'hr' });
        const candidatesWithHandledBy = await Candidate.countDocuments({ handledBy: { $exists: true } });
        
        console.log(`Final counts:`);
        console.log(`- HR users: ${finalHRCount} (should be 0)`);
        console.log(`- Candidates with handledBy: ${candidatesWithHandledBy}`);

        await mongoose.connection.close();
        console.log('Database connection closed');
        console.log('Candidate handledBy cleanup completed successfully!');

    } catch (error) {
        console.error('Error during candidate handledBy cleanup:', error);
        process.exit(1);
    }
}

cleanupCandidateHandledBy();
