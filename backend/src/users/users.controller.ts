import { Controller, Get, Patch, Delete, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Mon profil' })
  getMe(@CurrentUser('id') userId: string) {
    return this.usersService.getMe(userId);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Modifier mon profil' })
  updateMe(@CurrentUser('id') userId: string, @Body() dto: any) {
    return this.usersService.updateMe(userId, dto);
  }

  @Delete('me')
  @ApiOperation({ summary: 'Supprimer mon compte (RGPD)' })
  deleteMe(@CurrentUser('id') userId: string) {
    return this.usersService.deleteMe(userId);
  }
}
