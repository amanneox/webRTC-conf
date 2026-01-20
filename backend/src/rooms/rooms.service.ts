import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class RoomsService {
  constructor(private prisma: PrismaService) { }

  create(dto: CreateRoomDto) {
    return this.prisma.room.create({
      data: { name: dto.name, hostId: dto.hostId },
    });
  }

  findAll() {
    return this.prisma.room.findMany({
      include: { host: { select: { name: true, email: true } } },
    });
  }

  async findOne(id: string) {
    const room = await this.prisma.room.findUnique({
      where: { id },
      include: { participants: true },
    });
    if (!room) throw new NotFoundException(`Room ${id} not found`);
    return room;
  }

  update(id: string, dto: UpdateRoomDto) {
    return this.prisma.room.update({ where: { id }, data: dto });
  }

  remove(id: string) {
    return this.prisma.room.delete({ where: { id } });
  }

  async inviteUser(roomId: string, email: string) {
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    const room = await this.findOne(roomId);
    const link = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/room/${roomId}`;

    const { data } = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: email,
      subject: `Join ${room.name}`,
      html: getInviteTemplate(room.name || 'Meeting', link),
    });
    return { success: true, data };
  }
}

function getInviteTemplate(roomName: string, link: string) {
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #334155; }
    .btn { display: inline-block; padding: 12px 24px; background-color: #0f172a; color: #ffffff !important; text-decoration: none; border-radius: 6px; font-weight: 600; }
    .container { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); max-width: 480px; margin: 0 auto; border: 1px solid #e2e8f0; }
    .footer { text-align: center; font-size: 12px; color: #94a3b8; margin-top: 24px; }
    h2 { margin-top: 0; color: #0f172a; font-size: 24px; }
  </style>
</head>
<body style="background-color: #f1f5f9; padding: 40px 0; margin: 0;">
  <div class="container">
    <h2>You're invited!</h2>
    <p>You have been invited to join the room <strong>${roomName}</strong>.</p>
    <div style="text-align: center; margin: 32px 0;">
      <a style="color: #ffffff !important;" href="${link}" class="btn">Join Session</a>
    </div>
    <p style="font-size: 14px; color: #64748b;">Or paste this link into your browser:<br>
    <a href="${link}" style="color: #2563eb; text-decoration: none;">${link}</a></p>
  </div>
  <div class="footer">
    <p>Sent via WebRTConnect</p>
  </div>
</body>
</html>
  `;
}
