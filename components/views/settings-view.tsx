"use client"

import { useState, useEffect, useRef } from "react"
import { Building2, Clock, Bell, Upload, Loader2, X, Image as ImageIcon, Database, User, Users, Plus, Check, Trash2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { getSettings, updateSettings, getStylists, createStylist, deleteStylist } from "@/lib/db"
import { supabase } from "@/lib/supabase"
import { DeleteAccountDialog } from "@/components/dialogs/delete-account-dialog"
import type { BusinessHour, NotificationSettings, Stylist } from "@/types/database"

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

export const defaultHours: BusinessHour[] = daysOfWeek.map((day) => ({
  day,
  open: "09:00",
  close: "21:00",
  is_open: true,
}))

const defaultNotifications: NotificationSettings = {
  booking_confirmation: true,
  reminder_before: true,
  cancel_notification: true,
  marketing_emails: false,
}

export function SettingsView() {
  const [salonName, setSalonName] = useState("BeautyFlow Studio")
  const [address, setAddress] = useState("123 Beauty Street, New York, NY")
  const [phone, setPhone] = useState("+1 234-567-8900")
  const [businessHours, setBusinessHours] = useState<BusinessHour[]>(defaultHours)
  const [notifications, setNotifications] = useState<NotificationSettings>(defaultNotifications)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSeeding, setIsSeeding] = useState(false)

  // Stylist state
  const [stylists, setStylists] = useState<Stylist[]>([])
  const [isAddingStylist, setIsAddingStylist] = useState(false)
  const [newStylistName, setNewStylistName] = useState("")

  // Profile state
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [company, setCompany] = useState("")
  const [userEmail, setUserEmail] = useState("")
  const [isSavingProfile, setIsSavingProfile] = useState(false)

  // Account Deletion state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)

  // Load settings and profile from Supabase on mount
  useEffect(() => {
    loadSettings()
    loadProfile()
    loadStylists()
  }, [])

  const loadStylists = async () => {
    try {
      const data = await getStylists()
      setStylists(data)
    } catch (error) {
      console.error("Error loading stylists:", error)
    }
  }

  const handleCreateStylist = async () => {
    if (!newStylistName.trim()) return
    try {
      // Pick a random color from charts
      const colors = ['bg-chart-1', 'bg-chart-2', 'bg-chart-3', 'bg-chart-4', 'bg-chart-5']
      const color = colors[Math.floor(Math.random() * colors.length)]

      await createStylist({
        name: newStylistName.trim(),
        color
      })
      setNewStylistName("")
      setIsAddingStylist(false)
      loadStylists()
      toast.success("Stylist added")
    } catch (error) {
      console.error(error)
      toast.error("Failed to add stylist")
    }
  }

  const handleDeleteStylist = async (id: string) => {
    try {
      await deleteStylist(id)
      loadStylists()
      toast.success("Stylist removed")
    } catch (error) {
      console.error(error)
      toast.error("Failed to remove stylist")
    }
  }

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setFirstName(user.user_metadata?.first_name || '')
      setLastName(user.user_metadata?.last_name || '')
      setCompany(user.user_metadata?.company || '')
      setUserEmail(user.email || '')
    }
  }

  const handleSaveProfile = async () => {
    setIsSavingProfile(true)
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          first_name: firstName,
          last_name: lastName,
          company: company,
          full_name: `${firstName} ${lastName}`,
        }
      })

      if (error) throw error

      // Also update profiles table
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('profiles').upsert({
          id: user.id,
          first_name: firstName,
          last_name: lastName,
          company: company,
          email: userEmail,
        })
      }

      toast.success("Profile updated!", {
        description: "Your profile has been saved.",
      })
    } catch (error) {
      console.error('Error saving profile:', error)
      toast.error("Failed to save profile")
    } finally {
      setIsSavingProfile(false)
    }
  }

  const loadSettings = async () => {
    try {
      setIsLoading(true)
      const settings = await getSettings()
      if (settings) {
        setSalonName(settings.salon_name || "BeautyFlow Studio")
        setAddress(settings.address || "")
        setPhone(settings.phone || "")
        if (settings.business_hours && Array.isArray(settings.business_hours)) {
          setBusinessHours(settings.business_hours as BusinessHour[])
        }
        if (settings.notifications) {
          setNotifications(settings.notifications as NotificationSettings)
        }
        if (settings.logo_url) {
          setLogoPreview(settings.logo_url)
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleDayOpen = (dayIndex: number) => {
    setBusinessHours((prev) => prev.map((h, i) => (i === dayIndex ? { ...h, is_open: !h.is_open } : h)))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      let logoUrl = logoPreview

      // Upload logo if new file selected
      if (logoFile) {
        const fileExt = logoFile.name.split('.').pop()
        const fileName = `salon-logo-${Date.now()}.${fileExt}`
        const { error: uploadError } = await supabase.storage
          .from('logos')
          .upload(fileName, logoFile)

        if (uploadError) throw uploadError

        const { data } = supabase.storage
          .from('logos')
          .getPublicUrl(fileName)

        logoUrl = data.publicUrl
      }

      await updateSettings({
        salon_name: salonName,
        address,
        phone,
        business_hours: businessHours,
        notifications,
        logo_url: logoUrl || undefined,
      })

      setLogoFile(null)
      toast.success("Settings saved!", {
        description: "Your changes have been saved successfully.",
      })
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error("Failed to save settings")
    } finally {
      setIsSaving(false)
    }
  }

  const handleSeedData = async () => {
    setIsSeeding(true)
    try {
      const res = await fetch('/api/seed-db')
      const data = await res.json()
      if (res.ok) {
        toast.success("Success", {
          description: `Generated ${data.count} test appointments`
        })
      } else {
        toast.error("Error generating data", {
          description: data.error
        })
      }
    } catch (e) {
      toast.error("Network error calling seed API")
    } finally {
      setIsSeeding(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="w-full grid grid-cols-5 bg-secondary">
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
          <TabsTrigger
            value="stylists"
            className="text-xs data-[state=active]:bg-card data-[state=active]:shadow-sm"
          >
            Staff
          </TabsTrigger>
          <TabsTrigger
            value="system"
            className="text-xs data-[state=active]:bg-card data-[state=active]:shadow-sm"
          >
            System
          </TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general" className="mt-4 space-y-4">
          {/* Profile Card */}
          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                Your Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-sm">First Name</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-sm">Last Name</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="h-11"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="company" className="text-sm">Company</Label>
                <Input
                  id="company"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="h-11"
                  placeholder="Optional"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Email</Label>
                <Input
                  value={userEmail}
                  disabled
                  className="h-11 bg-muted"
                />
              </div>
              <Button
                onClick={handleSaveProfile}
                disabled={isSavingProfile}
                className="w-full"
              >
                {isSavingProfile ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Profile"
                )}
              </Button>
            </CardContent>
          </Card>

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
                <Input
                  id="salonName"
                  value={salonName}
                  onChange={(e) => setSalonName(e.target.value)}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address" className="text-sm">
                  Address
                </Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm">
                  Phone
                </Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Logo</Label>
                <div className="relative">
                  <Input
                    type="file"
                    className="hidden"
                    ref={logoInputRef}
                    id="logo-upload"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        // Check file size (max 5MB)
                        if (file.size > 5 * 1024 * 1024) {
                          toast.error("File too large", {
                            description: "Please select an image under 5MB"
                          })
                          return
                        }

                        setLogoFile(file)

                        // Create preview
                        const reader = new FileReader()
                        reader.onloadend = () => {
                          setLogoPreview(reader.result as string)
                          toast.success("Logo uploaded", {
                            description: "Preview updated. Click Save to apply."
                          })
                        }
                        reader.readAsDataURL(file)
                      }
                    }}
                  />
                  {logoPreview ? (
                    <div className="relative group">
                      <div className="w-full h-24 rounded-lg border border-border overflow-hidden bg-secondary/30">
                        <img
                          src={logoPreview}
                          alt="Logo preview"
                          className="w-full h-full object-contain p-2"
                        />
                      </div>
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => {
                          setLogoPreview(null)
                          if (logoInputRef.current) {
                            logoInputRef.current.value = ''
                          }
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      className="w-full h-20 border-dashed bg-transparent hover:bg-secondary/50 transition-colors"
                      onClick={() => logoInputRef.current?.click()}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="h-5 w-5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Upload Logo (max 5MB)</span>
                      </div>
                    </Button>
                  )}
                </div>
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

        {/* Stylists Tab */}
        <TabsContent value="stylists" className="mt-4 space-y-4">
          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Staff (Stylists)
              </CardTitle>
              {!isAddingStylist && (
                <Button size="sm" onClick={() => setIsAddingStylist(true)}>
                  <Plus className="h-3 w-3 mr-1" /> Add
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {isAddingStylist && (
                <div className="flex flex-col gap-3 p-3 bg-secondary/20 rounded-lg border border-border">
                  <Label className="text-sm">New Stylist Name</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newStylistName}
                      onChange={(e) => setNewStylistName(e.target.value)}
                      placeholder="e.g. Alice"
                      className="h-9"
                      autoFocus
                    />
                    <Button size="sm" onClick={handleCreateStylist} disabled={!newStylistName.trim()}>
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => {
                      setIsAddingStylist(false)
                      setNewStylistName("")
                    }}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {stylists.map(stylist => (
                  <div key={stylist.id} className="flex items-center justify-between p-2 hover:bg-secondary/30 rounded-lg transition-colors border border-transparent hover:border-border">
                    <div className="flex items-center gap-3">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${stylist.color}`}>
                        {stylist.name[0]}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{stylist.name}</span>
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDeleteStylist(stylist.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {stylists.length === 0 && !isAddingStylist && (
                  <p className="text-center text-muted-foreground text-sm py-4">No staff members yet</p>
                )}
              </div>
            </CardContent>
          </Card>
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
                      checked={schedule.is_open}
                      onCheckedChange={() => toggleDayOpen(idx)}
                      className="data-[state=checked]:bg-confirmed"
                    />
                    <span
                      className={`text-sm ${schedule.is_open ? "text-foreground font-medium" : "text-muted-foreground"}`}
                    >
                      {schedule.day.slice(0, 3)}
                    </span>
                  </div>
                  {schedule.is_open ? (
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
                  checked={notifications.booking_confirmation}
                  onCheckedChange={(checked: boolean) => setNotifications((prev) => ({ ...prev, booking_confirmation: checked }))}
                  className="data-[state=checked]:bg-confirmed"
                />
              </div>
              <div className="flex items-center justify-between py-2 hover:bg-secondary/30 transition-colors -mx-2 px-2 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-foreground">Appointment Reminders</p>
                  <p className="text-xs text-muted-foreground">Send reminder 24h before</p>
                </div>
                <Switch
                  checked={notifications.reminder_before}
                  onCheckedChange={(checked: boolean) => setNotifications((prev) => ({ ...prev, reminder_before: checked }))}
                  className="data-[state=checked]:bg-confirmed"
                />
              </div>
              <div className="flex items-center justify-between py-2 hover:bg-secondary/30 transition-colors -mx-2 px-2 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-foreground">Cancellation Alerts</p>
                  <p className="text-xs text-muted-foreground">Notify when appointments cancel</p>
                </div>
                <Switch
                  checked={notifications.cancel_notification}
                  onCheckedChange={(checked: boolean) => setNotifications((prev) => ({ ...prev, cancel_notification: checked }))}
                  className="data-[state=checked]:bg-confirmed"
                />
              </div>
              <div className="flex items-center justify-between py-2 hover:bg-secondary/30 transition-colors -mx-2 px-2 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-foreground">Marketing Emails</p>
                  <p className="text-xs text-muted-foreground">Receive tips and promotions</p>
                </div>
                <Switch
                  checked={notifications.marketing_emails}
                  onCheckedChange={(checked: boolean) => setNotifications((prev) => ({ ...prev, marketing_emails: checked }))}
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

        {/* System Tab */}
        <TabsContent value="system" className="mt-4 space-y-4">
          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Database className="h-4 w-4 text-primary" />
                Database Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-secondary/30 p-4 rounded-lg border border-border">
                <div className="flex flex-col gap-2">
                  <div>
                    <p className="text-sm text-foreground font-semibold">Test Appointment Data</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Generates 50 random confirmed/cancelled appointments for the current week.
                      Uses existing Services and Clients.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleSeedData}
                    disabled={isSeeding}
                    className="w-full justify-center mt-2 bg-background hover:bg-secondary border-primary/20 hover:border-primary/50 text-foreground transition-all"
                  >
                    {isSeeding ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Database className="h-4 w-4 mr-2 text-primary" />}
                    Generate 50 Test Records
                  </Button>

                  <div className="mt-4 pt-4 border-t border-border/50">
                    <p className="text-sm text-foreground font-semibold">Maintenance</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Run this if you experience issues with "Ghost Stylists" or booking conflicts.
                      It updates missing data fields.
                    </p>
                    <Button
                      variant="ghost"
                      onClick={async () => {
                        const { repairDatabase } = await import("@/lib/db")
                        toast.promise(repairDatabase(), {
                          loading: "Repairing database...",
                          success: (data) => `Fixed ${data.fixed} records!`,
                          error: "Repair failed"
                        })
                      }}
                      className="w-full justify-center mt-2 text-primary hover:bg-primary/10 border border-transparent hover:border-primary/20 transition-all"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Fix Database Integrity
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Deletion */}
          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Trash2 className="h-4 w-4" />
                Account Deletion
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">Delete Account</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Schedule your account for permanent deletion. You will have <strong>30 days</strong> to cancel
                    before all data is permanently removed. During this period, you can continue using the service.
                  </p>
                </div>
                <Button
                  variant="destructive"
                  onClick={() => setDeleteDialogOpen(true)}
                  className="w-full"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Schedule Account Deletion (30 days)
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Delete Account Confirmation Dialog */}
          <DeleteAccountDialog
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            isLoading={isDeletingAccount}
            onConfirm={async () => {
              try {
                setIsDeletingAccount(true)
                toast.loading("Scheduling deletion...", { id: "delete-account" })

                const { scheduleAccountDeletion } = await import("@/lib/db")
                const deletionDate = await scheduleAccountDeletion()

                toast.success(
                  `Account scheduled for deletion on ${deletionDate.toLocaleDateString()}. You can cancel anytime.`,
                  { id: "delete-account", duration: 5000 }
                )

                setDeleteDialogOpen(false)
                // Reload page to show deletion banner
                window.location.reload()
              } catch (error) {
                console.error("Schedule deletion error:", error)
                toast.error("Failed to schedule deletion. Please try again.", { id: "delete-account" })
              } finally {
                setIsDeletingAccount(false)
              }
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
