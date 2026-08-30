<!-- 📌 CORE CONFIG: [docs/CORE-CONFIG.md](./CORE-CONFIG.md)`n     📌 FILING LIFECYCLE: [./FILING-LIFECYCLE.md](./FILING-LIFECYCLE.md)`n     📌 SUBSCRIPTION: [docs/subscription and monitaizetion.md](./subscription and monitaizetion.md)`n     📌 UBIQUITOUS LANGUAGE: [docs/UBIQUITOUS-LANGUAGE.md](./UBIQUITOUS-LANGUAGE.md)`n     🔄 Last synced: 2026-08-27 -->
# Google OAuth 2.0 Setup Guide

This guide explains how to enable Google OAuth "Sign in with Google" functionality in the OVDS application.

## Overview

The Google OAuth integration allows users to:
- Sign in using their Google account
- Auto-provision a new user account on first login (as CLIENT role)
- Link existing email-based accounts to their Google identity

## Prerequisites

1. A Google Cloud Console account
2. A configured Google Cloud Project
3. The backend must have `passport-google-oauth20` installed

## Step 1: Install Dependencies

The Google OAuth strategy requires `passport-google-oauth20`. This should already be installed, but if not:

```bash
cd apps/backend
npm install passport-google-oauth20@2.0.0 --save
npm install @types/passport-google-oauth20@2.0.16 --save-dev
```

## Step 2: Configure Google Cloud Console

### 2.1 Create OAuth 2.0 Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create a new one)
3. Navigate to **APIs & Services > Credentials**
4. Click **Create Credentials > OAuth client ID**
5. Select **Web application** as the application type
6. Configure the following:

   **Name:** OVDS Local Development (or any name you prefer)

   **Authorized JavaScript origins:**
   ```
   http://localhost:5173
   http://127.0.0.1:5173
   http://localhost:3000
   http://127.0.0.1:3000
   ```

   **Authorized redirect URIs:**
   ```
   http://127.0.0.1:3000/api/auth/google/callback
   http://localhost:3000/api/auth/google/callback
   ```

   > **Important:** The redirect URI must match exactly what's configured in your `.env` file.

7. Click **Create**
8. Save the **Client ID** and **Client Secret** — you'll need these for the next step

### 2.2 Enable Required APIs

Make sure the following API is enabled:
- **Google+ API** (or **Google People API**)

Navigate to **APIs & Services > Library** and search for "Google+ API" or "People API", then enable it.

## Step 3: Configure Backend Environment

Edit `apps/backend/.env` and add your Google OAuth credentials:

```bash
# ── Google OAuth (Get credentials from https://console.cloud.google.com) ──────
GOOGLE_CLIENT_ID="8678-8623-4215"
GOOGLE_CLIENT_SECRET="your-client-secret-here"
GOOGLE_CALLBACK_URL="http://127.0.0.1:3000/api/auth/google/callback"
```

**Notes:**
- Replace `your-client-id-here` and `your-client-secret-here` with the values from Step 2.1
- The `GOOGLE_CALLBACK_URL` must match one of the authorized redirect URIs you configured in Google Cloud Console
- For production, update these values with your production domain

## Step 4: Configure Frontend Environment

The frontend doesn't need additional Google-specific environment variables. However, ensure `VITE_API_BASE_URL` points to your backend:

```bash
# apps/frontend/.env
VITE_API_BASE_URL=http://127.0.0.1:3000/api
```

## Step 5: Restart the Application

Restart both the backend and frontend servers to load the new environment variables:

```bash
# Backend
cd apps/backend
npm run dev

# Frontend (in a separate terminal)
cd apps/frontend
npm run dev
```

## Step 6: Test the Integration

1. Navigate to `http://127.0.0.1:5173/login`
2. Click the **"Google"** button under "Continue with"
3. You should be redirected to Google's consent screen
4. Grant the requested permissions
5. You will be redirected back to the application and automatically signed in

## How It Works

### Backend Flow

1. **Initiate OAuth Flow**
   - User clicks "Sign in with Google" on the frontend
   - Frontend redirects to `GET /api/auth/google`
   - `GoogleAuthGuard` triggers Passport's Google strategy
   - User is redirected to Google's consent screen

2. **Google Callback**
   - After user grants consent, Google redirects to `GET /api/auth/google/callback?code=...`
   - `GoogleStrategy.validate()` is called with the user's Google profile
   - Strategy looks up user by `auth0Id` (stored as `google-oauth2|{googleId}`) or email
   - If user doesn't exist, a new account is auto-provisioned with:
     - Role: `CLIENT`
     - Username: `google_{baseUsername}`
     - Password: empty string (OAuth-only account)
     - Employee record created
     - Customer record created
   - If user exists, update `lastLoginAt` and link Google ID if missing
   - Strategy returns user object to controller

3. **Session Creation**
   - Controller calls `authService.auth0Session()` to generate a local JWT
   - JWT contains: `{ sub, username, role, employeeId, companyId, auth0: true }`
   - Backend redirects to `${FRONTEND_URL}/auth/google/callback?token={jwt}`

### Frontend Flow

