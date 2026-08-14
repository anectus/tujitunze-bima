import { Controller, Get, UseGuards } from '@nestjs/common';

import { TelecomService } from './telecom.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthenticatedUser } from '../auth/jwt.strategy';

@Controller('telecom')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('Telecom')
export class TelecomController {
  constructor(private readonly telecomService: TelecomService) {}

  @Get('dashboard')
  async getDashboard(@CurrentUser() user: AuthenticatedUser) {
    return this.telecomService.getDashboard(user.userId);
  }
}
