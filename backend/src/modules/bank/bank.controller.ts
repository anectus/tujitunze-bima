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

import { BankService } from './bank.service';
import { UpdateBankContactDto } from './dto/update-bank-contact.dto';
import { ConfigureWebhookDto } from './dto/configure-webhook.dto';
import { UploadReconciliationDto } from './dto/upload-reconciliation.dto';
import { FundTransferDto } from './dto/fund-transfer.dto';
import { CreateSettlementDto } from './dto/create-settlement.dto';
import { UpdateTransactionStatusDto } from './dto/update-transaction-status.dto';
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

  @Get('profile')
  async getProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.bankService.getBankProfile(user.userId);
  }

  @Patch('profile/contact')
  async updateContact(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: UpdateBankContactDto,
    @Req() request: Request,
  ) {
    return this.bankService.updateBankContact(user.userId, body, request.ip);
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('profile/api-key/regenerate')
  async regenerateApiKey(
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: Request,
  ) {
    return this.bankService.regenerateApiKey(user.userId, request.ip);
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('profile/webhook')
  async configureWebhook(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: ConfigureWebhookDto,
    @Req() request: Request,
  ) {
    return this.bankService.configureWebhook(user.userId, body, request.ip);
  }

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('profile/connection-test')
  async testConnection(@CurrentUser() user: AuthenticatedUser) {
    return this.bankService.testConnection(user.userId);
  }

  @Get('branches')
  async listBranches(@CurrentUser() user: AuthenticatedUser) {
    return this.bankService.listBranches(user.userId);
  }

  @Get('fund-accounts')
  async listFundAccounts(@CurrentUser() user: AuthenticatedUser) {
    return this.bankService.listFundAccounts(user.userId);
  }

  @Post('fund-accounts/:type/transfer')
  async createFundTransfer(
    @CurrentUser() user: AuthenticatedUser,
    @Param('type') type: string,
    @Body() body: FundTransferDto,
    @Req() request: Request,
  ) {
    return this.bankService.createFundTransfer(
      user.userId,
      type,
      body,
      request.ip,
    );
  }

  @Get('fund-accounts/:type/transfers')
  async listFundTransfers(
    @CurrentUser() user: AuthenticatedUser,
    @Param('type') type: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(20), ParseIntPipe) pageSize: number,
  ) {
    return this.bankService.listFundTransfers(
      user.userId,
      type,
      page,
      pageSize,
    );
  }

  @Get('transactions')
  async listTransactions(
    @CurrentUser() user: AuthenticatedUser,
    @Query('type') type: string | undefined,
    @Query('status') status: string | undefined,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(20), ParseIntPipe) pageSize: number,
  ) {
    return this.bankService.listTransactions(
      user.userId,
      type,
      status,
      page,
      pageSize,
    );
  }

  @Get('transactions/export')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="transactions.csv"')
  async exportTransactions(
    @CurrentUser() user: AuthenticatedUser,
    @Query('type') type: string | undefined,
    @Query('status') status: string | undefined,
  ) {
    return this.bankService.exportTransactionsCsv(user.userId, type, status);
  }

  @Patch('transactions/:id/status')
  async updateTransactionStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateTransactionStatusDto,
    @Req() request: Request,
  ) {
    return this.bankService.updateTransactionStatus(
      user.userId,
      id,
      body,
      request.ip,
    );
  }

  @Post('settlements')
  async createSettlement(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: CreateSettlementDto,
    @Req() request: Request,
  ) {
    return this.bankService.createSettlement(user.userId, body, request.ip);
  }

  @Patch('settlements/:id/complete')
  async completeSettlement(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
    @Req() request: Request,
  ) {
    return this.bankService.completeSettlement(user.userId, id, request.ip);
  }

  @Get('settlements')
  async listSettlements(
    @CurrentUser() user: AuthenticatedUser,
    @Query('status') status: string | undefined,
    @Query('counterpartyType') counterpartyType: string | undefined,
  ) {
    return this.bankService.listSettlements(
      user.userId,
      status,
      counterpartyType,
    );
  }

  @Post('reconciliation/runs')
  async createReconciliationRun(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: UploadReconciliationDto,
  ) {
    return this.bankService.createReconciliationRun(user.userId, body);
  }

  @Get('reconciliation/runs')
  async listReconciliationRuns(@CurrentUser() user: AuthenticatedUser) {
    return this.bankService.listReconciliationRuns(user.userId);
  }

  @Get('reconciliation/runs/:id')
  async getReconciliationRun(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.bankService.getReconciliationRun(user.userId, id);
  }

  @Get('reports')
  async getReports(
    @CurrentUser() user: AuthenticatedUser,
    @Query('period') period: 'daily' | 'weekly' | 'monthly' = 'daily',
  ) {
    return this.bankService.getReports(user.userId, period);
  }

  @Get('activity-logs')
  async listActivityLogs(@CurrentUser() user: AuthenticatedUser) {
    return this.bankService.listActivityLogs(user.userId);
  }

  @Get('api-access-logs')
  async listApiAccessLogs(@CurrentUser() user: AuthenticatedUser) {
    return this.bankService.listApiAccessLogs(user.userId);
  }
}
