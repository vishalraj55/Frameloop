<div align="center">
  <img src="./public/banner.png" alt="Frameloop Logo" width="100%" />
</div>

# Frameloop

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js_16-Frontend-000000?style=flat&logo=next.js&logoColor=white)
![NestJS](https://img.shields.io/badge/NestJS-Backend-E0234E?style=flat&logo=nestjs&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-4169E1?style=flat&logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat&logo=prisma&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-4%2B-3178C6?style=flat&logo=typescript&logoColor=white)
![pnpm](https://img.shields.io/badge/pnpm-Package_Manager-F69220?style=flat&logo=pnpm&logoColor=white)

A fullstack social photo-sharing platform built with Next.js, NestJS, and Prisma.

**🚧 Currently under active development — deployment pending stable release.**

[Live Preview](https://frameloops.vercel.app) · [Report Bug](https://github.com/vishalraj55/Frameloop/issues) · [Request Feature](https://github.com/vishalraj55/Frameloop/issues)

</div>

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Features](#features)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Running the App](#running-the-app)
- [Available Scripts](#available-scripts)
- [API Overview](#api-overview)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

Frameloop is a fullstack social media application focused on photo sharing. Users can create accounts, upload photos, follow other users, and engage with content through likes and comments. The app is architected as a monorepo with a Next.js frontend and a NestJS REST API backend, connected to a PostgreSQL database via Prisma ORM. Authentication is handled by Firebase, and media uploads are managed through Cloudinary.

---

## Tech Stack

| Layer           | Technology              | Purpose                        |
| --------------- | ----------------------- | ------------------------------ |
| Frontend        | Next.js 16 (App Router) | React framework with SSR/SSG   |
| Styling         | Tailwind CSS v4         | Utility-first CSS              |
| Icons           | Lucide React            | Icon library                   |
| Backend         | NestJS 11               | Modular Node.js REST API       |
| Database        | PostgreSQL              | Relational data storage        |
| ORM             | Prisma                  | Type-safe database access      |
| Auth            | Firebase Authentication | User identity & JWT tokens     |
| Media           | Cloudinary              | Image upload & CDN delivery    |
| Language        | TypeScript 5            | End-to-end type safety         |
| Package Manager | pnpm (workspace)        | Monorepo dependency management |
| Deployment      | Vercel (frontend)       | Frontend hosting & CI/CD       |

---

## Architecture

```
Browser
  │
  ▼
Next.js Frontend (port 3001)
  │  App Router pages & components
  │  Firebase SDK  ──► Firebase Auth (Google / Email)
  │  API Proxy routes (/api/*) ──► forward JWT in Authorization header
  │
  ▼
NestJS Backend (port 3000)
  │  Guards (FirebaseAuthGuard / OptionalFirebaseAuthGuard)
  │  Controllers → Services → Prisma Client
  │
  ▼
PostgreSQL Database
  │
  └── Cloudinary (media upload via NestJS service)
```

The Next.js frontend proxies all `/api/*` requests to the NestJS backend, forwarding the Firebase ID token in the `Authorization: Bearer <token>` header. The backend verifies the token using the Firebase Admin SDK and resolves the authenticated user before processing any protected route.

---

## Project Structure

```
Frameloop/
├── backend/                        # NestJS application
│   ├── src/
│   │   ├── app.module.ts           # Root module — imports all feature modules
│   │   ├── main.ts                 # Bootstrap entry point, sets port & CORS
│   │   ├── auth/                   # Firebase Auth guard & strategy
│   │   │   ├── firebase-auth.guard.ts          # Protects routes; requires valid Firebase token
│   │   │   ├── optional-firebase-auth.guard.ts # Allows unauthenticated access; attaches user if token present
│   │   │   └── firebase-admin.service.ts       # Initializes Firebase Admin SDK
│   │   ├── users/                  # User profile module
│   │   │   ├── users.controller.ts # GET /users/:id, PUT /users/me, follow/unfollow endpoints
│   │   │   ├── users.service.ts    # Business logic for user CRUD and follow graph
│   │   │   └── users.module.ts
│   │   ├── posts/                  # Post (photo) module
│   │   │   ├── posts.controller.ts # CRUD endpoints for posts
│   │   │   ├── posts.service.ts    # Post creation, retrieval, deletion logic
│   │   │   └── posts.module.ts
│   │   ├── feed/                   # Feed module
│   │   │   ├── feed.controller.ts  # GET /feed — returns posts from followed users
│   │   │   ├── feed.service.ts     # Queries posts ordered by createdAt for followers
│   │   │   └── feed.module.ts
│   │   ├── likes/                  # Like/unlike module
│   │   │   ├── likes.controller.ts # POST /likes, DELETE /likes
│   │   │   ├── likes.service.ts    # Toggle like state and count
│   │   │   └── likes.module.ts
│   │   ├── comments/               # Comment module
│   │   │   ├── comments.controller.ts
│   │   │   ├── comments.service.ts
│   │   │   └── comments.module.ts
│   │   ├── cloudinary/             # Media upload module
│   │   │   ├── cloudinary.service.ts  # Handles image upload to Cloudinary CDN
│   │   │   └── cloudinary.module.ts
│   │   └── prisma/                 # Prisma service wrapper
│   │       ├── prisma.service.ts   # Extends PrismaClient, connects on app init
│   │       └── prisma.module.ts
│   ├── prisma/
│   │   ├── schema.prisma           # Database schema — models: User, Post, Follow, Like, Comment
│   │   └── migrations/             # Auto-generated Prisma migration files
│   ├── nest-cli.json               # NestJS CLI configuration
│   ├── tsconfig.json               # Backend TypeScript config
│   └── package.json                # Backend dependencies (NestJS, Prisma, Firebase Admin, Cloudinary)
│
├── src/                            # Next.js frontend (App Router)
│   ├── app/                        # Route segments
│   │   ├── layout.tsx              # Root layout — wraps all pages with providers
│   │   ├── page.tsx                # Home/landing page (redirects to feed or login)
│   │   ├── (auth)/                 # Auth route group (no shared layout with main app)
│   │   │   ├── login/page.tsx      # Login page with Firebase sign-in
│   │   │   └── register/page.tsx   # Registration page
│   │   ├── feed/page.tsx           # Authenticated feed — shows posts from followed users
│   │   ├── profile/
│   │   │   └── [username]/page.tsx # Dynamic user profile page
│   │   ├── post/
│   │   │   └── [id]/page.tsx       # Single post detail page with comments
│   │   └── api/                    # Next.js API proxy routes
│   │       └── [...proxy]/route.ts # Catch-all proxy — forwards requests to NestJS with Auth header
│   ├── components/                 # Reusable UI components
│   │   ├── Navbar.tsx              # Top navigation bar
│   │   ├── PostCard.tsx            # Individual post display with like/comment actions
│   │   ├── PostGrid.tsx            # Grid layout for profile posts
│   │   ├── FollowButton.tsx        # Follow/unfollow toggle button
│   │   ├── CommentSection.tsx      # Post comments list and input
│   │   └── UploadModal.tsx         # Modal for creating a new post with image upload
│   ├── lib/                        # Utilities and shared logic
│   │   ├── firebase.ts             # Firebase client SDK initialization
│   │   ├── auth.ts                 # Auth helpers (getIdToken, onAuthStateChanged wrapper)
│   │   └── api.ts                  # Typed API client that attaches Bearer token to requests
│   ├── hooks/                      # Custom React hooks
│   │   ├── useAuth.ts              # Subscribes to Firebase auth state, exposes user & token
│   │   └── useFeed.ts              # Fetches and paginates feed posts
│   └── types/                      # Shared TypeScript interfaces
│       └── index.ts                # User, Post, Comment, Like type definitions
│
├── public/                         # Static assets served by Next.js
│   └── (images, icons, favicon)
│
├── .gitignore                      # Git ignore rules
├── .npmrc                          # pnpm settings (e.g. shamefully-hoist)
├── eslint.config.mjs               # ESLint flat config for Next.js + TypeScript
├── next.config.ts                  # Next.js config — image domains (Cloudinary, localhost)
├── package.json                    # Frontend dependencies (Next.js 16, React 19, Firebase, Lucide)
├── pnpm-lock.yaml                  # Lockfile for reproducible installs
├── pnpm-workspace.yaml             # Workspace definition — links frontend & backend packages
├── postcss.config.mjs              # PostCSS config for Tailwind CSS v4
├── tsconfig.json                   # Root TypeScript config (frontend)
└── vercel.json                     # Vercel deployment config (Next.js, pnpm build)
```

---

## Features

- **User Authentication** — Sign up and log in with Firebase (Email/Password or Google OAuth). Sessions are managed via Firebase ID tokens.
- **Photo Uploads** — Create posts by uploading images directly to Cloudinary. Images are served via Cloudinary's global CDN.
- **User Profiles** — View any user's profile, see their posts in a grid layout, follower/following counts, and follow/unfollow them.
- **Social Feed** — Authenticated feed showing the latest posts from users you follow, sorted by newest first.
- **Follow System** — Follow and unfollow users. The follow graph is stored in PostgreSQL and queried to build the feed.
- **Likes** — Like and unlike posts with real-time like count updates.
- **Comments** — Add and view comments on posts.
- **Responsive UI** — Tailwind CSS v4 utility classes for a mobile-first, responsive layout.
- **Type-Safe API** — End-to-end TypeScript across the frontend and backend with Prisma-generated types for the database models.

---

## Getting Started

### Prerequisites

- **Node.js** v18 or higher
- **pnpm** v9+ (`npm install -g pnpm`)
- **PostgreSQL** running locally or a hosted instance (e.g. Supabase, Railway)
- A **Firebase** project with Authentication enabled
- A **Cloudinary** account

### Installation

```powershell
# Clone the repository
git clone https://github.com/vishalraj55/Frameloop.git
cd Frameloop

# Install all dependencies (frontend + backend via pnpm workspace)
pnpm install
```

### Environment Variables

#### Frontend — create `.env.local` in the repo root

```env
# Firebase client config
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# NestJS backend URL (used by the Next.js API proxy)
NEXT_PUBLIC_API_URL=http://localhost:3000
```

#### Backend — create `.env` inside the `backend/` directory

```env
# PostgreSQL connection string
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/frameloop"

# Firebase Admin SDK (service account)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your_project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Cloudinary credentials
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Server port
PORT=3000
```

> **Note:** Never commit `.env` or `.env.local` files. They are listed in `.gitignore`.

### Running the App

**1. Set up the database**

```powershell
cd backend
pnpm prisma migrate dev --name init
pnpm prisma generate
```

**2. Start the NestJS backend**

```powershell
cd backend
pnpm run start:dev
# API available at http://localhost:3000
```

**3. Start the Next.js frontend** (in a new terminal from the repo root)

```powershell
pnpm run dev
# App available at http://localhost:3001
```

---

## Available Scripts

### Root (Frontend)

| Script  | Command          | Description                                                                |
| ------- | ---------------- | -------------------------------------------------------------------------- |
| `dev`   | `pnpm run dev`   | Start Next.js dev server with increased heap (`--max-old-space-size=4096`) |
| `build` | `pnpm run build` | Production build of the Next.js app                                        |
| `start` | `pnpm run start` | Serve the production build locally                                         |
| `lint`  | `pnpm run lint`  | Run ESLint across the frontend codebase                                    |

### Backend (`cd backend`)

| Script           | Command                   | Description                                |
| ---------------- | ------------------------- | ------------------------------------------ |
| `start:dev`      | `pnpm run start:dev`      | Start NestJS in watch mode (hot reload)    |
| `start:prod`     | `pnpm run start:prod`     | Start compiled NestJS production build     |
| `build`          | `pnpm run build`          | Compile TypeScript to `dist/`              |
| `prisma:migrate` | `pnpm prisma migrate dev` | Run pending database migrations            |
| `prisma:studio`  | `pnpm prisma studio`      | Open Prisma Studio GUI at `localhost:5555` |

---

## API Overview

All API routes are prefixed with `/api` when called from the frontend proxy. The backend listens directly on `http://localhost:3000`.

### Auth

Routes marked 🔒 require a valid Firebase ID token in the `Authorization: Bearer <token>` header. Routes marked 🔓 are publicly accessible (token optional).

### Users

| Method | Endpoint            | Auth | Description                             |
| ------ | ------------------- | ---- | --------------------------------------- |
| GET    | `/users/:id`        | 🔓   | Get a user's public profile             |
| PUT    | `/users/me`         | 🔒   | Update the authenticated user's profile |
| POST   | `/users/:id/follow` | 🔒   | Follow a user                           |
| DELETE | `/users/:id/follow` | 🔒   | Unfollow a user                         |

### Posts

| Method | Endpoint     | Auth | Description                         |
| ------ | ------------ | ---- | ----------------------------------- |
| GET    | `/posts`     | 🔓   | Get all posts (explore)             |
| POST   | `/posts`     | 🔒   | Create a new post with image upload |
| GET    | `/posts/:id` | 🔓   | Get a single post by ID             |
| DELETE | `/posts/:id` | 🔒   | Delete a post (owner only)          |

### Feed

| Method | Endpoint | Auth | Description                            |
| ------ | -------- | ---- | -------------------------------------- |
| GET    | `/feed`  | 🔒   | Get paginated feed from followed users |

### Likes

| Method | Endpoint         | Auth | Description   |
| ------ | ---------------- | ---- | ------------- |
| POST   | `/likes/:postId` | 🔒   | Like a post   |
| DELETE | `/likes/:postId` | 🔒   | Unlike a post |

### Comments

| Method | Endpoint            | Auth | Description                   |
| ------ | ------------------- | ---- | ----------------------------- |
| GET    | `/comments/:postId` | 🔓   | Get all comments for a post   |
| POST   | `/comments/:postId` | 🔒   | Add a comment to a post       |
| DELETE | `/comments/:id`     | 🔒   | Delete a comment (owner only) |

---

## Deployment

### Frontend — Vercel

The `vercel.json` at the repo root configures the frontend deployment:

```json
{
  "framework": "nextjs",
  "buildCommand": "pnpm run build",
  "installCommand": "pnpm install --frozen-lockfile",
  "outputDirectory": ".next"
}
```

1. Connect your GitHub repo to a Vercel project.
2. Set all `NEXT_PUBLIC_*` environment variables in the Vercel dashboard under **Settings → Environment Variables**.
3. Push to `main` — Vercel automatically builds and deploys.

### Backend - Render

The NestJS backend is hosted on [Render](https://render.com). Set the root directory to `backend/`, the start command to `pnpm run start:prod`, and add all backend env vars in the Render dashboard.

### Database - Neon

PostgreSQL is hosted on [Neon](https://neon.tech) (serverless Postgres). Copy the connection string from the Neon console and set it as `DATABASE_URL` in your Render environment variables.

### Uptime - UptimeRobot

Since Render's free tier spins down on inactivity, [UptimeRobot](https://uptimerobot.com) is configured to ping the backend every 5 minutes to keep it alive.

After deploying, update `NEXT_PUBLIC_API_URL` in Vercel to point to your Render backend URL.

---

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m "feat: add your feature"`
4. Push to your fork: `git push origin feature/your-feature-name`
5. Open a Pull Request against `main`.

Please follow [Conventional Commits](https://www.conventionalcommits.org/) for commit messages.

---

<!-- ## License

This project is open source. See the repository for license details.

--- -->

<div align="center">
  Built by <a href="https://github.com/vishalraj55">Vishal Rajbhar</a>
</div>
