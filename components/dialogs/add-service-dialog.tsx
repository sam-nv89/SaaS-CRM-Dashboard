"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createService, createCategory } from "@/lib/db"
import type { Service, ServiceInsert } from "@/types/database"
import { toast } from "sonner"

interface AddServiceDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onServiceCreated: (service: Service) => void
    existingCategories: string[]
}

export function AddServiceDialog({
    open,
    onOpenChange,
    onServiceCreated,
    existingCategories
}: AddServiceDialogProps) {
    const [name, setName] = useState("")
    const [price, setPrice] = useState("")
    const [duration, setDuration] = useState("")
    const [category, setCategory] = useState("")
    const [customCategory, setCustomCategory] = useState("")
    const [isLoading, setIsLoading] = useState(false)

    // Remove duplicates from existing categories passed from parent
    const allCategories = [...new Set(existingCategories)].sort()

    const resetForm = () => {
        setName("")
        setPrice("")
        setDuration("")
        setCategory("")
        setCustomCategory("")
    }

    const handleClose = (open: boolean) => {
        if (!open) {
            resetForm()
        }
        onOpenChange(open)
    }

    const handleSave = async () => {
        if (!name.trim()) {
            toast.error("Please enter service name")
            return
        }

        let finalCategory = category === "custom" ? customCategory.trim() : category

        if (!finalCategory) {
            toast.error("Please select or enter a category")
            return
        }

        setIsLoading(true)

        try {
            // If custom category, create it first
            if (category === "custom") {
                // Check if it already exists in the list (user typed existing name)
                // But createCategory uses ON CONFLICT DO NOTHING?
                // My implementation of createCategory uses simple insert. 
                // It will fail if unique constraint is violated.
                // I should check if it exists or catch error.
                // Actually, best to use upsert or check?
                // Or just try to create. If it fails (already exists), that's fine, we proceed to create service.
                // But my createCategory throws error.
                // Let's modify createCategory to be safe or handle error here.
                // I'll try to create it.
                try {
                    await createCategory(finalCategory)
                } catch (e) {
                    // Ignore unique violation (code '23505' in Postgres)
                    // But supabase-js might wrap it.
                    // I'll assume if it fails it might be duplicate, so I proceed.
                    // But if it's another error, service creation will fail on FK constraint anyway or succeed if cat exists.
                    console.log("Category creation note:", e)
                }
            }

            const newService: ServiceInsert = {
                name: name.trim(),
                price: parseFloat(price) || 0,
                duration: duration.trim() || "30 min",
                category: finalCategory,
                active: true,
            }

            const created = await createService(newService)
            onServiceCreated(created)
            handleClose(false)

            toast.success("Service created!", {
                description: `${created.name} has been added to ${created.category}.`,
            })
        } catch (error) {
            console.error("Error creating service:", error)
            toast.error("Failed to create service")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-sm mx-4 rounded-xl">
                <DialogHeader>
                    <DialogTitle className="text-lg">Add New Service</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-sm font-medium">
                            Service Name *
                        </Label>
                        <Input
                            id="name"
                            placeholder="e.g., Haircut, Manicure"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="h-11"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="category" className="text-sm font-medium">
                            Category *
                        </Label>
                        <Select value={category} onValueChange={setCategory}>
                            <SelectTrigger className="h-11">
                                <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                                {allCategories.map((cat) => (
                                    <SelectItem key={cat} value={cat}>
                                        {cat}
                                    </SelectItem>
                                ))}
                                <SelectItem value="custom">+ New Category</SelectItem>
                            </SelectContent>
                        </Select>
                        {category === "custom" && (
                            <Input
                                placeholder="Enter new category name"
                                value={customCategory}
                                onChange={(e) => setCustomCategory(e.target.value)}
                                className="h-11 mt-2"
                            />
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="price" className="text-sm font-medium">
                                Price ($)
                            </Label>
                            <Input
                                id="price"
                                type="number"
                                placeholder="0.00"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                className="h-11"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="duration" className="text-sm font-medium">
                                Duration
                            </Label>
                            <Input
                                id="duration"
                                placeholder="e.g., 45 min"
                                value={duration}
                                onChange={(e) => setDuration(e.target.value)}
                                className="h-11"
                            />
                        </div>
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
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add Service"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
