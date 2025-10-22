import * as React from "react";
import { SignIn as ClerkSignIn } from "@clerk/clerk-react";
import { TrendingUp } from "lucide-react";

export function SignIn() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <TrendingUp className="w-12 h-12 text-cyan-400" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              ExpenseFlow
            </h1>
          </div>
          <p className="text-muted-foreground">
            Sign in to manage your expenses
          </p>
        </div>
        
        <div className="flex justify-center">
          <ClerkSignIn 
            routing="path" 
            path="/sign-in"
            signUpUrl="/sign-up"
            afterSignInUrl="/dashboard"
            appearance={{
              elements: {
                rootBox: "mx-auto",
                card: "bg-card border border-border/40 shadow-lg",
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
