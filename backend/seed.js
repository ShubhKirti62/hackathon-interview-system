const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

// Load environment variables
const environment = process.env.NODE_ENV || 'development';
if (environment === 'development') {
    dotenv.config();
} else {
    dotenv.config({ path: `.env.${environment}` });
}

const User = require('./models/User');
const Candidate = require('./models/Candidate');
const Question = require('./models/Question');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/hackathon_dev';

const seedData = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(MONGO_URI);
        console.log('MongoDB Connected');

        // Clear existing data
        await User.deleteMany({});
        await Candidate.deleteMany({});
        await Question.deleteMany({});
        console.log('Cleared existing data');

        // Create Admin User
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('123456', salt);

        const admin = await User.create({
            name: 'Admin User',
            email: 'admin@example.com',
            password: hashedPassword,
            role: 'admin'
        });
        console.log('Created admin user');

        // Create Sample Candidates
        const candidates = await Candidate.insertMany([
            {
                name: 'John Doe',
                email: 'john.doe@example.com',
                phone: '+91-9876543210',
                domain: 'Frontend',
                experienceLevel: '2-4 years',
                status: 'Pending',
                internalReferred: false
            },
            {
                name: 'Jane Smith',
                email: 'jane.smith@example.com',
                phone: '+91-9876543211',
                domain: 'Backend',
                experienceLevel: '4-6 years',
                status: 'Interviewed',
                internalReferred: true
            },
            {
                name: 'Mike Johnson',
                email: 'mike.johnson@example.com',
                phone: '+91-9876543212',
                domain: 'Full Stack',
                experienceLevel: 'Fresher/Intern',
                status: 'Shortlisted',
                internalReferred: false
            },
            {
                name: 'Sarah Williams',
                email: 'sarah.williams@example.com',
                phone: '+91-9876543213',
                domain: 'DevOps',
                experienceLevel: '6-8 years',
                status: 'Pending',
                internalReferred: true
            },
            {
                name: 'David Brown',
                email: 'david.brown@example.com',
                phone: '+91-9876543214',
                domain: 'Data Science',
                experienceLevel: '1-2 years',
                status: 'Rejected',
                internalReferred: false
            },
            {
                name: 'Emily Davis',
                email: 'emily.davis@example.com',
                phone: '+91-9876543215',
                domain: 'Sales & Marketing',
                experienceLevel: '2-4 years',
                status: 'Pending',
                internalReferred: false
            },
            {
                name: 'Robert Wilson',
                email: 'robert.wilson@example.com',
                phone: '+91-9876543216',
                domain: 'Business Analyst',
                experienceLevel: '4-6 years',
                status: 'Interviewed',
                internalReferred: true
            },
            {
                name: 'Lisa Anderson',
                email: 'lisa.anderson@example.com',
                phone: '+91-9876543217',
                domain: 'QA/Testing',
                experienceLevel: '1-2 years',
                status: 'Shortlisted',
                internalReferred: false
            },
            {
                name: 'James Taylor',
                email: 'james.taylor@example.com',
                phone: '+91-9876543218',
                domain: 'UI/UX Design',
                experienceLevel: '2-4 years',
                status: 'Pending',
                internalReferred: false
            },
            {
                name: 'Maria Garcia',
                email: 'maria.garcia@example.com',
                phone: '+91-9876543219',
                domain: 'Product Management',
                experienceLevel: '6-8 years',
                status: 'Interviewed',
                internalReferred: true
            }
        ]);
        console.log(`Created ${candidates.length} candidates`);

        // Create Sample Questions
        const questions = await Question.insertMany([
            {
                text: 'Explain the difference between let, const, and var in JavaScript.',
                domain: 'Frontend',
                experienceLevel: 'Fresher/Intern',
                difficulty: 'Easy',
                verified: true,
                createdBy: admin._id,
                verifiedBy: admin._id
            },
            {
                text: 'What is the Virtual DOM in React and how does it work?',
                domain: 'Frontend',
                experienceLevel: '1-2 years',
                difficulty: 'Medium',
                verified: true,
                createdBy: admin._id,
                verifiedBy: admin._id
            },
            {
                text: 'Explain the concept of closures in JavaScript with an example.',
                domain: 'Frontend',
                experienceLevel: '2-4 years',
                difficulty: 'Medium',
                verified: true,
                createdBy: admin._id,
                verifiedBy: admin._id
            },
            {
                text: 'What is the difference between SQL and NoSQL databases?',
                domain: 'Backend',
                experienceLevel: 'Fresher/Intern',
                difficulty: 'Easy',
                verified: true,
                createdBy: admin._id,
                verifiedBy: admin._id
            },
            {
                text: 'Explain RESTful API design principles.',
                domain: 'Backend',
                experienceLevel: '1-2 years',
                difficulty: 'Medium',
                verified: true,
                createdBy: admin._id,
                verifiedBy: admin._id
            },
            {
                text: 'What is middleware in Express.js? Provide examples.',
                domain: 'Backend',
                experienceLevel: '2-4 years',
                difficulty: 'Medium',
                verified: true,
                createdBy: admin._id,
                verifiedBy: admin._id
            },
            {
                text: 'Explain the CAP theorem in distributed systems.',
                domain: 'Backend',
                experienceLevel: '4-6 years',
                difficulty: 'Hard',
                verified: true,
                createdBy: admin._id,
                verifiedBy: admin._id
            },
            {
                text: 'What is Docker and how does it differ from virtual machines?',
                domain: 'DevOps',
                experienceLevel: '1-2 years',
                difficulty: 'Easy',
                verified: true,
                createdBy: admin._id,
                verifiedBy: admin._id
            },
            {
                text: 'Explain CI/CD pipeline and its benefits.',
                domain: 'DevOps',
                experienceLevel: '2-4 years',
                difficulty: 'Medium',
                verified: true,
                createdBy: admin._id,
                verifiedBy: admin._id
            },
            {
                text: 'What is the difference between supervised and unsupervised learning?',
                domain: 'Data Science',
                experienceLevel: 'Fresher/Intern',
                difficulty: 'Easy',
                verified: true,
                createdBy: admin._id,
                verifiedBy: admin._id
            },
            {
                text: 'How would you approach selling a new technical product to a non-technical client?',
                domain: 'Sales & Marketing',
                experienceLevel: '2-4 years',
                difficulty: 'Medium',
                verified: true,
                createdBy: admin._id,
                verifiedBy: admin._id
            },
            {
                text: 'Describe a time when you had to analyze business requirements and translate them into technical specifications.',
                domain: 'Business Analyst',
                experienceLevel: '4-6 years',
                difficulty: 'Hard',
                verified: true,
                createdBy: admin._id,
                verifiedBy: admin._id
            },
            {
                text: 'What testing methodologies do you follow and how do you ensure comprehensive test coverage?',
                domain: 'QA/Testing',
                experienceLevel: '1-2 years',
                difficulty: 'Medium',
                verified: true,
                createdBy: admin._id,
                verifiedBy: admin._id
            },
            {
                text: 'How do you approach user research and what methods do you use to gather user feedback?',
                domain: 'UI/UX Design',
                experienceLevel: '2-4 years',
                difficulty: 'Medium',
                verified: true,
                createdBy: admin._id,
                verifiedBy: admin._id
            },
            {
                text: 'How do you prioritize features in a product roadmap when dealing with limited resources?',
                domain: 'Product Management',
                experienceLevel: '4-6 years',
                difficulty: 'Hard',
                verified: true,
                createdBy: admin._id,
                verifiedBy: admin._id
            }
        ]);
        console.log(`Created ${questions.length} questions`);

        console.log('\n✅ Seed data created successfully!');
        console.log('\nLogin Credentials:');
        console.log('Email: admin@example.com');
        console.log('Password: 123456');

        process.exit(0);
    } catch (error) {
        console.error('Error seeding data:', error);
        process.exit(1);
    }
};

seedData();
