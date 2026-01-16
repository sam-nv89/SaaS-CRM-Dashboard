"use client"

import { useState } from "react"
import { Building2, Clock, Bell, Upload, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

const initialHours = daysOfWeek.map((day) => ({
  day,
  open: day === "Sunday" ? "" : "09:00",
  close: day === "Sunday" ? "" : "21:00",
  isOpen: day !== "Sunday",
}))

export function SettingsView() {
  const [businessHours, setBusinessHours] = useState(initialHours)
  const [notifications, setNotifications] = useState({
    bookingConfirmation: true,
    reminderBefore: true,
    cancelNotification: true,
    marketingEmails: false,
  })
  const [isSaving, setIsSaving] = useState(false)

  const toggleDayOpen = (dayIndex: number) => {
    setBusinessHours((prev) => prev.map((h, i) => (i === dayIndex ? { ...h, isOpen: !h.isOpen } : h)))
  }

  const handleSave = async () => {
    setIsSaving(true)
    await new Promise((resolve) => setTimeout(resolve, 800))
    setIsSaving(false)
    toast.success("Settings saved!", {
      description: "Your changes have been saved successfully.",
    })
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="w-full grid grid-cols-3 bg-secondary">
          <TabsTrigger value="general" className="text-xs data-[state=active]:bg-card data-[state=active]:shadow-sm">
            General
          </TabsTrigger>
          <TabsTrigger value="hours" className="text-xs data-[state=active]:bg-card data-[state=active]:shadow-sm">
            Hours
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="text-xs data-[state=active]:bg-card data-[state=active]:shadow-sm"
          >
            Alerts
          </TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general" className="mt-4 space-y-4">
          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                Business Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="salonName" className="text-sm">
                  Salon Name
                </Label>
                <Input id="salonName" defaultValue="BeautyFlow Studio" className="h-11" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address" className="text-sm">
                  Address
                </Label>
                <Input id="address" defaultValue="123 Beauty Street, New York, NY" className="h-11" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm">
                  Phone
                </Label>
                <Input id="phone" defaultValue="+1 234-567-8900" className="h-11" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Logo</Label>
                <Button
                  variant="outline"
                  className="w-full h-20 border-dashed bg-transparent hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-5 w-5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Upload Logo</span>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Button
            className="w-full bg-primary hover:bg-primary/90 h-11 shadow-md"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </TabsContent>

        {/* Business Hours Tab */}
        <TabsContent value="hours" className="mt-4 space-y-4">
          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                Business Hours
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {businessHours.map((schedule, idx) => (
                <div
                  key={schedule.day}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0 hover:bg-secondary/30 transition-colors -mx-2 px-2 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={schedule.isOpen}
                      onCheckedChange={() => toggleDayOpen(idx)}
                      className="data-[state=checked]:bg-confirmed"
                    />
                    <span
                      className={`text-sm ${schedule.isOpen ? "text-foreground font-medium" : "text-muted-foreground"}`}
                    >
                      {schedule.day.slice(0, 3)}
                    </span>
                  </div>
                  {schedule.isOpen ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="time"
                        value={schedule.open}
                        className="h-8 w-24 text-xs"
                        onChange={(e) =>
                          setBusinessHours((prev) =>
                            prev.map((h, i) => (i === idx ? { ...h, open: e.target.value } : h)),
                          )
                        }
                      />
                      <span className="text-muted-foreground text-xs">-</span>
                      <Input
                        type="time"
                        value={schedule.close}
                        className="h-8 w-24 text-xs"
                        onChange={(e) =>
                          setBusinessHours((prev) =>
                            prev.map((h, i) => (i === idx ? { ...h, close: e.target.value } : h)),
                          )
                        }
                      />
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">Closed</span>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          <Button
            className="w-full bg-primary hover:bg-primary/90 h-11 shadow-md"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="mt-4 space-y-4">
          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Bell className="h-4 w-4 text-primary" />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-2 hover:bg-secondary/30 transition-colors -mx-2 px-2 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-foreground">Booking Confirmations</p>
                  <p className="text-xs text-muted-foreground">Send confirmation when booked</p>
                </div>
                <Switch
                  checked={notifications.bookingConfirmation}
                  onCheckedChange={(checked) => setNotifications((prev) => ({ ...prev, bookingConfirmation: checked }))}
                  className="data-[state=checked]:bg-confirmed"
                />
              </div>
              <div className="flex items-center justify-between py-2 hover:bg-secondary/30 transition-colors -mx-2 px-2 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-foreground">Appointment Reminders</p>
                  <p className="text-xs text-muted-foreground">Send reminder 24h before</p>
                </div>
                <Switch
                  checked={notifications.reminderBefore}
                  onCheckedChange={(checked) => setNotifications((prev) => ({ ...prev, reminderBefore: checked }))}
                  className="data-[state=checked]:bg-confirmed"
                />
              </div>
              <div className="flex items-center justify-between py-2 hover:bg-secondary/30 transition-colors -mx-2 px-2 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-foreground">Cancellation Alerts</p>
                  <p className="text-xs text-muted-foreground">Notify when appointments cancel</p>
                </div>
                <Switch
                  checked={notifications.cancelNotification}
                  onCheckedChange={(checked) => setNotifications((prev) => ({ ...prev, cancelNotification: checked }))}
                  className="data-[state=checked]:bg-confirmed"
                />
              </div>
              <div className="flex items-center justify-between py-2 hover:bg-secondary/30 transition-colors -mx-2 px-2 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-foreground">Marketing Emails</p>
                  <p className="text-xs text-muted-foreground">Receive tips and promotions</p>
                </div>
                <Switch
                  checked={notifications.marketingEmails}
                  onCheckedChange={(checked) => setNotifications((prev) => ({ ...prev, marketingEmails: checked }))}
                  className="data-[state=checked]:bg-confirmed"
                />
              </div>
            </CardContent>
          </Card>

          <Button
            className="w-full bg-primary hover:bg-primary/90 h-11 shadow-md"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  )
}
