import { Controller, Get, UseGuards } from '@nestjs/common';

import { BankService } from './bank.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthenticatedUser } from '../auth/jwt.strategy';

@Controller('bank')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('Bank')
export class BankController {
  constructor(private readonly bankService: BankService) {}

  @Get('dashboard')
  async getDashboard(@CurrentUser() user: AuthenticatedUser) {
    return this.bankService.getDashboard(user.userId);
  }
}
