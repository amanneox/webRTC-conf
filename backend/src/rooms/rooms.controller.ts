import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) { }

  @UseGuards(AuthGuard('jwt'))
  @Post()
  create(@Body() createRoomDto: CreateRoomDto, @Request() req) {
    return this.roomsService.create({ ...createRoomDto, hostId: req.user.id });
  }

  @Get()
  findAll() {
    return this.roomsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.roomsService.findOne(id);
  }

  // @UseGuards(AuthGuard('jwt'))
  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateRoomDto: UpdateRoomDto) {
  //   return this.roomsService.update(id, updateRoomDto);
  // }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    const room = await this.roomsService.findOne(id);
    if (room.hostId !== req.user.id) {
      throw new Error('Only the host can delete this room');
    }
    return this.roomsService.remove(id);
  }

  @Post(':id/invite')
  invite(@Param('id') id: string, @Body('email') email: string) {
    return this.roomsService.inviteUser(id, email);
  }
}
