import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';

import { MembersService } from './members.service';
import { RegisterDto } from './dto/register.dto';
import { AddPhoneNumberDto } from './dto/add-phone-number.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { AddBankAccountDto } from './dto/add-bank-account.dto';
import { CurrentUser } from '../modules/auth/decorators/current-user.decorator';
import { Roles } from '../modules/auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../modules/auth/guards/roles.guard';
import type { AuthenticatedUser } from '../modules/auth/jwt.strategy';

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
  ) {
    return this.membersService.addPhoneNumber(user.userId, body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Member')
  @Post('bank-accounts')
  async addBankAccount(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: AddBankAccountDto,
  ) {
    return this.membersService.addBankAccount(user.userId, body);
  }
}