1. **Callback Handler**
   - `GoogleCallback.tsx` component mounts at `/auth/google/callback`
   - Reads `token` query parameter
   - Fetches `GET /api/auth/me` using the token to get full user profile
   - Calls `AuthContext.login(token, user)` to store session in localStorage
   - Redirects to user's default dashboard using `rbac.defaultRoute(user.role)`

2. **Session Management**
   - Token stored in `localStorage.getItem('token')`
   - User object stored in `localStorage.getItem('user')`
   - All subsequent API requests include `Authorization: Bearer {token}` header

## Database Schema

Google user IDs are stored in the `User.auth0Id` column using the format:
```
google-oauth2|{googleId}
```

This format is consistent with how Auth0 stores social login identities, allowing reuse of the existing `auth0Id` column without requiring a database migration.

## Security Considerations

1. **Token Storage:**
   - JWT tokens are stored in `localStorage` (not cookies)
   - Tokens expire after 1 day by default (configurable in `auth.module.ts`)

2. **No Password:**
   - Google OAuth users have an empty `password` field
   - They cannot log in via email/password until they explicitly set a password

3. **Email Verification:**
   - Google verifies email addresses
   - Auto-provisioned accounts are immediately active (`isActive: true`)

4. **Role Assignment:**
   - First-time Google logins default to `CLIENT` role
   - Admins can change roles via `/settings/users`

## Troubleshooting

### Error: "Google OAuth is not configured"

**Cause:** `GOOGLE_CLIENT_ID` or `GOOGLE_CLIENT_SECRET` is missing from `.env`

**Solution:** Add the credentials to `apps/backend/.env` and restart the backend server

### Error: "redirect_uri_mismatch"

**Cause:** The callback URL doesn't match what's registered in Google Cloud Console

**Solution:**
1. Check `GOOGLE_CALLBACK_URL` in your `.env` file
2. Ensure it matches exactly (including protocol, domain, port, and path) one of the **Authorized redirect URIs** in Google Cloud Console
3. Common mismatch: `localhost` vs `127.0.0.1` — use `127.0.0.1` consistently

### Error: "Cannot GET /api/auth/google"

**Cause:** Backend routes not loaded, or wrong API base URL

**Solution:**
1. Verify the backend is running: `http://127.0.0.1:3000/api/health`
2. Check `VITE_API_BASE_URL` in `apps/frontend/.env`
3. Restart the backend after adding Google OAuth credentials

### Users Can't See the Google Button

**Cause:** Auth0 is enabled, so the frontend shows only the Auth0 login button

**Solution:**
- When `VITE_AUTH0_ENABLED=true`, the frontend prefers Auth0's Universal Login
- To show the custom Google button, set `VITE_AUTH0_ENABLED=false` in `apps/frontend/.env`
- You can configure Google as a social connection in Auth0 instead if you prefer to keep Auth0 enabled

## Production Deployment

For production, update the following:

1. **Google Cloud Console:**
   - Add your production domain to **Authorized JavaScript origins**
   - Add your production callback URL to **Authorized redirect URIs**
   - Example: `https://app.ovds.ovds/api/auth/google/callback`

2. **Backend `.env`:**
   ```bash
   GOOGLE_CLIENT_ID="production-client-id.apps.googleusercontent.com"
   GOOGLE_CLIENT_SECRET="production-client-secret"
   GOOGLE_CALLBACK_URL="https://app.ovds.ovds/api/auth/google/callback"
   FRONTEND_URL="https://app.ovds.ovds"
   ```

3. **Frontend `.env`:**
   ```bash
   VITE_API_BASE_URL=https://app.ovds.ovds/api
   ```

## API Endpoints

### `GET /api/auth/google`
Initiates the OAuth flow. Redirects to Google's consent screen.

**Query params:** None

**Response:** 302 Redirect to Google

### `GET /api/auth/google/callback`
Handles the OAuth callback from Google.

**Query params:**
- `code` — Authorization code from Google
- `state` — CSRF protection token

**Response:** 302 Redirect to frontend with token

### `GET /api/auth/google/status`
Returns whether Google OAuth is enabled on the backend.

**Response:**
```json
{
  "enabled": true
}
```

## Files Modified

### Backend
- `apps/backend/.env` — Added Google OAuth environment variables
- `apps/backend/src/auth/google.strategy.ts` — ✨ New Google OAuth Passport strategy
- `apps/backend/src/auth/guards/google-auth.guard.ts` — ✨ New guards for Google OAuth routes
- `apps/backend/src/auth/auth.controller.ts` — Added `/google`, `/google/callback`, `/google/status` endpoints
- `apps/backend/src/auth/auth.module.ts` — Registered `GoogleStrategy` provider
- `apps/backend/package.json` — Added `passport-google-oauth20` dependency

### Frontend
- `apps/frontend/src/pages/GoogleCallback.tsx` — ✨ New callback handler component
- `apps/frontend/src/app.tsx` — Added `/auth/google/callback` route
- `apps/frontend/src/pages/Login.tsx` — Already had Google button (no changes needed)

## Additional Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Passport Google OAuth20 Strategy](https://www.passportjs.org/packages/passport-google-oauth20/)
- [OVDS Auth Architecture](./apps/backend/src/auth/README.md)



