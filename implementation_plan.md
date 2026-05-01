# Add Backend and Prepare for Google Cloud Run Deployment

This document outlines the technical plan for transitioning the current purely frontend SkillSwap application into a full-stack application and deploying it to Google Cloud Run.

## Problem Context & Goal
Currently, SkillSwap is a static React application built with Vite, relying on frontend state for data manipulation. To build real features (like file storage, user authentication, and chat), we need a backend API. The final goal is to deploy the complete application (Frontend + Backend) onto **Google Cloud Run**, a scalable, serverless container platform.

## Proposed Architecture (Single Service Monorepo)
To minimize Cloud Run costs and simplify deployment, we will use a **Single Container Deployment** strategy. 
*   **Backend:** A Node.js + Express server will host the API endpoints.
*   **Frontend:** The React/Vite app will be built into static files.
*   **Integration:** In production, the Express backend will statically serve the built React files alongside handling `/api` requests.
*   **Containerization:** A single `Dockerfile` will build both layers and run the Express server.

---

## User Review Required

> [!IMPORTANT]  
> Please review the chosen backend technology stack. We are proposing **Node.js with Express** because it allows us to use JavaScript across both the frontend and backend, which simplifies development. If you prefer Python (FastAPI/Flask) or another language for the backend, please let me know before we begin.

## Technology Decisions (AISeekho Buildathon Credits)

> [!NOTE]  
> Based on your AISeekho Buildathon credits (Google Cloud, Gemini API, Firebase), we have resolved the open questions from the previous plan:
> 1. **Database:** We will use **Firebase Firestore** (a NoSQL document database) for storing user profiles, chat messages, and metadata.
> 2. **File Storage:** We will use **Firebase Cloud Storage** for securely storing and serving user-uploaded files.
> 3. **Authentication:** We will use **Firebase Authentication** for secure and easy user login/signup.
> 4. **AI Integration:** We will integrate the **Gemini API** (`@google/generative-ai`) into the Node.js backend to power AI features (like profile generation or smart matchmaking).

---

## Proposed Changes

### 1. Backend Setup & APIs
We will create a dedicated backend environment within the existing project.

#### [NEW] `server/package.json`
- Initialize a new Node project specifically for the backend to keep dependencies isolated.
- Install `express`, `cors`, `dotenv`, `firebase-admin` (for backend DB/Storage access), and `@google/generative-ai` (for Gemini integration).

#### [NEW] `server/index.js` (or `server/server.js`)
- The main entry point for the Express backend.
- Configure middleware (CORS, JSON parsing).
- Set up a fallback route to serve the Vite frontend's `dist/` folder in production.

#### [NEW] `server/routes/api.js`
- Create structured API routers.
- Implement initial placeholder APIs matching frontend pages:
  - `POST /api/auth/login`
  - `GET /api/files`
  - `POST /api/files/upload`

### 2. Frontend Adjustments
We need to configure the frontend to communicate with the new backend.

#### [MODIFY] `vite.config.js`
- Add a proxy configuration so that during local development, API calls from the frontend (e.g., `fetch('/api/...')`) are automatically forwarded to the local Express server running on a different port (e.g., `http://localhost:3000`).

#### [MODIFY] `src/pages/Auth.jsx` & `src/pages/Files.jsx`
- Refactor local state logic to make asynchronous HTTP requests (`fetch`) to our new backend APIs.

### 3. Containerization for Google Cloud Run
Cloud Run requires the application to be containerized using Docker.

#### [NEW] `Dockerfile`
A multi-stage Docker build file:
- **Stage 1 (Frontend Build):** Install frontend dependencies and run `npm run build` using Vite.
- **Stage 2 (Backend Setup):** Install backend dependencies, copy the built frontend `dist/` folder into the server directory, and expose the port.
- **CMD:** `node index.js`

#### [NEW] `.dockerignore`
- Ensure `node_modules`, `.git`, and local environment variables are excluded to keep the container lightweight and secure.

---

## Verification Plan

### Local Verification
1. Open two terminal instances.
2. Terminal 1: Run `npm run dev` in the root (Frontend).
3. Terminal 2: Run `npm start` in the `server` folder (Backend).
4. Verify the frontend successfully logs in and fetches mock data from the backend APIs.

### Docker Verification
1. Run `docker build -t skillswap-app .` locally to ensure the multi-stage build completes without errors.
2. Run `docker run -p 8080:8080 skillswap-app` and verify the entire application is accessible via `localhost:8080`.

### Cloud Run Deployment Instructions
Once verified locally, I will provide you with the exact `gcloud run deploy` commands to push the container to your Google Cloud project.
