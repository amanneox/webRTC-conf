"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Plus, Video, LogOut } from "lucide-react"
import { toast } from "sonner"

interface Room {
  id: string
  name: string
  host: {
    name: string
    email: string
  }
  _count: {
    participants: number
  }
}

export default function DashboardPage() {
  const router = useRouter()
  const [rooms, setRooms] = useState<Room[]>([])
  const [newRoomName, setNewRoomName] = useState("")
  const [user, setUser] = useState<any>(null)

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/login")
      return
    }
    setUser(JSON.parse(localStorage.getItem("user") || "{}"))
    fetchRooms()
    setLoading(false)
  }, [])

  const fetchRooms = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/rooms`)
      if (res.ok) {
        setRooms(await res.json())
      }
    } catch (error) {
      toast.error("Failed to fetch rooms")
    }
  }

  const createRoom = async () => {
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/rooms`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ name: newRoomName, hostId: user.id }),
      })

      if (res.ok) {
        const room = await res.json()
        router.push(`/room/${room.id}`)
      } else {
        toast.error("Failed to create room")
      }
    } catch (error) {
      toast.error("Error creating room")
    }
  }

  const logout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    router.push("/login")
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-background to-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-background to-background text-foreground p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-bold text-white tracking-tight mb-2">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {user?.name}</p>
          </div>
          <Button
            className="bg-transparent border border-destructive/50 text-destructive hover:bg-destructive/10 hover:border-destructive transition-all shadow-lg shadow-destructive/10"
            onClick={logout}
          >
            <LogOut className="mr-2 h-4 w-4" /> Logout
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="bg-card border-white/10 hover:border-primary/20 transition-all shadow-2xl shadow-black/50">
            <CardHeader>
              <CardTitle className="text-foreground">Create New Room</CardTitle>
              <CardDescription className="text-muted-foreground">Start a new meeting instantly</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <Input
                  placeholder="Room Name"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  className="bg-transparent border-white/20 focus-visible:ring-primary/20 text-white placeholder:text-muted-foreground/50 transition-all"
                />
                <Button
                  onClick={createRoom}
                  className="bg-transparent border border-primary/50 text-primary hover:bg-primary/10 hover:border-primary transition-all shadow-lg shadow-primary/10"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <h2 className="text-2xl font-bold mb-6 text-white tracking-tight">Active Rooms</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room) => (
            <Card
              key={room.id}
              className="group bg-card border-white/10 hover:border-primary/50 transition-all duration-300 cursor-pointer hover:shadow-[0_0_30px_rgba(36,158,148,0.15)] hover:-translate-y-1"
              onClick={() => router.push(`/room/${room.id}`)}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-medium text-foreground group-hover:text-primary transition-colors">
                  {room.name || "Untitled Room"}
                </CardTitle>
                <Video className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white mb-1">{room._count?.participants || 0} <span className="text-sm font-normal text-muted-foreground">online</span></div>
                <p className="text-xs text-muted-foreground">
                  Host: <span className="text-foreground/80">{room.host.name}</span>
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
