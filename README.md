# WebRTC Video Conferencing App

A modern, real-time video conferencing application built with Next.js, NestJS, and WebRTC. Features seamless guest joining, host moderation, and instant room creation.

## Features

### Core Experience
- **Instant Rooms**: Create rooms instantly as a host.
- **Guest Access**: Join via link with a simple display name (no login required for guests).
- **Real-time Media**: High-quality Audio/Video using WebRTC.

### Moderation (Host Only)
- **Kick Participants**: Remove unwanted users.
- **Mute Participants**: Disable audio/video for specific users.
- **End Session**: Delete the room for everyone.

### Tech Stack
- **Frontend**: Next.js, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: NestJS, Socket.io (Signaling), Prisma
- **Database**: PostgreSQL
- **Infrastructure**: Docker Compose, Redis (for queue/cache)

---

## Prerequisites

- **Docker** & **Docker Compose**

---

## Quick Start

The easiest way to run the application is using Docker Compose.

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd webRTC
    ```

2.  **Environment Setup:**
    *   **Backend:** Create `backend/.env` using `backend/.env.example`.
    *   **Frontend:** Create `frontend/.env` using `frontend/.env.example`.

3.  **Run with Docker Compose:**
    ```bash
    docker-compose up -d --build
    ```

4.  **Run Database Migrations:**
    Once the containers are running, apply the database schema:
    ```bash
    docker compose exec backend npx prisma migrate deploy
    ```

5.  **Access the App:**
    - Frontend: `http://localhost:3000`
    - Backend API: `http://localhost:3001`

---

## Environment Variables

**Backend (`backend/.env`)**
```ini
DATABASE_URL="postgresql://user:pass@localhost:5432/db"
JWT_SECRET="super-secret-key"
REDIS_HOST="localhost"
REDIS_PORT="6379"
FRONTEND_URL="http://localhost:3000"
RESEND_API_KEY="re_123..." (Optional for emails)
EMAIL_FROM="noreply@example.com"
```

**Frontend (`frontend/.env`)**
```ini
NEXT_PUBLIC_API_URL="http://localhost:3001"
NEXT_PUBLIC_WS_URL="http://localhost:3001"
```
