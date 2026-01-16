"use client"

import { Bell, Plus, Search, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import type { TabId } from "@/app/page"

interface MobileHeaderProps {
  activeTab: TabId
  onBookClick: () => void
  onSearch?: (query: string) => void
  searchValue?: string
}

const tabTitles: Record<TabId, string> = {
  dashboard: "Dashboard",
  calendar: "Calendar",
  clients: "Clients",
  services: "Services",
  settings: "Settings",
}

export function MobileHeader({ activeTab, onBookClick, onSearch, searchValue }: MobileHeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [currentDate] = useState(new Date())

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <header className="sticky top-0 z-40 glass border-b border-border/50">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shadow-md">
              <span className="text-primary-foreground font-bold text-sm">B</span>
            </div>
            <div>
              <span className="font-semibold text-foreground">{tabTitles[activeTab]}</span>
              {activeTab === "calendar" && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Button variant="ghost" size="icon" className="h-5 w-5 p-0 hover:bg-secondary">
                    <ChevronLeft className="h-3 w-3" />
                  </Button>
                  <span>{formatDate(currentDate)}</span>
                  <Button variant="ghost" size="icon" className="h-5 w-5 p-0 hover:bg-secondary">
                    <ChevronRight className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 hover:bg-secondary transition-colors"
              onClick={() => setSearchOpen(!searchOpen)}
            >
              <Search className="h-5 w-5 text-muted-foreground" />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9 relative hover:bg-secondary transition-colors">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary animate-pulse" />
            </Button>
            <Button
              size="sm"
              className="h-9 bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all"
              onClick={onBookClick}
            >
              <Plus className="h-4 w-4 mr-1" />
              Book
            </Button>
          </div>
        </div>
        {searchOpen && (
          <div className="mt-3">
            <Input
              placeholder="Search client or booking..."
              value={searchValue || ""}
              onChange={(e) => onSearch?.(e.target.value)}
              className="h-10 bg-card border border-border focus:ring-2 focus:ring-primary/20 transition-all"
              autoFocus
            />
          </div>
        )}
      </div>
    </header>
  )
}
