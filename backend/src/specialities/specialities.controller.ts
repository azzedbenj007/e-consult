import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SpecialitiesService } from './specialities.service';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('specialities')
@Controller('specialities')
export class SpecialitiesController {
  constructor(private service: SpecialitiesService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Liste des spécialités' })
  findAll() {
    return this.service.findAll();
  }
}
