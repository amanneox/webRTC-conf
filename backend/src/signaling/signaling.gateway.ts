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
      if (participantId) {
        await this.prisma.participant.delete({ where: { id: participantId } }).catch(() => { });
      }
    }
  }

  private pendingUsers = new Map<string, { roomId: string; userId: string; name: string; client: Socket }>();

  @SubscribeMessage('join-room')
  handleJoinRoom(
    @MessageBody() data: { roomId: string; userId: string; name: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.data.userId = data.userId;
    client.data.roomId = data.roomId;
    client.data.name = data.name;

    client.join(data.roomId);
    // Personal room for targeting specific users (offers/answers)
    client.join(`user:${data.userId}`);
    console.log(`Client ${client.id} joined room ${data.roomId} as ${data.userId}`);

    // Hold 'pending' status until client emits 'ready'.
    // This ensures frontend listeners are active before we dump the user list.
    this.pendingUsers.set(client.id, { roomId: data.roomId, userId: data.userId, name: data.name, client });
  }

  @SubscribeMessage('ready')
  async handleReady(@ConnectedSocket() client: Socket) {
    const pending = this.pendingUsers.get(client.id);
    if (pending) {
      console.log(`Client ${pending.userId} is ready, sending existing users`);

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
      name: client.data.name || 'Participant',
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
      name: client.data.name || 'Participant',
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
    this.server.to(`user:${data.targetUserId}`).emit('kicked');
    // We emit to the whole room so everyone removes the video tile immediately
    this.server.to(data.roomId).emit('user-left', { userId: data.targetUserId });
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
    this.server.to(data.roomId).emit('room-deleted');
  }
}
