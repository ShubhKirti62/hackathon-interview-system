# AI Assisted Interview System

A comprehensive full-stack application for conducting AI-powered interviews with automated feedback and analytics.

## 🚀 Features

### Core Functionality
- **AI-Powered Interviews**: Automated interview process with speech-to-text capabilities
- **Multi-Role System**: Admin, HR, and Interviewer roles
- **Question Management**: Create, verify, and organize questions by domain and experience level
- **Questionnaire Builder**: Build custom questionnaires for different interview rounds
- **Invite System**: Generate unique invite links for candidates
- **Session Tracking**: Track and review interview sessions with detailed reports
- **Performance Analytics**: View candidate performance metrics and scores

### Technical Features
- **Authentication**: JWT-based login/logout system
- **Theme Support**: Light and dark mode toggle
- **Responsive Design**: Mobile-friendly UI
- **File Upload**: Resume upload functionality
- **Real-time Feedback**: AI-generated feedback for responses

## 📁 Project Structure

```
hackathon-interview-system/
├── backend/                 # Node.js + Express + MongoDB
│   ├── models/             # Mongoose models
│   ├── routes/             # API routes
│   ├── middleware/         # Auth middleware
│   ├── config/             # Configuration files
│   ├── uploads/            # File uploads directory
│   └── index.js            # Entry point
│
├── frontend/               # React + TypeScript + Vite
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── context/        # React context providers
│   │   ├── services/       # API services
│   │   └── routes.ts       # Route constants
│   └── package.json
│
└── package.json            # Root package.json for concurrent dev
```

## 🛠️ Tech Stack

### Backend
- **Node.js** + **Express.js**
- **MongoDB** with **Mongoose**
- **JWT** for authentication
- **Bcrypt** for password hashing
- **Multer** for file uploads
- **CORS** enabled

### Frontend
- **React 19** with **TypeScript**
- **Vite** for build tooling
- **React Router** for navigation
- **Axios** for API calls
- **Lucide React** for icons
- **CSS Variables** for theming

## 📦 Installation

### Prerequisites
- Node.js (v18+)
- MongoDB (local or cloud instance)

### Setup

1. **Clone the repository**
```bash
cd hackathon-interview-system
```

2. **Install all dependencies**
```bash
npm run install:all
```

Or install separately:
```bash
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install
```

3. **Configure Environment Variables**

**Backend** (`backend/.env`):
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/hackathon_dev
NODE_ENV=development
JWT_SECRET=your_secret_key_here
FRONTEND_URL=http://localhost:5173
```

**Frontend** (`frontend/.env`):
```env
VITE_API_URL=http://localhost:5000/api
VITE_ENV=development
```

## 🚀 Running the Application

### Development Mode

**Run both frontend and backend concurrently:**
```bash
npm run dev
```

**Or run separately:**
```bash
# Backend (from backend folder)
npm run dev

# Frontend (from frontend folder)
npm run dev
```

### Environment-Specific Commands

**Development:**
```bash
npm run dev
```

**UAT:**
```bash
npm run dev:uat
```

**Production:**
```bash
npm run dev:prod
```

### Build Commands

**Frontend builds:**
```bash
cd frontend

# Development build
npm run build:dev

# UAT build
npm run build:uat

# Production build
npm run build:prod
```

## 🔑 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/user` - Get current user (protected)

### Candidates
- `POST /api/candidates` - Create candidate (with resume upload)
- `GET /api/candidates` - Get all candidates

### Questions
- `POST /api/questions` - Create question
- `GET /api/questions` - Get questions (filterable by domain/experience)
- `PATCH /api/questions/:id/verify` - Verify question

### Questionnaires
- `POST /api/questionnaires` - Create questionnaire
- `GET /api/questionnaires` - Get all questionnaires
- `GET /api/questionnaires/:id` - Get questionnaire by ID

### Invites
- `POST /api/invites` - Generate invite link
- `GET /api/invites/:token` - Validate invite token

### Interviews
- `POST /api/interviews/start` - Start new interview
- `POST /api/interviews/:id/response` - Submit answer
- `POST /api/interviews/:id/complete` - Complete interview
- `GET /api/interviews/:id` - Get interview details

### Sessions
- `GET /api/sessions` - List all sessions (filterable by candidateId)
- `GET /api/sessions/:id` - Get session report

## 🎨 Frontend Routes

- `/` - Landing page
- `/login` - Login page
- `/admin/dashboard` - Admin dashboard (protected)
- `/admin/candidates` - Candidate management (protected)
- `/admin/questions` - Question management (protected)
- `/interview` - Interview intro page (protected)
- `/interview/session/:id` - Active interview session (protected)
- `/interview/result/:id` - Interview results (protected)

## 👥 User Roles

1. **Admin**: Full access to all features
2. **HR**: Manage candidates, questions, and view reports
3. **Interviewer**: Conduct interviews and provide feedback

## 🎯 Experience Levels

- Fresher/Intern
- 1-2 years
- 2-4 years
- 4-6 years
- 6-8 years
- 8-10 years

## 📊 Scoring Metrics

- **Communication Skills** (0-10)
- **Confidence** (0-10)
- **Technical/Domain Knowledge** (0-10)
- **Interviewer Remarks** (text)

## 🌙 Theme Support

The application supports both light and dark themes:
- Auto-detects system preference on first load
- Manual toggle available in header
- Preference saved in localStorage

## 🔒 Security Features

- JWT token-based authentication
- Password hashing with bcrypt
- Protected routes with role-based access
- Token expiration (24 hours)
- CORS enabled for API security

## 📝 Default Credentials

For testing purposes:
```
Email: admin@example.com
Password: 123456
```

**Note**: Create this user via the register endpoint or directly in MongoDB.

## 🚧 Future Enhancements

- [ ] WebRTC for video interviews
- [ ] SMTP integration for email notifications
- [ ] Advanced AI feedback using LLM
- [ ] Question bank import/export
- [ ] Candidate performance dashboard
- [ ] Interview scheduling system
- [ ] Multi-language support

## 📄 License

ISC

## 👨‍💻 Development

Built for hackathon purposes with focus on rapid development and core functionality.

---

**Happy Interviewing! 🎉**
