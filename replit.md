# FINSIGHT.AI - Replit Setup

## Project Overview
This is FINSIGHT.AI — a smart expense tracking dashboard built with:
- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Encore.ts framework (TypeScript microservices)
- **Authentication**: Clerk (frontend) + Supabase (backend sync)
- **Database**: PostgreSQL (via Encore Cloud or Supabase)

## Current Setup Status

### ✅ Completed
- Bun package manager installed
- Frontend and backend dependencies installed  
- Vite configured for Replit (port 5000, host 0.0.0.0)
- Environment secrets configured (Clerk + Supabase)
- Encore CLI installed

### ⚠️ Important Limitation
**Encore backend cannot run locally in Replit** because:
- Encore requires Docker for its PostgreSQL database
- Replit doesn't support Docker/nested virtualization
- Encore needs Encore Cloud authentication even for local development

## Running Options

### Option 1: Frontend Only (Current Setup)
The Replit workflow runs only the frontend. The backend must be deployed separately.

**To run the frontend:**
```bash
cd frontend
bun run dev
```

The frontend will be available at the Replit webview URL on port 5000.

**Backend requirement:**
- Deploy the backend to Encore Cloud following `DEVELOPMENT.md`
- Update frontend to point to your deployed backend URL

### Option 2: Full Local Development (Outside Replit)
To run both frontend and backend locally, you need:

1. **Install Docker** (not available in Replit)
2. **Install Encore CLI** (already done)
3. **Run backend**:
   ```bash
   cd backend
   encore auth login  # Authenticate with Encore Cloud
   encore run        # Starts backend on localhost:4000
   ```
4. **Run frontend**:
   ```bash
   cd frontend
   bun run dev       # Starts on localhost:5173 (or 5000 in Replit)
   ```

### Option 3: Deploy Everything to Encore Cloud
1. Authenticate Encore CLI: `encore auth login`
2. Deploy backend: `cd backend && git push encore` (see DEVELOPMENT.md)
3. Deploy frontend as static site or use Replit Deployments

## Environment Variables

### Already Configured (Replit Secrets)
- `ClerkSecretKey` - Backend Clerk authentication
- `SupabaseURL` - Supabase project URL
- `SupabaseServiceKey` - Supabase admin key
- `VITE_CLERK_PUBLISHABLE_KEY` - Frontend Clerk key
- `VITE_SUPABASE_URL` - Frontend Supabase URL
- `VITE_SUPABASE_ANON_KEY` - Frontend Supabase public key

### Frontend (.env created)
The frontend `.env` file has been created with actual values from Replit secrets:
- `VITE_CLERK_PUBLISHABLE_KEY` - Clerk public key for authentication UI
- `VITE_SUPABASE_URL` - Supabase project URL for client-side access
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key for public access
- `VITE_CLIENT_TARGET` - Backend API URL (currently set to `http://localhost:4000`)

**To connect to a deployed backend:** Update `VITE_CLIENT_TARGET` in `frontend/.env` to your Encore Cloud backend URL (e.g., `https://staging-smart-expense-dashboard-i542.encr.app`)

## Database Setup

The application uses two database systems:
1. **Encore's managed PostgreSQL** - For Encore framework features
2. **Supabase PostgreSQL** - For user data and authentication

**Migrations:**
- `backend/db/migrations/` - Encore's DB schema
- `backend/external_dbs/postgres/migrations/` - Supabase schema

These migrations run automatically when deploying to Encore Cloud.

## Next Steps

1. **Deploy Backend to Encore Cloud** (recommended):
   - Follow instructions in `DEVELOPMENT.md`
   - Ensure secrets are set in Encore Cloud dashboard
   - Copy the deployed backend URL

2. **Update Frontend Configuration**:
   - Open `frontend/.env` and update `VITE_CLIENT_TARGET` to your deployed backend URL
   - Restart the frontend workflow to apply changes
   - Test the frontend connects to the deployed backend

3. **Configure Clerk Webhook**:
   - In Clerk Dashboard, add webhook: `https://your-app.api.encore.dev/webhooks/clerk`
   - Subscribe to: `user.created`, `user.updated`, `user.deleted`

4. **Test the Application**:
   - Visit the frontend URL
   - Sign up/sign in with Clerk
   - Verify user syncs to Supabase
   - Test expense tracking features

## Architecture

```
┌─────────────────┐
│  Replit         │
│  ┌───────────┐  │
│  │ Frontend  │  │ (React + Vite on port 5000)
│  │ (Local)   │  │
│  └─────┬─────┘  │
│        │        │
└────────┼────────┘
         │
         │ API Calls
         │
┌────────▼────────┐
│ Encore Cloud    │
│ ┌─────────────┐ │
│ │  Backend    │ │ (Encore.ts APIs)
│ │  (Deployed) │ │
│ └──────┬──────┘ │
│        │        │
└────────┼────────┘
         │
    ┌────┴────┐
    │         │
┌───▼───┐ ┌──▼──────┐
│ Clerk │ │ Supabase│
│ Auth  │ │   DB    │
└───────┘ └─────────┘
```

## User Preferences
- Package manager: Bun
- Framework: Encore.ts + React
- Authentication: Clerk + Supabase dual auth

## Recent Changes (Oct 23, 2025)
- Installed Bun 1.2.16 and dependencies
- Configured Vite for Replit compatibility (0.0.0.0:5000)
- Added environment secrets for Clerk and Supabase
- Installed Encore CLI v1.50.6
- Created frontend .env file
- Identified Encore + Replit compatibility limitation (Docker requirement)
