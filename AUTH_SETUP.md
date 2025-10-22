# Dual Authentication Setup: Clerk + Supabase

This application uses a dual authentication system:
- **Clerk**: Handles frontend authentication UI (sign-in, sign-up, session management)
- **Supabase**: Stores user data in the backend database with row-level security

## Environment Variables

### Frontend (Vite)
Create a `.env` file in the frontend directory or set these in your hosting environment:

```env
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Backend (Encore.ts Secrets)
Configure these secrets in the Leap Settings (sidebar → Settings):

1. **ClerkSecretKey**: Your Clerk secret key (already configured)
2. **SupabaseURL**: Your Supabase project URL (e.g., `https://xxxxx.supabase.co`)
3. **SupabaseServiceKey**: Your Supabase service role key (for admin operations)

## How It Works

### 1. User Sign-In Flow
1. User visits the app and is redirected to `/sign-in` if not authenticated
2. User signs in via Clerk's UI component
3. Clerk issues a JWT token and creates a session
4. User is redirected to `/dashboard`
5. Frontend stores the session in local storage (persists on refresh)

### 2. User Sync to Supabase
When a user signs up or updates their profile in Clerk:

1. Clerk sends a webhook to `/webhooks/clerk` endpoint
2. Backend receives the webhook and syncs user data to Supabase Auth
3. User appears in Supabase → Authentication → Users tab
4. User data includes: ID, email, name, and profile image

### 3. Protected Routes
All app routes (except `/sign-in` and `/sign-up`) are protected:
- Unauthenticated users are redirected to `/sign-in`
- After login, users are redirected to `/dashboard`
- Session persists on page refresh

### 4. User Interface
- **Sidebar**: Shows Clerk's `<UserButton/>` component with user info
- **Logout**: Click the UserButton to access logout option
- Session is cleared cleanly on logout

## Setup Instructions

### 1. Clerk Configuration

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Create or select your application
3. Copy your **Publishable Key** and set as `VITE_CLERK_PUBLISHABLE_KEY`
4. Copy your **Secret Key** and add to Leap Settings as `ClerkSecretKey`

### 2. Configure Clerk Webhooks

1. In Clerk Dashboard, go to **Webhooks**
2. Create a new webhook endpoint
3. Set URL to: `https://your-app.api.lp.dev/webhooks/clerk`
4. Subscribe to events:
   - `user.created`
   - `user.updated`
   - `user.deleted`
5. Copy the signing secret (optional, for verification)

### 3. Supabase Configuration

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Create or select your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → `VITE_SUPABASE_URL` and `SupabaseURL`
   - **anon public key** → `VITE_SUPABASE_ANON_KEY`
   - **service_role key** → `SupabaseServiceKey`

### 4. Test the Setup

1. Clear your browser cache and cookies
2. Visit your app
3. You should be redirected to `/sign-in`
4. Create a new account via `/sign-up`
5. After signup, you should be redirected to `/dashboard`
6. Check Supabase → Authentication → Users to verify user was created
7. Refresh the page - you should remain logged in
8. Click UserButton and logout - you should be redirected to `/sign-in`

## Security Notes

- Never commit secrets or API keys to version control
- Use environment variables for all sensitive configuration
- Supabase service role key has admin privileges - keep it secure
- Frontend uses anon key (public) for client-side operations
- Backend uses service role key (private) for admin operations
- All API calls include Clerk JWT for authentication

## Troubleshooting

### Users not appearing in Supabase
- Verify webhook is configured correctly in Clerk
- Check webhook endpoint is accessible: `https://your-app.api.lp.dev/webhooks/clerk`
- Check backend logs for webhook errors
- Ensure `SupabaseURL` and `SupabaseServiceKey` are set correctly

### Session not persisting
- Clerk automatically handles session persistence
- Check browser local storage for Clerk session data
- Ensure cookies are enabled in browser

### Redirect loop
- Verify `afterSignInUrl` and `afterSignUpUrl` are set to `/dashboard`
- Check that `/dashboard` route is inside `<SignedIn>` component
- Clear browser cache and try again
