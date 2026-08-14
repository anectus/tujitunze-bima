import { Body, Controller, Get, Post, UseGuards, Req } from '@nestjs/common';
import type { Request } from 'express';

import { SuperAdminService } from './super-admin.service';
import { CreateAdministratorDto } from './dto/create-administrator.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthenticatedUser } from '../auth/jwt.strategy';

@Controller('super-admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('Super-admin')
export class SuperAdminController {
  constructor(private readonly superAdminService: SuperAdminService) {}

  @Get('dashboard')
  async getDashboard() {
    return this.superAdminService.getDashboard();
  }

  @Get('administrators')
  async listAdministrators() {
    return this.superAdminService.listAdministrators();
  }

  @Post('administrators')
  async createAdministrator(
    @Body() body: CreateAdministratorDto,
    @CurrentUser() actor: AuthenticatedUser,
    @Req() request: Request,
  ) {
    return this.superAdminService.createAdministrator(
      body,
      actor.userId,
      request.ip,
    );
  }

  @Get('tenants')
  async listTenants() {
    return this.superAdminService.listTenants();
  }
}
