import { Controller, Post, Body } from '@nestjs/common';
import { ContributionsService } from './contributions.service';
import { ApplyContributionDto } from './dto/apply-contribution.dto';

@Controller('contributions')
export class ContributionsController {
  constructor(private readonly svc: ContributionsService) {}

  @Post('apply')
  async apply(@Body() dto: ApplyContributionDto) {
    const res = await this.svc.applyContribution({
      memberId: dto.memberId,
      sourceType: dto.sourceType,
      externalReference: dto.externalReference,
      sourceTransactionAmount: dto.sourceTransactionAmount,
      ruleName: dto.ruleName,
    });
    return res;
  }
}
