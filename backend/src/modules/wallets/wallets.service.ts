import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';

import { HealthWallet } from './entities/health-wallet.entity';
import { WalletTransaction } from './entities/wallet-transaction.entity';
import { TopUpWalletDto } from './dto/top-up-wallet.dto';
import { PhoneNumber } from '../members/entities/phone-number.entity';
import { MemberBankAccount } from '../members/entities/bank-account.entity';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class WalletsService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  private async getOrCreateWallet(
    manager: EntityManager,
    memberId: number,
  ): Promise<HealthWallet> {
    const existing = await manager.findOne(HealthWallet, {
      where: { memberId },
    });

    if (existing) {
      return existing;
    }

    // Lazily created on first visit/top-up rather than at registration —
    // most members will never earn interest on an idle wallet, so there's
    // nothing lost by not creating rows nobody has funded yet.
    const wallet = manager.create(HealthWallet, {
      memberId,
      walletNumber: `TW-${memberId}-${Date.now().toString(36).toUpperCase()}`,
      balance: 0,
      walletStatus: 'Active',
    });

    return manager.save(HealthWallet, wallet);
  }

  async getWallet(memberId: number) {
    return this.dataSource.transaction(async (manager) => {
      const wallet = await this.getOrCreateWallet(manager, memberId);

      return {
        walletId: wallet.walletId,
        walletNumber: wallet.walletNumber,
        balance: wallet.balance,
        walletStatus: wallet.walletStatus,
      };
    });
  }

  async topUp(
    memberId: number,
    data: TopUpWalletDto,
    ipAddress: string | null = null,
  ) {
    return this.dataSource.transaction(async (manager) => {
      let sourceDescription: string;

      if (data.sourceType === 'phone') {
        const phone = await manager.findOne(PhoneNumber, {
          where: { phoneId: data.sourceId },
        });

        if (!phone || phone.userId !== memberId) {
          throw new ForbiddenException(
            'That phone number is not linked to your account.',
          );
        }

        sourceDescription = `mobile money (${phone.phoneNumber})`;
      } else {
        const account = await manager.findOne(MemberBankAccount, {
          where: { memberBankAccountId: data.sourceId },
        });

        if (!account || account.memberId !== memberId) {
          throw new ForbiddenException(
            'That bank account is not linked to your account.',
          );
        }

        sourceDescription = `bank account ending ${account.accountNumber.slice(-4)}`;
      }

      const wallet = await this.getOrCreateWallet(manager, memberId);

      if (wallet.walletStatus !== 'Active') {
        throw new BadRequestException(
          `Your wallet is ${wallet.walletStatus.toLowerCase()} and cannot receive a top-up.`,
        );
      }

      wallet.balance = Number((wallet.balance + data.amount).toFixed(2));

      const savedWallet = await manager.save(HealthWallet, wallet);

      // No live payment gateway is integrated yet (see CLAUDE.md known
      // gaps) — this credits the wallet ledger directly rather than
      // capturing a real mobile-money/bank debit. Real settlement is a
      // separate, larger integration.
      const transaction = manager.create(WalletTransaction, {
        walletId: wallet.walletId,
        transactionType: 'Top Up',
        amount: data.amount,
        remarks: `Top-up via ${sourceDescription}`,
      });

      const savedTransaction = await manager.save(
        WalletTransaction,
        transaction,
      );

      await this.auditLogsService.record(manager, {
        memberId,
        actionType: 'wallet.topup',
        affectedTable: 'health_wallets',
        affectedRecordId: wallet.walletId,
        newValue: {
          amount: data.amount,
          newBalance: savedWallet.balance,
          source: sourceDescription,
        },
        ipAddress,
      });

      return {
        walletId: savedWallet.walletId,
        walletNumber: savedWallet.walletNumber,
        balance: savedWallet.balance,
        walletStatus: savedWallet.walletStatus,
        transaction: {
          walletTransactionId: savedTransaction.walletTransactionId,
          amount: savedTransaction.amount,
          remarks: savedTransaction.remarks,
          transactionDate: savedTransaction.transactionDate,
        },
      };
    });
  }
}
