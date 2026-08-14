import { Controller, Get, UseGuards } from '@nestjs/common';

import { HospitalService } from './hospital.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthenticatedUser } from '../auth/jwt.strategy';

@Controller('hospital')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('Hospital')
export class HospitalController {
  constructor(private readonly hospitalService: HospitalService) {}

  @Get('dashboard')
  async getDashboard(@CurrentUser() user: AuthenticatedUser) {
    return this.hospitalService.getDashboard(user.userId);
  }
}
