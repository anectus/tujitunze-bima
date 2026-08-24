import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async me(@Req() req: any) {
    // placeholder: expect auth guard to populate req.user
    const userId = req.user?.userId || null;
    if (!userId) return { message: 'unauthenticated' };
    return this.usersService.findOne(userId);
  }
}
