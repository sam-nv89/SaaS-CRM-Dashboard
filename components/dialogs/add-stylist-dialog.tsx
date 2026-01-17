"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"


import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createStylist } from "@/lib/db"
import type { Stylist } from "@/types/database"
import { toast } from "sonner"

interface AddStylistDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onStylistCreated: (stylist: Stylist) => void
}

export function AddStylistDialog({
    open,
    onOpenChange,
    onStylistCreated
}: AddStylistDialogProps) {
    const [name, setName] = useState("")
    const [isLoading, setIsLoading] = useState(false)

    const resetForm = () => {
        setName("")
    }

    const handleClose = (open: boolean) => {
        if (!open) {
            resetForm()
        }
        onOpenChange(open)
    }

    const handleSave = async () => {
        if (!name.trim()) {
            toast.error("Please enter stylist name")
            return
        }

        setIsLoading(true)

        try {
            // Pick a random color from charts
            const colors = ['bg-chart-1', 'bg-chart-2', 'bg-chart-3', 'bg-chart-4', 'bg-chart-5']
            const color = colors[Math.floor(Math.random() * colors.length)]

            const newStylist = await createStylist({
                name: name.trim(),
                color
            })

            onStylistCreated(newStylist)
            handleClose(false)

            toast.success("Stylist created!", {
                description: `${newStylist.name} has been added to staff.`,
            })
        } catch (error) {
            console.error("Error creating stylist:", error)
            toast.error("Failed to create stylist")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-sm mx-4 rounded-xl">
                <DialogHeader>
                    <DialogTitle className="text-lg">Add New Stylist</DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground">
                        Add a new specialist to your team.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-sm font-medium">
                            Stylist Name *
                        </Label>
                        <Input
                            id="name"
                            placeholder="e.g., Alice"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="h-11"
                            autoFocus
                        />
                    </div>
                </div>

                <div className="flex gap-2 pt-2">
                    <Button variant="ghost" onClick={() => handleClose(false)} className="flex-1">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={isLoading || !name.trim()}
                        className="flex-1 bg-primary hover:bg-primary/90"
                    >
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add Stylist"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
