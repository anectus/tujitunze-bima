import { Injectable, BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ContributionRule } from './contribution-rule.entity';
import { ContributionTransaction } from './contribution-transaction.entity';
import { HealthWallet } from '../wallets/health-wallet.entity';
import { WalletTransaction } from '../wallets/wallet-transaction.entity';
import { AuditLog } from '../audit/audit.entity';

@Injectable()
export class ContributionsService {
  constructor(private dataSource: DataSource) {}

  private async pickRule(sourceType: string, ruleName?: string) {
    const repo = this.dataSource.getRepository(ContributionRule);
    if (ruleName) {
      const r = await repo.findOneBy({ ruleName });
      if (!r) throw new BadRequestException('Contribution rule not found');
      return r;
    }
    // prefer exact source_type, then ALL
    let r = await repo.findOneBy({ sourceType, status: 'ACTIVE' } as any);
    if (r) return r;
    r = await repo.findOneBy({ sourceType: 'ALL', status: 'ACTIVE' } as any);
    if (r) return r;
    throw new BadRequestException('No active contribution rule found');
  }

  async applyContribution(input: {
    memberId: number;
    sourceType: 'TELECOM' | 'BANK';
    externalReference: string;
    sourceTransactionAmount: number;
    ruleName?: string;
    actorId?: number;
  }) {
    const { memberId, sourceType, externalReference, sourceTransactionAmount, ruleName, actorId } = input;

    // idempotency check
    const existing = await this.dataSource
      .getRepository(ContributionTransaction)
      .findOneBy({ sourceType, externalReference });
    if (existing) return existing;

    const rule = await this.pickRule(sourceType, ruleName);

    // compute contribution
    let contributionAmount: number;
    if (rule.calculationType === 'FIXED') {
      contributionAmount = Number(rule.fixedAmount);
    } else {
      contributionAmount = Number(sourceTransactionAmount) * Number(rule.percentageRate);
    }
    if (rule.maximumContributionAmount) {
      const max = Number(rule.maximumContributionAmount);
      if (contributionAmount > max) contributionAmount = max;
    }

    // transaction: create contribution, wallet tx, update wallet, audit
    return this.dataSource.manager.transaction(async (manager) => {
      // create contribution
      const contribRepo = manager.getRepository(ContributionTransaction);
      const contribution = contribRepo.create({
        memberId,
        sourceType,
        sourceTransactionAmount: String(sourceTransactionAmount),
        contributionAmount: String(contributionAmount),
        contributionRule: rule.ruleName,
        contributionRate: rule.percentageRate ?? undefined,
        externalReference,
      });
      const savedContribution = await contribRepo.save(contribution);

      // ensure wallet
      const walletRepo = manager.getRepository(HealthWallet);
      let wallet = await walletRepo.findOneBy({ memberId });
      if (!wallet) {
        wallet = walletRepo.create({
          memberId,
          walletNumber: `WB${memberId}${Date.now()}`,
          currentBalance: '0.00',
        });
        wallet = await walletRepo.save(wallet);
      }

      // create wallet transaction
      const balanceBefore = Number(wallet.currentBalance);
      const balanceAfter = balanceBefore + Number(contributionAmount);
      const walletTxRepo = manager.getRepository(WalletTransaction);
      const walletTx = walletTxRepo.create({
        wallet,
        memberId,
        contributionId: savedContribution.contributionId,
        transactionType: 'CONTRIBUTION',
        amount: String(contributionAmount),
        balanceBefore: String(balanceBefore),
        balanceAfter: String(balanceAfter),
        transactionReference: `CT-${savedContribution.contributionId}`,
      });
      await walletTxRepo.save(walletTx);

      // update wallet balance
      await walletRepo.update(
        { walletId: wallet.walletId },
        { currentBalance: String(balanceAfter) },
      );

      // audit log (use raw insert via manager so it's inside the same tx)
      await manager.insert(AuditLog, {
        action: 'contribution.create',
        actorType: 'SYSTEM',
        actorId: actorId,
        details: {
          contributionId: savedContribution.contributionId,
          memberId,
          sourceType,
          sourceAmount: sourceTransactionAmount,
          contributionAmount,
          externalReference,
        },
      } as Partial<AuditLog>);

      // reload and return contribution row
      return contribRepo.findOneBy({
        contributionId: savedContribution.contributionId,
      });
    });
  }
}
