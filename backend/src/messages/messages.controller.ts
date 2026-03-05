import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('messages')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('messages')
export class MessagesController {
  constructor(private service: MessagesService) {}

  @Get('conversations')
  @ApiOperation({ summary: 'Lister mes conversations' })
  getConversations(@CurrentUser('id') userId: string) {
    return this.service.getConversations(userId);
  }

  @Get('thread/:partnerId')
  @ApiOperation({ summary: 'Messages avec un utilisateur' })
  getThread(@CurrentUser('id') userId: string, @Param('partnerId') partnerId: string) {
    return this.service.getThread(userId, partnerId);
  }

  @Post()
  @ApiOperation({ summary: 'Envoyer un message' })
  send(@CurrentUser('id') userId: string, @Body() dto: any) {
    return this.service.send(userId, dto);
  }
}
