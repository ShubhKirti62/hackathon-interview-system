# Deployment Guide for Hackathon Interview System

This guide will help you deploy the "Hackathon Interview System" for free using **Render** (Backend) and **Vercel** (Frontend).

## Prerequisites

1.  **GitHub Account**: You need to push your code to a GitHub repository.
2.  **MongoDB Atlas Account**: You likely already have this since you have a `MONGO_URI`.
3.  **Render Account**: Sign up at [render.com](https://render.com/).
4.  **Vercel Account**: Sign up at [vercel.com](https://vercel.com/).

---

## Part 1: Backend Deployment (Render)

We will use Render's **Free Web Service** tier.

1.  **Push to GitHub**: Make sure your latest code is pushed to a GitHub repository.
2.  **Create New Web Service**:
    *   Go to your Render Dashboard.
    *   Click **New +** -> **Web Service**.
    *   Connect your GitHub repository.
3.  **Configure Service**:
    *   **Name**: `interview-system-backend` (or similar)
    *   **Region**: Choose the one closest to you (e.g., Singapore, Frankfurt).
    *   **Root Directory**: `backend` (Important! Your backend code is in a subfolder).
    *   **Runtime**: `Node`
    *   **Build Command**: `npm install`
    *   **Start Command**: `npm run start:prod` (or `node index.js`)
    *   **Instance Type**: Select **Free**.
4.  **Environment Variables**:
    *   Scroll down to the "Environment Variables" section and add the following keys from your `.env` file:
        *   `MONGO_URI`: (Your full MongoDB connection string)
        *   `JWT_SECRET`: (Your secret key)
        *   `GEMINI_API_KEY`: (Your Google Gemini AI key)
        *   `SMTP_HOST`: `smtp.gmail.com`
        *   `SMTP_PORT`: `587`
        *   `SMTP_USER`: (Your email)
        *   `SMTP_PASS`: (Your app password)
        *   `NODE_ENV`: `production`
5.  **Deploy**: Click **Create Web Service**.
    *   Wait for the deployment to finish. It might take a few minutes.
    *   Once done, copy the **onrender.com URL** (e.g., `https://interview-system-backend.onrender.com`). You will need this for the frontend.

> **Note**: The free instance on Render "spins down" after 15 minutes of inactivity. The first request after inactivity might take 50+ seconds to load. Keep it warm before your demo!

---

## Part 2: Frontend Deployment (Vercel)

We will use Vercel's **Free Hobby** tier.

1.  **Create New Project**:
    *   Go to your Vercel Dashboard.
    *   Click **Add New...** -> **Project**.
    *   Import the same GitHub repository.
2.  **Configure Project**:
    *   **Framework Preset**: Select **Vite**.
    *   **Root Directory**: Click **Edit** and select `frontend`.
3.  **Environment Variables**:
    *   Expand the "Environment Variables" section.
    *   Add the following:
        *   **Name**: `VITE_API_URL`
        *   **Value**: Paste your **Render Backend URL** here (e.g., `https://interview-system-backend.onrender.com/api`).
        *   *Important*: Ensure you add `/api` at the end if your backend routes require it (your code seems to expect the base URL, but `api.ts` defaults to `.../api`, so if your render URL is just the domain, add `/api`).
        *   Example: `https://my-app.onrender.com/api`
4.  **Deploy**: Click **Deploy**.
    *   Vercel will build and deploy your site.
    *   Once complete, you will get a live URL (e.g., `https://hackathon-interview-system.vercel.app`).

---

## Part 3: Final Checks

1.  **Update Backend CORS (Optional but Recommended)**:
    *   Currently, your backend allows all origins (`cors()`). This is fine for a hackathon.
    *   If you want to secure it, after you get your Vercel URL, go back to Render -> Environment Variables and add `FRONTEND_URL` with your Vercel URL.
2.  **Test the Flow**:
    *   Open your Vercel URL.
    *   Try to log in / register.
    *   Check if the Candidate Dashboard loads (this confirms backend connection).
    *   Test the AI interview flow.

## Troubleshooting

*   **"Network Error"**: Usually means `VITE_API_URL` is wrong or the Backend is sleeping (Render free tier). Check the console network tab.
*   **404 on Refresh**: I added a `vercel.json` file to fix this. If it persists, ensure `vercel.json` is in the `frontend` root.
*   **Database/Auth Errors**: Check your `MONGO_URI` and `JWT_SECRET` in Render environment variables.
