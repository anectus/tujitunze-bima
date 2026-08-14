import { Module } from '@nestjs/common';

import { TelecomController } from './telecom.controller';
import { TelecomService } from './telecom.service';

@Module({
  controllers: [TelecomController],
  providers: [TelecomService],
})
export class TelecomModule {}
