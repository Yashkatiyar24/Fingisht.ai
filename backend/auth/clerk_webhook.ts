import { api } from "encore.dev/api";
import { secret } from "encore.dev/config";
import { Header } from "encore.dev/api";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = secret("SupabaseURL");
const supabaseServiceKey = secret("SupabaseServiceKey");

interface ClerkWebhookEvent {
  type: string;
  data: {
    id: string;
    email_addresses: Array<{ email_address: string; id: string }>;
    image_url?: string;
    first_name?: string;
    last_name?: string;
  };
}

export const clerkWebhook = api(
  { auth: false, expose: true, method: "POST", path: "/webhooks/clerk", bodyLimit: 5 * 1024 * 1024 },
  async (event: ClerkWebhookEvent): Promise<{ success: boolean }> => {
    const supabase = createClient(supabaseUrl(), supabaseServiceKey(), {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    if (event.type === "user.created" || event.type === "user.updated") {
      const clerkUserId = event.data.id;
      const email = event.data.email_addresses[0]?.email_address;
      const name = event.data.first_name && event.data.last_name
        ? `${event.data.first_name} ${event.data.last_name}`
        : event.data.first_name || event.data.last_name || null;
      const imageUrl = event.data.image_url;

      if (!email) {
        console.error("No email found for user", clerkUserId);
        return { success: false };
      }

      const { data: existingUser } = await supabase.auth.admin.getUserById(clerkUserId);

      if (existingUser.user) {
        await supabase.auth.admin.updateUserById(clerkUserId, {
          email,
          user_metadata: {
            name,
            image: imageUrl,
          },
        });
      } else {
        const { error } = await supabase.auth.admin.createUser({
          id: clerkUserId,
          email,
          email_confirm: true,
          user_metadata: {
            name,
            image: imageUrl,
          },
        });

        if (error) {
          console.error("Error creating user in Supabase:", error);
          return { success: false };
        }
      }

      return { success: true };
    }

    if (event.type === "user.deleted") {
      const clerkUserId = event.data.id;
      
      const { error } = await supabase.auth.admin.deleteUser(clerkUserId);

      if (error) {
        console.error("Error deleting user from Supabase:", error);
        return { success: false };
      }

      return { success: true };
    }

    return { success: true };
  }
);
