"use client"

import { LayoutDashboard, Calendar, Users, Scissors, Settings } from "lucide-react"
import type { TabId } from "@/app/page"

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", id: "dashboard" as TabId },
  { icon: Calendar, label: "Calendar", id: "calendar" as TabId },
  { icon: Users, label: "Clients", id: "clients" as TabId },
  { icon: Scissors, label: "Services", id: "services" as TabId },
  { icon: Settings, label: "Settings", id: "settings" as TabId },
]

interface BottomNavProps {
  activeTab: TabId
  onTabChange: (tab: TabId) => void
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 glass border-t border-border/50 z-50 shadow-[0_-4px_20px_-1px_rgba(0,0,0,0.08)]">
      <div className="flex items-center justify-around py-2 px-2">
        {navItems.map((item) => {
          const isActive = activeTab === item.id
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center gap-1 py-2 px-3 rounded-xl transition-all duration-200 ${
                isActive
                  ? "text-primary bg-primary/10 scale-105"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              <item.icon className={`h-5 w-5 transition-all ${isActive ? "stroke-[2.5]" : ""}`} />
              <span className={`text-[10px] font-medium ${isActive ? "font-semibold" : ""}`}>{item.label}</span>
            </button>
          )
        })}
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  )
}
