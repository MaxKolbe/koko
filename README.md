# KoKo - Project Overview

KoKo is a modern full-stack web application designed for comprehensive content management and AI-powered interaction. The platform allows users to read, translate, edit, and ask AI-assisted questions about articles in multiple languages.

## Project Structure

This project is organized as a monorepo consisting of two main applications:

- **Backend** (`apps/backend`): A robust Node.js/Express REST API built with TypeScript. It leverages Drizzle ORM for database interactions, Zod for schema validation, and integrates with AI services for semantic search and question answering using vector embeddings.
- **Frontend** (`apps/frontend`): A responsive and dynamic user interface built with React, Vite, and React Router.

## Technologies

### Backend
- **Framework**: Node.js with Express
- **Language**: TypeScript
- **Database ORM**: Drizzle ORM
- **Validation**: Zod
- **Queue System**: BullMQ with Redis
- **Database**: PostgreSQL (with pgvector for AI semantic search)

### Frontend
- **Framework**: React 19
- **Build Tool**: Vite 8
- **Routing**: React Router DOM

## Getting Started

Follow these steps to set up the project locally.

### Prerequisites
- Node.js (v20+ recommended)
- PostgreSQL (ensure pgvector extension is installed/enabled)
- Redis server running locally or via Docker

### 1. Installation

From the root directory, install all dependencies for both the frontend and backend:
```bash
npm install
```
*(Note: If using workspaces, this will install dependencies for both apps. Otherwise, install inside both `apps/backend` and `apps/frontend` separately).*

### 2. Environment Configuration

Navigate to the backend directory and set up your environment variables:
```bash
cd apps/backend
cp .env.example .env
```
Ensure that your `DATABASE_URL` and necessary API keys (such as OpenAI for embeddings) are correctly configured in the `.env` file.

### 3. Database Setup & First-Time Injection

> [!IMPORTANT]
> **First-Time Injection**
> Before running the backend for the first time, you MUST seed the database. The backend comes with a built-in seed script that will inject initial languages, authors, and standard configurations necessary for the app to function properly.

Run the following commands in the backend directory to push the schema and seed the database:

```bash
cd apps/backend
npm run db:push
npm run db:seed
```

### 4. Running the Application

You can start both applications concurrently, or run them in separate terminal windows.

**Start the Backend:**
```bash
cd apps/backend
npm run dev
```

**Start the Frontend:**
```bash
cd apps/frontend
npm run dev
```

### 5. Accessing the Platforms

- **Frontend App**: `http://localhost:5173`
- **Backend API**: `http://localhost:3000/api/v1`
- **Database Studio**: Run `npm run db:studio` inside the backend directory to open the Drizzle visual studio.
- **BullMQ Admin Panel**: `http://localhost:3000/api/v1/admin/queues` (to monitor background jobs like vector ingestions)

## Development Scripts (Backend)

- `npm run db:push`: Syncs the Drizzle schema directly with the database.
- `npm run db:generate`: Generates migration files.
- `npm run db:migrate`: Runs migrations.
- `npm run db:seed`: Runs the seed script for initial data injection.
- `npm run db:studio`: Opens Drizzle Studio to interact with your data visually.
- `npm run ingest`: Manually triggers the AI vector ingestion script.
- `npm run test`: Runs the Vitest test suite.
