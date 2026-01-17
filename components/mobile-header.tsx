"use client"

import { Bell, Plus, Search, ChevronLeft, ChevronRight, Calendar, Clock, AlertCircle, LogOut, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useState, useEffect } from "react"
import type { TabId } from "@/app/page"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import type { User as SupabaseUser } from "@supabase/supabase-js"

interface MobileHeaderProps {
  activeTab: TabId
  onBookClick: () => void
  onSearch?: (query: string) => void
  searchValue?: string
  currentDate?: Date
  onPrevDay?: () => void
  onNextDay?: () => void
  onToday?: () => void
}

const tabTitles: Record<TabId, string> = {
  dashboard: "Dashboard",
  calendar: "Calendar",
  clients: "Clients",
  services: "Services",
  settings: "Settings",
}

export function MobileHeader({
  activeTab,
  onBookClick,
  onSearch,
  searchValue,
  currentDate = new Date(),
  onPrevDay,
  onNextDay,
}: MobileHeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()
  }, [])

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    })
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.refresh()
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
                  <Button variant="ghost" size="icon" className="h-5 w-5 p-0 hover:bg-secondary" onClick={onPrevDay}>
                    <ChevronLeft className="h-3 w-3" />
                  </Button>
                  <span>{formatDate(currentDate)}</span>
                  <Button variant="ghost" size="icon" className="h-5 w-5 p-0 hover:bg-secondary" onClick={onNextDay}>
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
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 relative hover:bg-secondary transition-colors">
                  <Bell className="h-5 w-5 text-muted-foreground" />
                  <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary animate-pulse" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                  <h4 className="font-semibold text-sm">Notifications</h4>
                  <span className="text-xs text-muted-foreground">3 new</span>
                </div>
                <ScrollArea className="h-[280px]">
                  <div className="space-y-1 p-2">
                    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Calendar className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium">New appointment</p>
                        <p className="text-xs text-muted-foreground">Emma booked a haircut for tomorrow at 10:00 AM</p>
                        <p className="text-xs text-muted-foreground">2 min ago</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer">
                      <div className="h-8 w-8 rounded-full bg-pending/10 flex items-center justify-center flex-shrink-0">
                        <Clock className="h-4 w-4 text-pending" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium">Reminder</p>
                        <p className="text-xs text-muted-foreground">You have 3 appointments scheduled for today</p>
                        <p className="text-xs text-muted-foreground">1 hour ago</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer">
                      <div className="h-8 w-8 rounded-full bg-canceled/10 flex items-center justify-center flex-shrink-0">
                        <AlertCircle className="h-4 w-4 text-canceled" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium">Cancellation</p>
                        <p className="text-xs text-muted-foreground">Sarah cancelled her appointment for Friday</p>
                        <p className="text-xs text-muted-foreground">3 hours ago</p>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
                <div className="border-t border-border p-2">
                  <Button variant="ghost" size="sm" className="w-full text-primary hover:text-primary">
                    View all notifications
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            {/* User Menu */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-secondary transition-colors">
                  <User className="h-5 w-5 text-muted-foreground" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-0" align="end">
                <div className="px-4 py-3 border-b border-border">
                  <p className="text-sm font-medium">Account</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email || 'Loading...'}</p>
                </div>
                <div className="p-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Log out
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

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
