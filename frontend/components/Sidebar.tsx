import * as React from "react";
import { NavLink } from "react-router-dom";
import { UserButton, useUser } from "@clerk/clerk-react";
import { 
  LayoutDashboard, 
  Upload, 
  Receipt, 
  Tags, 
  PiggyBank,
  TrendingUp
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/upload", icon: Upload, label: "Upload" },
  { to: "/transactions", icon: Receipt, label: "Transactions" },
  { to: "/categories", icon: Tags, label: "Categories" },
  { to: "/budgets", icon: PiggyBank, label: "Budgets" },
];

export function Sidebar() {
  const { user } = useUser();
  
  return (
    <aside className="w-64 min-h-screen border-r border-border/40 bg-card/30 backdrop-blur-sm flex flex-col">
      <div className="p-6 flex-1">
        <div className="flex items-center gap-2 mb-8">
          <TrendingUp className="w-8 h-8 text-cyan-400" />
          <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            ExpenseFlow
          </h1>
        </div>
        
        <nav className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200",
                  "hover:bg-accent/50",
                  isActive && "bg-gradient-to-r from-cyan-500/10 to-purple-500/10 text-cyan-400 border border-cyan-500/20"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon className={cn("w-5 h-5", isActive && "text-cyan-400")} />
                  <span className={cn("font-medium", isActive && "text-cyan-400")}>
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>
      
      <div className="p-6 border-t border-border/40">
        <div className="flex items-center gap-3">
          <UserButton 
            appearance={{
              elements: {
                avatarBox: "w-10 h-10",
              },
            }}
          />
          {user && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {user.fullName || user.primaryEmailAddress?.emailAddress}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user.primaryEmailAddress?.emailAddress}
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
