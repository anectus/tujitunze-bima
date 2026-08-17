import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';

import { HospitalService } from './hospital.service';
import { UpdateHospitalProfileDto } from './dto/update-hospital-profile.dto';
import { VerifyMemberDto } from './dto/verify-member.dto';
import { CreateTreatmentDto } from './dto/create-treatment.dto';
import { UpdateTreatmentStatusDto } from './dto/update-treatment-status.dto';
import { CreateClaimDto } from './dto/create-claim.dto';
import { UpdateClaimStatusDto } from './dto/update-claim-status.dto';
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

  @Get('profile')
  async getProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.hospitalService.getHospitalProfile(user.userId);
  }

  @Patch('profile')
  async updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: UpdateHospitalProfileDto,
    @Req() request: Request,
  ) {
    return this.hospitalService.updateHospitalProfile(
      user.userId,
      body,
      request.ip,
    );
  }

  @Get('staff')
  async listStaff(@CurrentUser() user: AuthenticatedUser) {
    return this.hospitalService.listAuthorizedUsers(user.userId);
  }

  @Post('verifications')
  async verifyMember(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: VerifyMemberDto,
    @Req() request: Request,
  ) {
    return this.hospitalService.verifyMember(user.userId, body, request.ip);
  }

  @Get('verifications')
  async listVerifications(
    @CurrentUser() user: AuthenticatedUser,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(20), ParseIntPipe) pageSize: number,
  ) {
    return this.hospitalService.listVerifications(user.userId, page, pageSize);
  }

  @Get('eligible-members')
  async listEligibleMembers(@CurrentUser() user: AuthenticatedUser) {
    return this.hospitalService.listEligibleMembers(user.userId);
  }

  @Post('treatments')
  async createTreatment(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: CreateTreatmentDto,
    @Req() request: Request,
  ) {
    return this.hospitalService.createTreatment(user.userId, body, request.ip);
  }

  @Get('treatments')
  async listTreatments(
    @CurrentUser() user: AuthenticatedUser,
    @Query('status') status: string | undefined,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(20), ParseIntPipe) pageSize: number,
  ) {
    return this.hospitalService.listTreatments(
      user.userId,
      status,
      page,
      pageSize,
    );
  }

  @Patch('treatments/:id/status')
  async updateTreatmentStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateTreatmentStatusDto,
    @Req() request: Request,
  ) {
    return this.hospitalService.updateTreatmentStatus(
      user.userId,
      id,
      body,
      request.ip,
    );
  }

  @Post('claims')
  async createClaim(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: CreateClaimDto,
    @Req() request: Request,
  ) {
    return this.hospitalService.createClaim(user.userId, body, request.ip);
  }

  @Patch('claims/:id/submit')
  async submitDraftClaim(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
    @Req() request: Request,
  ) {
    return this.hospitalService.submitDraftClaim(user.userId, id, request.ip);
  }

  @Get('claims')
  async listClaims(
    @CurrentUser() user: AuthenticatedUser,
    @Query('status') status: string | undefined,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(20), ParseIntPipe) pageSize: number,
  ) {
    return this.hospitalService.listClaims(user.userId, status, page, pageSize);
  }

  @Patch('claims/:id/status')
  async updateClaimStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateClaimStatusDto,
    @Req() request: Request,
  ) {
    return this.hospitalService.updateClaimStatus(
      user.userId,
      id,
      body,
      request.ip,
    );
  }

  @Get('payments')
  async listPayments(
    @CurrentUser() user: AuthenticatedUser,
    @Query('status') status: string | undefined,
  ) {
    return this.hospitalService.listPayments(user.userId, status);
  }

  @Get('reports')
  async getReports(
    @CurrentUser() user: AuthenticatedUser,
    @Query('period') period: 'daily' | 'weekly' | 'monthly' = 'daily',
  ) {
    return this.hospitalService.getReports(user.userId, period);
  }

  @Get('activity-logs')
  async listActivityLogs(@CurrentUser() user: AuthenticatedUser) {
    return this.hospitalService.listActivityLogs(user.userId);
  }
}
