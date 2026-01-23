# Smana Hotel Admin Panel

## Overview
Next.js admin dashboard for hotel management.

## Setup

1.  **Install Dependencies:**
    ```bash
    npm install
    ```

2.  **Environment Variables:**
    Create a `.env.local` file.
    ```env
    # URL of the Backend API (without /api suffix)
    NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
    ```
    For production, this should point to `https://api.smanahotels.com`.

3.  **Run Locally:**
    ```bash
    npm run dev
    ```

## Production Deployment
- Hosted at: `https://admin.smanahotels.com`
- Set `NEXT_PUBLIC_BACKEND_URL=https://api.smanahotels.com` in Vercel or your hosting environment variables.
- Build: `npm run build`
- Start: `npm start`

## Configuration
Configuration is managed in `lib/config.ts`. It defaults to `http://localhost:5000` if `NEXT_PUBLIC_BACKEND_URL` is not set.
