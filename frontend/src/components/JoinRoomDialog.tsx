import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface JoinRoomDialogProps {
    onJoin: (name: string) => void;
    defaultName?: string;
}

export const JoinRoomDialog = ({ onJoin, defaultName = "" }: JoinRoomDialogProps) => {
    const [name, setName] = useState(defaultName);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) onJoin(name.trim());
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <Card className="w-full max-w-[400px] bg-card border-white/10 shadow-2xl">
                <CardHeader>
                    <CardTitle className="text-center text-2xl font-bold">Join Meeting</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Display Name
                            </label>
                            <Input
                                autoFocus
                                placeholder="Enter your name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="bg-black/20 border-white/10"
                            />
                        </div>
                        <Button type="submit" disabled={!name.trim()} className="w-full">
                            Join Room
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};
