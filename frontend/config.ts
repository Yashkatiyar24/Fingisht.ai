export const config = {
  clerk: {
    publishableKey: import.meta.env.VITE_CLERK_PUBLISHABLE_KEY!,
  },
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL!,
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY!,
  },
};
