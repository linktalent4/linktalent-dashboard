"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, Building2, CheckCircle2, CreditCard, Briefcase } from "lucide-react";
import { useSidebar } from "./SidebarProvider";

function SidebarLink({ href, label, Icon }: { href: string; label: string; Icon: React.ComponentType<any> }) {
  const pathname = usePathname();
  const { isCollapsed } = useSidebar();
  const active = pathname === href;
  
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors group relative ${
        active 
          ? "bg-blue-600 text-white" 
          : "text-gray-700 hover:bg-gray-200"
      }`}
      title={isCollapsed ? label : undefined}
    >
      <Icon className="h-5 w-5 flex-shrink-0" />
      {!isCollapsed && <span className="truncate">{label}</span>}
      
      {/* Tooltip for collapsed state */}
      {isCollapsed && (
        <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
          {label}
        </div>
      )}
    </Link>
  );
}

export function Sidebar() {
  const { isCollapsed } = useSidebar();
  
  return (
    <aside className="h-full border-r bg-gray-100 p-4 flex flex-col">
      <div className={`mb-6 text-2xl font-bold text-gray-800 transition-all duration-300 ${
        isCollapsed ? 'text-center' : ''
      }`}>
        {isCollapsed ? 'LT' : 'LinkTalent'}
      </div>
      <nav className="space-y-2 flex-1">
        <SidebarLink href="/candidates" label="Candidates" Icon={Users} />
        <SidebarLink href="/companies" label="Companies" Icon={Building2} />
        <SidebarLink href="/company-approval" label="Company Approval" Icon={CheckCircle2} />
        <SidebarLink href="/subscriptions" label="Subscriptions" Icon={CreditCard} />
        <SidebarLink href="/jobs" label="Jobs" Icon={Briefcase} />
      </nav>
    </aside>
  );
}
