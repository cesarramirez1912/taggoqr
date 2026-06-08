"use client";

import { useAuth } from "@/lib/contexts/AuthContext";
import { LogoutButton } from "./LogoutButton";

export function GlobalHeader() {
  const { user, loading } = useAuth();

  if (loading || !user) return null;

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center px-6 shadow-sm">
      <div className="flex-1"></div>
      <div className="flex items-center space-x-6">
        <span className="text-sm font-medium text-slate-500">{user.email}</span>
        <LogoutButton />
        <div className="w-8 h-8 bg-blue-600 rounded-full text-white flex items-center justify-center font-bold text-sm uppercase">
          {user.email?.[0] || 'U'}
        </div>
      </div>
    </header>
  );
}
