import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../database/prisma.service';
import * as bcrypt from 'bcrypt';
import { CreateAuthDto } from './dto/create-auth.dto';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService) { }

  async register(dto: CreateAuthDto) {
    const hash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: { email: dto.email, password: hash, name: dto.name },
    });
    return this.login({ email: user.email, password: dto.password });
  }

  async validateUser(email: string, pass: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (user && await bcrypt.compare(pass, user.password)) {
      const { password, ...rest } = user;
      return rest;
    }
    return null;
  }

  async login(creds: { email: string; password: string }) {
    const user = await this.validateUser(creds.email, creds.password);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    return {
      access_token: this.jwt.sign({ email: user.email, sub: user.id, name: user.name }),
      user,
    };
  }
}
