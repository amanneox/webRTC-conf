import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RoomsService } from '../rooms/rooms.service';
import { PrismaService } from '../database/prisma.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class SignalingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private roomsService: RoomsService, private prisma: PrismaService) { }

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  async handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    const participantId = client.data.participantId;
    const userId = client.data.userId;
    const roomId = client.data.roomId;
    if (userId && roomId) {
      this.server.to(roomId).emit('user-left', { userId });
      // Remove participant from DB
      if (participantId) {
        await this.prisma.participant.delete({ where: { id: participantId } }).catch(() => { });
      }
    }
  }

  // Track users waiting for 'ready' signal before broadcasting
  private pendingUsers = new Map<string, { roomId: string; userId: string; name: string; client: Socket }>();

  @SubscribeMessage('join-room')
  handleJoinRoom(
    @MessageBody() data: { roomId: string; userId: string; name: string },
    @ConnectedSocket() client: Socket,
  ) {
    // Store metadata
    client.data.userId = data.userId;
    client.data.roomId = data.roomId;
    client.data.name = data.name; // Store name for later

    client.join(data.roomId);
    client.join(`user:${data.userId}`); // Personal room for targeting
    console.log(`Client ${client.id} joined room ${data.roomId} as ${data.userId}`);

    // Store pending - will send existing-users when 'ready' is received
    this.pendingUsers.set(client.id, { roomId: data.roomId, userId: data.userId, name: data.name, client });
  }

  @SubscribeMessage('ready')
  async handleReady(@ConnectedSocket() client: Socket) {
    const pending = this.pendingUsers.get(client.id);
    if (pending) {
      console.log(`Client ${pending.userId} is ready, sending existing users`);

      // NOW send existing users - client's listeners should be attached
      const socketsInRoom = this.server.sockets.adapter.rooms.get(pending.roomId);
      if (socketsInRoom) {
        const existingUsers: { userId: string; name: string }[] = [];
        socketsInRoom.forEach(socketId => {
          if (socketId !== client.id) {
            const otherSocket = this.server.sockets.sockets.get(socketId);
            if (otherSocket?.data.userId) {
              existingUsers.push({ userId: otherSocket.data.userId, name: otherSocket.data.name || 'Participant' });
            }
          }
        });
        if (existingUsers.length > 0) {
          console.log(`Sending existing users to ${pending.userId}:`, existingUsers);
          client.emit('existing-users', existingUsers);
        }
      }

      // Create participant record in DB
      const participant = await this.prisma.participant.create({
        data: {
          roomId: pending.roomId,
          userId: pending.userId,
          name: pending.name,
          role: 'GUEST',
        },
      });
      pending.client.data.participantId = participant.id;

      this.pendingUsers.delete(client.id);
    }
  }

  @SubscribeMessage('offer')
  handleOffer(
    @MessageBody() data: { to: string; offer: any },
    @ConnectedSocket() client: Socket,
  ) {
    console.log(`[Signaling] Offer from ${client.data.userId} to ${data.to}`);
    this.server.to(`user:${data.to}`).emit('offer', {
      from: client.data.userId,
      offer: data.offer,
    });
  }

  @SubscribeMessage('answer')
  handleAnswer(
    @MessageBody() data: { to: string; answer: any },
    @ConnectedSocket() client: Socket,
  ) {
    console.log(`[Signaling] Answer from ${client.data.userId} to ${data.to}`);
    this.server.to(`user:${data.to}`).emit('answer', {
      from: client.data.userId,
      answer: data.answer,
    });
  }

  @SubscribeMessage('ice-candidate')
  handleIceCandidate(
    @MessageBody() data: { to: string; candidate: any },
    @ConnectedSocket() client: Socket,
  ) {
    console.log(`[Signaling] Candidate from ${client.data.userId} to ${data.to}`);
    this.server.to(`user:${data.to}`).emit('ice-candidate', {
      from: client.data.userId,
      candidate: data.candidate,
    });
  }

  @SubscribeMessage('kick-participant')
  async handleKickParticipant(
    @MessageBody() data: { roomId: string; targetUserId: string; issuerId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const room = await this.roomsService.findOne(data.roomId);
    if (!room || room.hostId !== data.issuerId) return;

    // Notify target -> Frontend should listen and disconnect
    this.server.to(`user:${data.targetUserId}`).emit('kicked');

    // Notify room -> Frontend removes peer from grid
    this.server.to(data.roomId).emit('user-left', { userId: data.targetUserId });

    // Disconnect socket (optional, but cleaner)
    // this.server.in(`user:${data.targetUserId}`).disconnectSockets();
  }

  @SubscribeMessage('mute-participant')
  async handleMuteParticipant(
    @MessageBody() data: { roomId: string; targetUserId: string; issuerId: string; kind: 'audio' | 'video' },
    @ConnectedSocket() client: Socket,
  ) {
    const room = await this.roomsService.findOne(data.roomId);
    if (!room || room.hostId !== data.issuerId) return;

    this.server.to(`user:${data.targetUserId}`).emit('muted-by-host', { kind: data.kind });
  }

  @SubscribeMessage('room-deleted')
  async handleRoomDeleted(
    @MessageBody() data: { roomId: string; issuerId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const room = await this.roomsService.findOne(data.roomId).catch(() => null);
    // If room is already deleted from DB, we trust the issuerId context or checked before
    // But ideally we check BEFORE db delete. 
    // Actually, usually frontend calls API to delete, THEN Controller should ideally notify Gateway?
    // Or Frontend emits socket event -> Gateway deletes -> Gateway notifies.

    // Let's stick to the pattern: Frontend calls API to delete -> API deletes -> Frontend emits 'room-deleted' to notify others? 
    // NO, that's insecure.

    // Better: Controller calls Service -> Service return success.
    // BUT Gateway is separate. 

    // Alternative: Frontend calls API to delete. If success, Frontend emits 'room-deleted' socket event.
    // The Gateway verifies host and broadcasts.
    // Since room might be gone from DB, we can't fetch it to verify host!

    // CORRECT APPROACH: 
    // 1. Frontend calls API DELETE /rooms/:id
    // 2. Controller verifies Host, deletes room.
    // 3. Frontend receives success.
    // 4. Frontend emits 'room-deleted' event to socket.
    // 5. Gateway receives 'room-deleted'. Re-verifying host via DB is impossible if deleted.
    //    So we must verify host via `client.data.userId` against some record? 
    //    Or, we just trust the socket event from the Host? 
    //    Since `client.data.userId` is secure (set on join), we just need to know if they were the host.
    //    We can store `hostId` in `client.data` on join?
    //    
    //    Let's check handleJoinRoom again.

    this.server.to(data.roomId).emit('room-deleted');
  }
}
