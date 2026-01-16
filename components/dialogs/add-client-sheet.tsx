"use client"

import { useState } from "react"
import { Loader2, User } from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

interface Client {
  id: string
  name: string
  phone: string
  email: string
  notes?: string
}

interface AddClientSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onClientAdded: (client: { name: string; phone: string; email: string; notes?: string }) => void
}

export function AddClientSheet({ open, onOpenChange, onClientAdded }: AddClientSheetProps) {
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [notes, setNotes] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const resetForm = () => {
    setName("")
    setPhone("")
    setEmail("")
    setNotes("")
  }

  const handleClose = (open: boolean) => {
    if (!open) resetForm()
    onOpenChange(open)
  }

  const handleSave = async () => {
    if (!name || !phone) return

    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 800))

    const newClient: Client = {
      id: Date.now().toString(),
      name,
      phone,
      email,
      notes,
    }

    onClientAdded(newClient)
    setIsLoading(false)
    handleClose(false)

    toast.success("Client added!", {
      description: `${name} has been added to your client list.`,
    })
  }

  const isValid = name.trim() && phone.trim()

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="p-4 border-b border-border">
          <SheetTitle className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-4 w-4 text-primary" />
            </div>
            Add New Client
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              Full Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              placeholder="Enter client name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm font-medium">
              Phone Number <span className="text-destructive">*</span>
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+1 234-567-8900"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="client@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium">
              Notes
            </Label>
            <Textarea
              id="notes"
              placeholder="Any special preferences or notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-24 resize-none"
            />
          </div>
        </div>

        {/* Sticky Save Button */}
        <div className="p-4 border-t border-border bg-card">
          <Button
            onClick={handleSave}
            disabled={!isValid || isLoading}
            className="w-full h-11 bg-primary hover:bg-primary/90"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Client"
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
