"use client"

import { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"


import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import type { Service } from "@/types/database"

interface EditServiceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  service: Service | null
  onServiceUpdated: (service: Service) => void | Promise<void>
}

export function EditServiceDialog({ open, onOpenChange, service, onServiceUpdated }: EditServiceDialogProps) {
  const [price, setPrice] = useState("")
  const [duration, setDuration] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (service) {
      setPrice(service.price.toString())
      setDuration(service.duration)
    }
  }, [service])

  const handleSave = async () => {
    if (!service) return

    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 600))

    const updatedService: Service = {
      ...service,
      price: Number.parseFloat(price) || service.price,
      duration: duration || service.duration,
    }

    onServiceUpdated(updatedService)
    setIsLoading(false)
    onOpenChange(false)

    toast.success("Service updated!", {
      description: `${service.name} has been updated.`,
    })
  }

  if (!service) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm mx-4 rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-lg">Edit {service.name}</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Make changes to service details.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="price" className="text-sm font-medium">
              Price ($)
            </Label>
            <Input id="price" type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="h-11" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration" className="text-sm font-medium">
              Duration
            </Label>
            <Input
              id="duration"
              placeholder="e.g., 45 min, 1h, 2h"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="h-11"
            />
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading} className="flex-1 bg-primary hover:bg-primary/90">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
