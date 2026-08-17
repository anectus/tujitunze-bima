import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Header,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { Throttle } from '@nestjs/throttler';

import { TelecomService } from './telecom.service';
import { UpdateOperatorContactDto } from './dto/update-operator-contact.dto';
import { ConfigureWebhookDto } from './dto/configure-webhook.dto';
import { UploadReconciliationDto } from './dto/upload-reconciliation.dto';
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

  @Get('operator')
  async getOperator(@CurrentUser() user: AuthenticatedUser) {
    return this.telecomService.getOperatorProfile(user.userId);
  }

  @Patch('operator/contact')
  async updateOperatorContact(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: UpdateOperatorContactDto,
    @Req() request: Request,
  ) {
    return this.telecomService.updateOperatorContact(
      user.userId,
      body,
      request.ip,
    );
  }

  // Tight limit — this issues a fresh credential every call.
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('operator/api-key/regenerate')
  async regenerateApiKey(
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: Request,
  ) {
    return this.telecomService.regenerateApiKey(user.userId, request.ip);
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('operator/webhook')
  async configureWebhook(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: ConfigureWebhookDto,
    @Req() request: Request,
  ) {
    return this.telecomService.configureWebhook(user.userId, body, request.ip);
  }

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('operator/connection-test')
  async testConnection(@CurrentUser() user: AuthenticatedUser) {
    return this.telecomService.testConnection(user.userId);
  }

  @Get('members')
  async listMembers(
    @CurrentUser() user: AuthenticatedUser,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(20), ParseIntPipe) pageSize: number,
  ) {
    return this.telecomService.listMembers(user.userId, page, pageSize);
  }

  @Get('contributions')
  async listContributions(
    @CurrentUser() user: AuthenticatedUser,
    @Query('status') status: string | undefined,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(20), ParseIntPipe) pageSize: number,
  ) {
    return this.telecomService.listContributions(
      user.userId,
      status,
      page,
      pageSize,
    );
  }

  @Get('contributions/export')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="contributions.csv"')
  async exportContributions(
    @CurrentUser() user: AuthenticatedUser,
    @Query('status') status: string | undefined,
  ) {
    return this.telecomService.exportContributionsCsv(user.userId, status);
  }

  @Get('contribution-rules')
  async listContributionRules() {
    return this.telecomService.listContributionRules();
  }

  @Post('reconciliation/runs')
  async createReconciliationRun(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: UploadReconciliationDto,
  ) {
    return this.telecomService.createReconciliationRun(user.userId, body);
  }

  @Get('reconciliation/runs')
  async listReconciliationRuns(@CurrentUser() user: AuthenticatedUser) {
    return this.telecomService.listReconciliationRuns(user.userId);
  }

  @Get('reconciliation/runs/:id')
  async getReconciliationRun(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.telecomService.getReconciliationRun(user.userId, id);
  }

  @Get('reports')
  async getReports(
    @CurrentUser() user: AuthenticatedUser,
    @Query('period') period: 'daily' | 'weekly' | 'monthly' = 'daily',
  ) {
    return this.telecomService.getReports(user.userId, period);
  }

  @Get('activity-logs')
  async listActivityLogs(@CurrentUser() user: AuthenticatedUser) {
    return this.telecomService.listActivityLogs(user.userId);
  }

  @Get('api-access-logs')
  async listApiAccessLogs(@CurrentUser() user: AuthenticatedUser) {
    return this.telecomService.listApiAccessLogs(user.userId);
  }
}
