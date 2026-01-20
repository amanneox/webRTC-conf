"use client"

import { LogOut } from 'lucide-react'
import {
    Dialog, DialogClose, DialogContent, DialogDescription,
    DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

type Props = { onConfirm: () => void }

export function EndSessionDialog({ onConfirm }: Props) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <button className="flex items-center gap-2 px-4 py-2.5 bg-transparent hover:bg-destructive/10 text-destructive border border-destructive/50 hover:border-destructive rounded-lg text-sm font-semibold transition-all shadow-lg shadow-destructive/10">
                    <LogOut className="h-4 w-4" />
                    <span className="hidden sm:inline">End Session</span>
                </button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>End Session?</DialogTitle>
                    <DialogDescription>
                        This will disconnect everyone and delete the room.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button variant="destructive" onClick={onConfirm}>
                        End Session
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
