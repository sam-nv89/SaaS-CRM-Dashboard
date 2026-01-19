"use client"

import { useState } from "react"
import { AlertTriangle, Trash2, X } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface DeleteAccountDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onConfirm: () => void
    isLoading?: boolean
}

export function DeleteAccountDialog({
    open,
    onOpenChange,
    onConfirm,
    isLoading = false
}: DeleteAccountDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] border-destructive/30">
                <DialogHeader className="space-y-3">
                    <div className="mx-auto bg-destructive/10 p-3 rounded-full w-fit">
                        <AlertTriangle className="h-6 w-6 text-destructive" />
                    </div>
                    <DialogTitle className="text-center text-xl">
                        Schedule Account Deletion?
                    </DialogTitle>
                    <DialogDescription className="text-center">
                        Your account will be permanently deleted in <strong className="text-foreground">30 days</strong>.
                    </DialogDescription>
                </DialogHeader>

                <div className="bg-muted/50 rounded-lg p-4 my-4 space-y-3">
                    <p className="text-sm font-medium text-foreground">During this time:</p>
                    <ul className="text-sm text-muted-foreground space-y-2">
                        <li className="flex items-start gap-2">
                            <span className="text-primary">•</span>
                            You can continue using the service normally
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-primary">•</span>
                            A warning banner will remind you of the pending deletion
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-primary">•</span>
                            You can cancel deletion anytime before the 30 days expire
                        </li>
                    </ul>
                </div>

                <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-3 text-center">
                    <p className="text-sm text-destructive font-medium">
                        After 30 days, ALL data will be permanently removed.
                    </p>
                </div>

                <DialogFooter className="flex gap-2 sm:gap-2 mt-4">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isLoading}
                        className="flex-1"
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="flex-1"
                    >
                        {isLoading ? (
                            <>
                                <span className="animate-spin mr-2">⏳</span>
                                Scheduling...
                            </>
                        ) : (
                            <>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Schedule Deletion
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
