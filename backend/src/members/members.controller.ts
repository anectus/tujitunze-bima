import {
  Body,
  Controller,
  Post,
} from '@nestjs/common';

import { MembersService } from './members.service';

@Controller('members')
export class MembersController {
  constructor(
    private readonly membersService: MembersService,
  ) {}

  @Post('register')
  async register(
    @Body()
    body: {
      firstName: string;
      middleName: string;
      surname: string;
      phoneNumber: string;
      nidaNumber: string;
      email?: string;
      password: string;
    },
  ) {
    return this.membersService.register(body);
  }
}