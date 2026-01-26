// MongoDB script to remove MCQ questions
// Run this in MongoDB shell: db.eval(loadScript('cleanup-mcqs.js'))

// Connect to the database
use hackathon_interview;

// Find and delete all MCQ questions
const mcqCount = db.questions.countDocuments({ type: 'MCQ' });
print(`Found ${mcqCount} MCQ questions`);

if (mcqCount > 0) {
    const result = db.questions.deleteMany({ type: 'MCQ' });
    print(`Deleted ${result.deletedCount} MCQ questions`);
}

// Verify remaining questions
const descriptiveCount = db.questions.countDocuments({ type: 'Descriptive' });
const totalCount = db.questions.countDocuments({});
print(`Remaining questions: ${totalCount} (Descriptive: ${descriptiveCount})`);

print('MCQ cleanup completed!');
