"use client"

import { useState } from "react"
import { AlertTriangle, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { cancelAccountDeletion } from "@/lib/db"

interface DeletionWarningBannerProps {
    deletionDate: Date
    onCancelled: () => void
}

export function DeletionWarningBanner({ deletionDate, onCancelled }: DeletionWarningBannerProps) {
    const [isCancelling, setIsCancelling] = useState(false)

    // Calculate days remaining
    const now = new Date()
    const diffTime = deletionDate.getTime() - now.getTime()
    const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    const handleCancel = async () => {
        setIsCancelling(true)
        try {
            await cancelAccountDeletion()
            toast.success("Account deletion cancelled. Welcome back!")
            onCancelled()
        } catch (error) {
            console.error(error)
            toast.error("Failed to cancel deletion")
        } finally {
            setIsCancelling(false)
        }
    }

    // Don't show if already past deletion date
    if (daysRemaining <= 0) return null

    return (
        <div className="bg-destructive/10 border-b border-destructive/30 px-4 py-3">
            <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0" />
                    <div className="text-sm">
                        <span className="font-semibold text-destructive">
                            Account Deletion Scheduled
                        </span>
                        <span className="text-muted-foreground ml-2">
                            Your account and all data will be permanently deleted in{" "}
                            <strong className="text-destructive">{daysRemaining} day{daysRemaining !== 1 ? 's' : ''}</strong>.
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCancel}
                        disabled={isCancelling}
                        className="border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                        {isCancelling ? "Cancelling..." : "Cancel Deletion"}
                    </Button>
                </div>
            </div>
        </div>
    )
}
