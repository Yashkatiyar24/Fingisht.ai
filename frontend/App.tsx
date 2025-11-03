import * as React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ClerkProvider, SignedIn, SignedOut } from "@clerk/clerk-react";
import { Toaster } from "@/components/ui/toaster";
import { ClerkProfileSync } from "@/components/ClerkProfileSync";
import { Dashboard } from "./pages/Dashboard";
import UploadCsv from "./pages/UploadCsv";
import { Transactions } from "./pages/Transactions";
import { Categories } from "./pages/Categories";
import { Budgets } from "./pages/Budgets";
import { SignIn } from "./pages/SignIn";
import { SignUp } from "./pages/SignUp";
import { Sidebar } from "./components/Sidebar";
import { config } from "./config";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <SignedIn>
        {children}
      </SignedIn>
      <SignedOut>
        <Navigate to="/sign-in" replace />
      </SignedOut>
    </div>
  );
}

function AppInner() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/upload" element={<UploadCsv />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/budgets" element={<Budgets />} />
          </Routes>
          <ClerkProfileSync />
        </main>
      </div>
      <Toaster />
    </div>
  );
}

export default function App() {
  return (
    <ClerkProvider 
      publishableKey={config.clerk.publishableKey}
      afterSignInUrl="/dashboard"
      afterSignUpUrl="/dashboard"
    >
      <QueryClientProvider client={queryClient}>
        <div className="dark">
          <BrowserRouter>
            <Routes>
              <Route path="/sign-in/*" element={<SignIn />} />
              <Route path="/sign-up/*" element={<SignUp />} />
              <Route 
                path="/*" 
                element={
                  <ProtectedRoute>
                    <AppInner />
                  </ProtectedRoute>
                } 
              />
            </Routes>
          </BrowserRouter>
        </div>
      </QueryClientProvider>
    </ClerkProvider>
  );
}
