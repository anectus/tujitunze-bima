import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';

import { AdminHospitalsService } from './admin-hospitals.service';
import { CreateHospitalDto } from './dto/create-hospital.dto';
import { UpdateHospitalStatusDto } from './dto/update-hospital-status.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthenticatedUser } from '../auth/jwt.strategy';

@Controller('admin/hospitals')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('Admin')
export class AdminHospitalsController {
  constructor(private readonly adminHospitalsService: AdminHospitalsService) {}

  @Get()
  async list() {
    return this.adminHospitalsService.list();
  }

  @Post()
  async create(
    @Body() body: CreateHospitalDto,
    @CurrentUser() admin: AuthenticatedUser,
    @Req() request: Request,
  ) {
    return this.adminHospitalsService.create(body, admin.userId, request.ip);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateHospitalStatusDto,
    @CurrentUser() admin: AuthenticatedUser,
    @Req() request: Request,
  ) {
    return this.adminHospitalsService.updateStatus(
      id,
      body,
      admin.userId,
      request.ip,
    );
  }
}
