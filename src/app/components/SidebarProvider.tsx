"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface SidebarContextType {
  isCollapsed: boolean;
  toggleSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}

interface SidebarProviderProps {
  children: ReactNode;
}

export function SidebarProvider({ children }: SidebarProviderProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <SidebarContext.Provider value={{ isCollapsed, toggleSidebar }}>
      <div className="min-h-screen flex">
        {/* Sidebar */}
        <div className={`${isCollapsed ? 'w-16' : 'w-60'} transition-all duration-300 ease-in-out`}>
          <Sidebar />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="flex items-center justify-between border-b px-6 bg-white">
            <div className="flex items-center gap-4">
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-md hover:bg-gray-100 transition-colors"
                title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {isCollapsed ? (
                  <ChevronRight className="h-5 w-5 text-gray-600" />
                ) : (
                  <ChevronLeft className="h-5 w-5 text-gray-600" />
                )}
              </button>
              <div className="py-3 text-sm text-foreground/70">Admin Dashboard</div>
            </div>
            <div className="flex items-center gap-3 py-3 text-sm text-foreground/70">
              <span>Welcome, Admin</span>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-6 bg-gray-50">
            {children}
          </main>
        </div>
      </div>
    </SidebarContext.Provider>
  );
}
