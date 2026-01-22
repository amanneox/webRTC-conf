import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Users, Mic, Video, Crown } from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"


interface Participant {
    userId: string;
    name?: string;
    isHost?: boolean;
    isAudioEnabled?: boolean;
    isVideoEnabled?: boolean;
}

interface ParticipantsListProps {
    participants: Participant[];
    isOpen: boolean;
    onClose: () => void;
}

export const ParticipantsList = ({ participants, isOpen, onClose }: ParticipantsListProps) => {
    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent className="w-[400px] bg-background/95 backdrop-blur-md border-l border-border">
                <SheetHeader className="mb-6">
                    <SheetTitle className="flex items-center gap-2 text-xl">
                        <Users className="h-5 w-5 text-primary" />
                        Participants
                        <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-md">
                            {participants.length}
                        </span>
                    </SheetTitle>
                </SheetHeader>

                <ScrollArea className="h-[calc(100vh-120px)] pr-4">
                    <div className="flex flex-col gap-3">
                        {participants.map((p) => (
                            <div key={p.userId} className="flex items-center justify-between p-3 rounded-lg bg-card border border-border/50 hover:border-primary/50 transition-all group">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-10 w-10 border-2 border-border group-hover:border-primary transition-colors">

                                        <AvatarFallback className="bg-primary/10 text-primary">
                                            {p.name?.substring(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-semibold flex items-center gap-2">
                                            {p.name || "Guest"}
                                            {p.isHost && <Crown className="h-3 w-3 text-yellow-500 fill-yellow-500" />}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            {p.isHost ? "Host" : "Participant"}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex gap-2 text-muted-foreground">
                                    <Mic className="h-4 w-4" />
                                    <Video className="h-4 w-4" />
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
};
