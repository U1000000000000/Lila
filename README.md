# Lila — AI Voice Language Learning Assistant

Lila is a real-time AI-powered voice companion designed to help users practice and improve spoken English. It delivers instant grammar correction, pronunciation feedback, and fluency tracking through a natural conversational interface.

---

## Features

- Real-time voice conversation with an AI tutor over WebSocket
- Grammar correction with before-and-after comparison
- Pronunciation analysis with phonetic notation
- Fluency score tracking over time (daily, weekly, monthly)
- Conversation history with session tagging and CEFR level labels
- User dashboard showing sessions, accuracy, vocabulary growth, and time logged
- Google OAuth 2.0 sign-in with JWT-based session management
- Protected routes with automatic token validation and renewal
- Smooth animated UI with page transitions and scroll-to-top behavior
- Static informational pages: About, Privacy Policy, Terms of Service

---

## Tech Stack

### Client

- React 18 with Vite
- React Router v6 for client-side routing
- Framer Motion for animations and page transitions
- Lucide React for icons
- Zustand for global state management
- Vanilla CSS with CSS custom properties

### Server

- Python 3.11+
- FastAPI with Uvicorn (ASGI)
- WebSockets for real-time audio streaming
- Motor (async MongoDB driver) for database access
- PyJWT for token encoding and validation
- Groq SDK for LLM-based language feedback
- Deepgram SDK for speech-to-text transcription
- Google OAuth 2.0 for authentication

### Database

- MongoDB (Atlas or self-hosted)

---

## Project Structure

```
Lila/
├── client/                  # React frontend
│   └── src/
│       ├── components/      # Shared UI components (AppShell, ProtectedRoute, etc.)
│       ├── hooks/           # Custom hooks (useWebSocket, etc.)
│       ├── pages/           # Page-level components (Chat, Dashboard, History, etc.)
│       ├── services/        # API service layer
│       ├── store/           # Zustand state stores
│       └── utils/           # Utility functions
└── server/                  # FastAPI backend
    └── app/
        ├── api/v1/          # Route handlers (auth, users, memory, ws)
        ├── core/            # Config and settings
        ├── db/              # MongoDB connection and helpers
        ├── middleware/      # JWT auth middleware
        ├── models/          # Pydantic data models
        └── services/        # Business logic (AI, transcription, memory)
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.11+
- MongoDB instance (local or Atlas)
- Groq API key
- Deepgram API key
- Google OAuth 2.0 credentials

### Server Setup

```bash
cd server
python -m venv .venv
.venv\Scripts\activate       # Windows
pip install -r requirements.txt
```

Create a `.env` file inside the `server/` directory:

```
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
GROQ_API_KEY=your_groq_api_key
DEEPGRAM_API_KEY=your_deepgram_api_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
CORS_ORIGINS=http://localhost:5173
```

Start the server:

```bash
python main.py
```

The API will be available at `http://localhost:8000`.

### Client Setup

```bash
cd client
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## API Endpoints

| Method | Endpoint                | Description                            |
| ------ | ----------------------- | -------------------------------------- |
| GET    | `/api/v1/auth/google`   | Initiate Google OAuth flow             |
| GET    | `/api/v1/auth/callback` | Handle OAuth callback and issue JWT    |
| GET    | `/api/v1/users/me`      | Get authenticated user profile         |
| GET    | `/api/v1/memory`        | Retrieve conversation memory           |
| WS     | `/ws`                   | Real-time audio and AI feedback stream |

---

## Credits

Lila was built by:

- Ujjval Agarwal — [github.com/U1000000000000](https://github.com/U1000000000000)
- Piyush Soni — [github.com/piyush64-bit](https://github.com/piyush64-bit)

---

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
