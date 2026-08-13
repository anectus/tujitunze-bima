import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';

import { MembersService } from './members.service';
import { RegisterDto } from './dto/register.dto';
import { AddPhoneNumberDto } from './dto/add-phone-number.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { AddBankAccountDto } from './dto/add-bank-account.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthenticatedUser } from '../auth/jwt.strategy';

@Controller('members')
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Post('register')
  async register(@Body() body: RegisterDto) {
    return this.membersService.register(body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Member')
  @Get('me')
  async me(@CurrentUser() user: AuthenticatedUser) {
    return this.membersService.getProfile(user.userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Member')
  @Patch('me')
  async updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: UpdateProfileDto,
  ) {
    return this.membersService.updateProfile(user.userId, body);
  }

  @Get('telecom-operators')
  async telecomOperators() {
    return this.membersService.listTelecomOperators();
  }

  @Get('banks')
  async banks() {
    return this.membersService.listBanks();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Member')
  @Post('phone-numbers')
  async addPhoneNumber(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: AddPhoneNumberDto,
    @Req() request: Request,
  ) {
    return this.membersService.addPhoneNumber(user.userId, body, request.ip);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Member')
  @Post('bank-accounts')
  async addBankAccount(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: AddBankAccountDto,
    @Req() request: Request,
  ) {
    return this.membersService.addBankAccount(user.userId, body, request.ip);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Member')
  @Patch('me/password')
  async changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: ChangePasswordDto,
    @Req() request: Request,
  ) {
    return this.membersService.changePassword(user.userId, body, request.ip);
  }
}
