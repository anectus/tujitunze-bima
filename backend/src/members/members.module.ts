import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from './entities/user.entity';
import { PhoneNumber } from './entities/phone-number.entity';

import { MembersController } from './members.controller';
import { MembersService } from './members.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, PhoneNumber])],

  controllers: [MembersController],

  providers: [MembersService],

  exports: [MembersService],
})
export class MembersModule {}
