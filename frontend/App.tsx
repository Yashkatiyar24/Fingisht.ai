import * as React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Dashboard } from "./pages/Dashboard";
import { Upload } from "./pages/Upload";
import { Transactions } from "./pages/Transactions";
import { Categories } from "./pages/Categories";
import { Budgets } from "./pages/Budgets";
import { Sidebar } from "./components/Sidebar";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="dark">
        <BrowserRouter>
          <div className="min-h-screen bg-background text-foreground">
            <div className="flex">
              <Sidebar />
              <main className="flex-1 overflow-auto">
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/upload" element={<Upload />} />
                  <Route path="/transactions" element={<Transactions />} />
                  <Route path="/categories" element={<Categories />} />
                  <Route path="/budgets" element={<Budgets />} />
                </Routes>
              </main>
            </div>
            <Toaster />
          </div>
        </BrowserRouter>
      </div>
    </QueryClientProvider>
  );
}
