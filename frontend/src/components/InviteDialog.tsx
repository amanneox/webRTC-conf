"use client"

import { useState } from "react"
import { Copy, Mail, UserPlus } from 'lucide-react'
import { toast } from "sonner"
import {
    Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Props = { roomId: string }

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export function InviteDialog({ roomId }: Props) {
    const [email, setEmail] = useState("")
    const [open, setOpen] = useState(false)

    const copyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        toast.success("Link copied!");
    };

    const sendInvite = async () => {
        if (!email) return;
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API}/rooms/${roomId}/invite`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ email }),
            });
            if (res.ok) {
                toast.success("Invite sent!");
                setEmail("");
                setOpen(false);
            } else {
                const data = await res.json().catch(() => ({}));
                toast.error(data.message || "Failed to send invite");
            }
        } catch {
            toast.error("Something went wrong");
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <button className="flex items-center gap-2 px-4 py-2.5 bg-transparent hover:bg-primary/10 text-primary border border-primary/50 hover:border-primary rounded-lg text-sm font-semibold transition-all shadow-lg shadow-primary/10">
                    <UserPlus className="h-4 w-4" />
                    <span className="hidden sm:inline">Invite</span>
                </button>
            </DialogTrigger>
            <DialogContent className="bg-card border-white/10 text-foreground sm:max-w-sm">
                <DialogHeader className="pb-2">
                    <DialogTitle className="text-lg">Invite</DialogTitle>
                    <DialogDescription className="text-muted-foreground text-xs">
                        Share link or send email invite.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-4 py-2">
                    <div className="space-y-2">
                        <Label className="text-muted-foreground text-[10px] uppercase tracking-wider font-semibold">Link</Label>
                        <div className="flex items-center gap-2 w-full">
                            <div className="flex-1 min-w-0 w-[280px] bg-muted/20 px-2 rounded-md border border-white/5 shadow-inner h-8 flex items-center">
                                <span className="truncate text-xs font-mono text-muted-foreground select-all w-full">
                                    {typeof window !== 'undefined' ? window.location.href : '...'}
                                </span>
                            </div>
                            <Button size="icon" variant="outline" onClick={copyLink} className="shrink-0 h-8 w-8 border-white/10 hover:bg-white/5 text-foreground hover:text-primary">
                                <Copy className="h-3 w-3" />
                            </Button>
                        </div>
                    </div>

                    <div className="relative py-1">
                        <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/10" /></div>
                        <div className="relative flex justify-center text-[10px] uppercase">
                            <span className="bg-card px-2 text-muted-foreground">or</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-muted-foreground text-[10px] uppercase tracking-wider font-semibold">Email</Label>
                        <div className="flex flex-col gap-2">
                            <Input
                                type="email"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="bg-muted/20 border-white/10 text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-primary/50 h-8 text-sm"
                                onKeyDown={(e) => e.key === 'Enter' && sendInvite()}
                            />
                            <Button onClick={sendInvite} disabled={!email} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-8 text-xs font-semibold shadow-lg shadow-primary/20">
                                <Mail className="mr-2 h-3 w-3" /> Send
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
