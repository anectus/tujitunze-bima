import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';

import { WalletsService } from './wallets.service';
import { TopUpWalletDto } from './dto/top-up-wallet.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthenticatedUser } from '../auth/jwt.strategy';

@Controller('members/wallet')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('Member')
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  @Get()
  async get(@CurrentUser() user: AuthenticatedUser) {
    return this.walletsService.getWallet(user.userId);
  }

  @Post('topup')
  async topUp(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: TopUpWalletDto,
    @Req() request: Request,
  ) {
    return this.walletsService.topUp(user.userId, body, request.ip);
  }
}
