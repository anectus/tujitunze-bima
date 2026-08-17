import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

import { UpdateBankContactDto } from './dto/update-bank-contact.dto';
import { ConfigureWebhookDto } from './dto/configure-webhook.dto';
import { UploadReconciliationDto } from './dto/upload-reconciliation.dto';
import { FundTransferDto } from './dto/fund-transfer.dto';
import { CreateSettlementDto } from './dto/create-settlement.dto';
import { UpdateTransactionStatusDto } from './dto/update-transaction-status.dto';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { NotificationsService } from '../notifications/notifications.service';

const FUND_ACCOUNT_TYPES = ['Settlement', 'Health Fund', 'Reserve'] as const;
type FundAccountType = (typeof FUND_ACCOUNT_TYPES)[number];

interface BankTransactionRow {
  bank_transaction_id: number;
  transaction_reference: string;
  transaction_type: string;
  amount: string;
  transaction_status: string;
  transaction_date: Date;
  account_number: string;
}

interface BranchRow {
  branch_id: number;
  branch_code: string;
  branch_name: string;
  region: string | null;
  district: string | null;
  location: string | null;
  contact_phone: string | null;
  status: string;
}

interface FundAccountRow {
  fund_account_id: number;
  bank_id: number;
  account_type: FundAccountType;
  account_number: string | null;
  balance: string;
  reserved_balance: string;
  status: string;
}

interface FundTransferRow {
  transfer_id: number;
  transfer_type: string;
  amount: string;
  balance_after: string;
  reference: string | null;
  description: string | null;
  created_at: Date;
}

interface SettlementRow {
  settlement_id: number;
  counterparty_type: string;
  counterparty_name: string;
  amount: string;
  settlement_status: string;
  settlement_date: Date;
}

interface ReconciliationRunRow {
  run_id: number;
  total_uploaded: number;
  matched_count: number;
  unmatched_count: number;
  run_date: Date;
}

interface ReconciliationRecordRow {
  record_id: number;
  external_reference: string;
  amount: string;
  record_date: Date | null;
  matched_bank_transaction_id: number | null;
  match_status: string;
  discrepancy_notes: string | null;
}

interface ActivityLogRow {
  audit_id: number;
  member_id: number | null;
  action_type: string;
  affected_table: string | null;
  affected_record_id: number | null;
  ip_address: string | null;
  created_at: Date;
}

interface ApiAccessLogRow {
  log_id: number;
  event_type: string;
  endpoint: string | null;
  response_status: number | null;
  success: boolean;
  message: string | null;
  created_at: Date;
}

function formatTsh(amount: number): string {
  return `TSh ${amount.toLocaleString('en-TZ', { minimumFractionDigits: 2 })}`;
}

@Injectable()
export class BankService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly auditLogsService: AuditLogsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  private async getAssignedBankId(userId: number): Promise<number> {
    const [row] = await this.dataSource.query<{ bank_id: number | null }[]>(
      `SELECT bank_id FROM users WHERE user_id = $1`,
      [userId],
    );

    if (!row?.bank_id) {
      throw new ForbiddenException(
        'This account is not assigned to a bank yet',
      );
    }

    return row.bank_id;
  }

  // =====================================================
  // Dashboard Overview
  // =====================================================

  async getDashboard(userId: number) {
    const bankId = await this.getAssignedBankId(userId);

    const [bank] = await this.dataSource.query<
      { bank_name: string; status: string }[]
    >(`SELECT bank_name, status FROM banks WHERE bank_id = $1`, [bankId]);

    const [{ count: linkedAccountCount }] = await this.dataSource.query<
      { count: number }[]
    >(
      `SELECT COUNT(*)::int AS count FROM member_bank_accounts WHERE bank_id = $1`,
      [bankId],
    );

    const [{ total: totalFunds }] = await this.dataSource.query<
      { total: string }[]
    >(
      `SELECT COALESCE(SUM(balance), 0) AS total FROM bank_fund_accounts WHERE bank_id = $1`,
      [bankId],
    );

    const todayByType = await this.dataSource.query<
      { transaction_type: string; total: string }[]
    >(
      `SELECT bt.transaction_type, COALESCE(SUM(bt.amount), 0) AS total
       FROM bank_transactions bt
       JOIN member_bank_accounts mba ON mba.member_bank_account_id = bt.member_bank_account_id
       WHERE mba.bank_id = $1 AND bt.transaction_date::date = CURRENT_DATE
       GROUP BY bt.transaction_type`,
      [bankId],
    );

    const settlementsByStatus = await this.dataSource.query<
      { settlement_status: string; count: number }[]
    >(
      `SELECT settlement_status, COUNT(*)::int AS count
       FROM settlements
       WHERE bank_id = $1
       GROUP BY settlement_status`,
      [bankId],
    );

    const [lastRun] = await this.dataSource.query<ReconciliationRunRow[]>(
      `SELECT run_id, total_uploaded, matched_count, unmatched_count, run_date
       FROM bank_reconciliation_runs
       WHERE bank_id = $1
       ORDER BY run_date DESC
       LIMIT 1`,
      [bankId],
    );

    return {
      bank: { name: bank?.bank_name ?? null, status: bank?.status ?? null },
      linkedAccountCount,
      totalFunds,
      todayDeposits:
        todayByType.find((r) => r.transaction_type === 'Deposit')?.total ?? '0',
      todayWithdrawals:
        todayByType.find((r) => r.transaction_type === 'Withdrawal')?.total ??
        '0',
      pendingSettlements:
        settlementsByStatus.find((r) => r.settlement_status === 'Pending')
          ?.count ?? 0,
      completedSettlements:
        settlementsByStatus.find((r) => r.settlement_status === 'Completed')
          ?.count ?? 0,
      reconciliationStatus: lastRun
        ? {
            runId: lastRun.run_id,
            matchedCount: lastRun.matched_count,
            unmatchedCount: lastRun.unmatched_count,
            runDate: lastRun.run_date,
          }
        : null,
    };
  }

  // =====================================================
  // Bank Profile
  // =====================================================

  async getBankProfile(userId: number) {
    const bankId = await this.getAssignedBankId(userId);

    const [bank] = await this.dataSource.query<
      {
        bank_id: number;
        bank_name: string;
        bank_code: string | null;
        swift_code: string | null;
        country_code: string;
        api_endpoint: string | null;
        status: string;
        contact_phone: string | null;
        contact_email: string | null;
        api_key_preview: string | null;
        api_key_generated_at: Date | null;
        webhook_url: string | null;
        webhook_secret_generated_at: Date | null;
      }[]
    >(
      `SELECT bank_id, bank_name, bank_code, swift_code, country_code, api_endpoint, status,
              contact_phone, contact_email,
              api_key_preview, api_key_generated_at,
              webhook_url, webhook_secret_generated_at
       FROM banks
       WHERE bank_id = $1`,
      [bankId],
    );

    if (!bank) {
      throw new NotFoundException('Bank not found');
    }

    const branches = await this.dataSource.query<BranchRow[]>(
      `SELECT branch_id, branch_code, branch_name, region, district, location, contact_phone, status
       FROM bank_branches
       WHERE bank_id = $1
       ORDER BY branch_name`,
      [bankId],
    );

    return {
      bankId: bank.bank_id,
      bankName: bank.bank_name,
      bankCode: bank.bank_code,
      swiftCode: bank.swift_code,
      countryCode: bank.country_code,
      apiEndpoint: bank.api_endpoint,
      status: bank.status,
      contactPhone: bank.contact_phone,
      contactEmail: bank.contact_email,
      branches,
      apiKey: {
        hasKey: !!bank.api_key_preview,
        preview: bank.api_key_preview,
        generatedAt: bank.api_key_generated_at,
      },
      webhook: {
        hasWebhook: !!bank.webhook_url,
        url: bank.webhook_url,
        secretGeneratedAt: bank.webhook_secret_generated_at,
      },
    };
  }

  async updateBankContact(
    userId: number,
    data: UpdateBankContactDto,
    ipAddress: string | null = null,
  ) {
    const bankId = await this.getAssignedBankId(userId);

    await this.dataSource.query(
      `UPDATE banks
       SET contact_phone = COALESCE($2, contact_phone),
           contact_email = COALESCE($3, contact_email),
           updated_at = NOW()
       WHERE bank_id = $1`,
      [bankId, data.contactPhone ?? null, data.contactEmail ?? null],
    );

    await this.dataSource.transaction((manager) =>
      this.auditLogsService.record(manager, {
        memberId: userId,
        actionType: 'bank.contact_update',
        affectedTable: 'banks',
        affectedRecordId: bankId,
        newValue: {
          contactPhone: data.contactPhone,
          contactEmail: data.contactEmail,
        },
        ipAddress,
      }),
    );

    return this.getBankProfile(userId);
  }

  async regenerateApiKey(userId: number, ipAddress: string | null = null) {
    const bankId = await this.getAssignedBankId(userId);

    const apiKey = `bk_${crypto.randomBytes(24).toString('hex')}`;
    const apiKeyHash = await bcrypt.hash(apiKey, 12);
    const preview = apiKey.slice(-6);

    await this.dataSource.query(
      `UPDATE banks
       SET api_key_hash = $2, api_key_preview = $3, api_key_generated_at = NOW(), updated_at = NOW()
       WHERE bank_id = $1`,
      [bankId, apiKeyHash, preview],
    );

    await this.dataSource.transaction((manager) =>
      this.auditLogsService.record(manager, {
        memberId: userId,
        actionType: 'bank.api_key_regenerate',
        affectedTable: 'banks',
        affectedRecordId: bankId,
        newValue: { preview },
        ipAddress,
      }),
    );

    return {
      apiKey,
      preview,
      message:
        'This key is shown only once — store it now. Regenerating it invalidates the previous key.',
    };
  }

  async configureWebhook(
    userId: number,
    data: ConfigureWebhookDto,
    ipAddress: string | null = null,
  ) {
    const bankId = await this.getAssignedBankId(userId);

    const webhookSecret = crypto.randomBytes(24).toString('hex');

    await this.dataSource.query(
      `UPDATE banks
       SET webhook_url = $2, webhook_secret = $3, webhook_secret_generated_at = NOW(), updated_at = NOW()
       WHERE bank_id = $1`,
      [bankId, data.webhookUrl, webhookSecret],
    );

    await this.dataSource.transaction((manager) =>
      this.auditLogsService.record(manager, {
        memberId: userId,
        actionType: 'bank.webhook_configure',
        affectedTable: 'banks',
        affectedRecordId: bankId,
        newValue: { webhookUrl: data.webhookUrl },
        ipAddress,
      }),
    );

    return {
      webhookUrl: data.webhookUrl,
      webhookSecret,
      message:
        'This signing secret is shown only once — store it now. Reconfiguring the webhook issues a new one.',
    };
  }

  async testConnection(userId: number) {
    const bankId = await this.getAssignedBankId(userId);

    const [bank] = await this.dataSource.query<
      { api_endpoint: string | null }[]
    >(`SELECT api_endpoint FROM banks WHERE bank_id = $1`, [bankId]);

    if (!bank?.api_endpoint) {
      throw new BadRequestException(
        'No API endpoint is configured for this bank yet',
      );
    }

    const startedAt = Date.now();
    let success = false;
    let responseStatus: number | null = null;
    let message: string;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(bank.api_endpoint, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeout);

      responseStatus = response.status;
      success = response.ok;
      message = success
        ? `Reached ${bank.api_endpoint} in ${Date.now() - startedAt}ms`
        : `Endpoint responded with HTTP ${response.status}`;
    } catch (err) {
      message = err instanceof Error ? err.message : 'Connection failed';
    }

    await this.dataSource.query(
      `INSERT INTO bank_api_access_logs
         (bank_id, actor_id, event_type, endpoint, response_status, success, message)
       VALUES ($1, $2, 'connection_test', $3, $4, $5, $6)`,
      [bankId, userId, bank.api_endpoint, responseStatus, success, message],
    );

    return { success, responseStatus, message };
  }

  // =====================================================
  // Linked Accounts / Fund Account
  // =====================================================

  private async getOrCreateFundAccount(
    manager: EntityManager,
    bankId: number,
    accountType: FundAccountType,
  ): Promise<FundAccountRow> {
    const [existing] = await manager.query<FundAccountRow[]>(
      `SELECT fund_account_id, bank_id, account_type, account_number, balance, reserved_balance, status
       FROM bank_fund_accounts
       WHERE bank_id = $1 AND account_type = $2`,
      [bankId, accountType],
    );

    if (existing) {
      return existing;
    }

    const [created] = await manager.query<FundAccountRow[]>(
      `INSERT INTO bank_fund_accounts (bank_id, account_type, balance, reserved_balance, status)
       VALUES ($1, $2, 0, 0, 'Active')
       RETURNING fund_account_id, bank_id, account_type, account_number, balance, reserved_balance, status`,
      [bankId, accountType],
    );

    return created;
  }

  async listFundAccounts(userId: number) {
    const bankId = await this.getAssignedBankId(userId);

    return this.dataSource.transaction(async (manager) => {
      const accounts = await Promise.all(
        FUND_ACCOUNT_TYPES.map((type) =>
          this.getOrCreateFundAccount(manager, bankId, type),
        ),
      );

      return accounts;
    });
  }

  async createFundTransfer(
    userId: number,
    accountType: string,
    data: FundTransferDto,
    ipAddress: string | null = null,
  ) {
    if (!FUND_ACCOUNT_TYPES.includes(accountType as FundAccountType)) {
      throw new BadRequestException('Unknown fund account type');
    }

    const bankId = await this.getAssignedBankId(userId);

    return this.dataSource.transaction(async (manager) => {
      const account = await this.getOrCreateFundAccount(
        manager,
        bankId,
        accountType as FundAccountType,
      );

      const currentBalance = Number(account.balance);

      if (data.transferType === 'Withdrawal' && data.amount > currentBalance) {
        throw new BadRequestException(
          'Insufficient balance for this withdrawal',
        );
      }

      const balanceAfter =
        data.transferType === 'Deposit'
          ? currentBalance + data.amount
          : currentBalance - data.amount;

      await manager.query(
        `UPDATE bank_fund_accounts SET balance = $2, updated_at = NOW() WHERE fund_account_id = $1`,
        [account.fund_account_id, balanceAfter],
      );

      const [transfer] = await manager.query<FundTransferRow[]>(
        `INSERT INTO bank_fund_transfers
           (fund_account_id, transfer_type, amount, balance_after, reference, description, initiated_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING transfer_id, transfer_type, amount, balance_after, reference, description, created_at`,
        [
          account.fund_account_id,
          data.transferType,
          data.amount,
          balanceAfter,
          data.reference ?? null,
          data.description ?? null,
          userId,
        ],
      );

      await this.auditLogsService.record(manager, {
        memberId: userId,
        actionType: 'bank.fund_transfer',
        affectedTable: 'bank_fund_accounts',
        affectedRecordId: account.fund_account_id,
        newValue: {
          accountType,
          transferType: data.transferType,
          amount: data.amount,
        },
        ipAddress,
      });

      return { account: { ...account, balance: balanceAfter }, transfer };
    });
  }

  async listFundTransfers(
    userId: number,
    accountType: string,
    page: number,
    pageSize: number,
  ) {
    if (!FUND_ACCOUNT_TYPES.includes(accountType as FundAccountType)) {
      throw new BadRequestException('Unknown fund account type');
    }

    const bankId = await this.getAssignedBankId(userId);

    const account = await this.dataSource.transaction((manager) =>
      this.getOrCreateFundAccount(
        manager,
        bankId,
        accountType as FundAccountType,
      ),
    );

    const [{ count: total }] = await this.dataSource.query<{ count: number }[]>(
      `SELECT COUNT(*)::int AS count FROM bank_fund_transfers WHERE fund_account_id = $1`,
      [account.fund_account_id],
    );

    const items = await this.dataSource.query<FundTransferRow[]>(
      `SELECT transfer_id, transfer_type, amount, balance_after, reference, description, created_at
       FROM bank_fund_transfers
       WHERE fund_account_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [account.fund_account_id, pageSize, (page - 1) * pageSize],
    );

    return { items, total, page, pageSize };
  }

  // =====================================================
  // Branches
  // =====================================================

  async listBranches(userId: number) {
    const bankId = await this.getAssignedBankId(userId);

    return this.dataSource.query<BranchRow[]>(
      `SELECT branch_id, branch_code, branch_name, region, district, location, contact_phone, status
       FROM bank_branches
       WHERE bank_id = $1
       ORDER BY branch_name`,
      [bankId],
    );
  }

  // =====================================================
  // Deposits / Withdrawals / Transactions (all bank_transactions,
  // filtered by type/status)
  // =====================================================

  async listTransactions(
    userId: number,
    type: string | undefined,
    status: string | undefined,
    page: number,
    pageSize: number,
  ) {
    const bankId = await this.getAssignedBankId(userId);

    const [{ count: total }] = await this.dataSource.query<{ count: number }[]>(
      `SELECT COUNT(*)::int AS count
       FROM bank_transactions bt
       JOIN member_bank_accounts mba ON mba.member_bank_account_id = bt.member_bank_account_id
       WHERE mba.bank_id = $1
         AND ($2::text IS NULL OR bt.transaction_type = $2)
         AND ($3::text IS NULL OR bt.transaction_status = $3)`,
      [bankId, type ?? null, status ?? null],
    );

    const items = await this.dataSource.query<BankTransactionRow[]>(
      `SELECT bt.bank_transaction_id, bt.transaction_reference, bt.transaction_type,
              bt.amount, bt.transaction_status, bt.transaction_date, mba.account_number
       FROM bank_transactions bt
       JOIN member_bank_accounts mba ON mba.member_bank_account_id = bt.member_bank_account_id
       WHERE mba.bank_id = $1
         AND ($2::text IS NULL OR bt.transaction_type = $2)
         AND ($3::text IS NULL OR bt.transaction_status = $3)
       ORDER BY bt.transaction_date DESC
       LIMIT $4 OFFSET $5`,
      [bankId, type ?? null, status ?? null, pageSize, (page - 1) * pageSize],
    );

    return { items, total, page, pageSize };
  }

  async exportTransactionsCsv(
    userId: number,
    type: string | undefined,
    status: string | undefined,
  ): Promise<string> {
    const bankId = await this.getAssignedBankId(userId);

    const rows = await this.dataSource.query<BankTransactionRow[]>(
      `SELECT bt.bank_transaction_id, bt.transaction_reference, bt.transaction_type,
              bt.amount, bt.transaction_status, bt.transaction_date, mba.account_number
       FROM bank_transactions bt
       JOIN member_bank_accounts mba ON mba.member_bank_account_id = bt.member_bank_account_id
       WHERE mba.bank_id = $1
         AND ($2::text IS NULL OR bt.transaction_type = $2)
         AND ($3::text IS NULL OR bt.transaction_status = $3)
       ORDER BY bt.transaction_date DESC`,
      [bankId, type ?? null, status ?? null],
    );

    const header = 'Transaction ID,Reference,Account,Type,Amount,Status,Date';
    const lines = rows.map((row) =>
      [
        row.bank_transaction_id,
        row.transaction_reference,
        row.account_number,
        row.transaction_type,
        row.amount,
        row.transaction_status,
        new Date(row.transaction_date).toISOString(),
      ]
        .map((value) => `"${String(value).replace(/"/g, '""')}"`)
        .join(','),
    );

    return [header, ...lines].join('\n');
  }

  // Withdrawal approval — real, tenant-scoped, audit-logged and notifies
  // the member, but bank_transactions has no writer yet (no Member-side
  // withdrawal-request flow exists), so there's nothing to act on until
  // that's built. Same honest shape as the rest of this pass.
  async updateTransactionStatus(
    userId: number,
    transactionId: number,
    data: UpdateTransactionStatusDto,
    ipAddress: string | null = null,
  ) {
    const bankId = await this.getAssignedBankId(userId);

    return this.dataSource.transaction(async (manager) => {
      const [transaction] = await manager.query<
        (BankTransactionRow & { member_id: number; bank_id: number })[]
      >(
        `SELECT bt.bank_transaction_id, bt.transaction_reference, bt.transaction_type,
                bt.amount, bt.transaction_status, bt.transaction_date, mba.account_number,
                mba.member_id, mba.bank_id
         FROM bank_transactions bt
         JOIN member_bank_accounts mba ON mba.member_bank_account_id = bt.member_bank_account_id
         WHERE bt.bank_transaction_id = $1`,
        [transactionId],
      );

      if (!transaction) {
        throw new NotFoundException('Transaction not found');
      }

      if (transaction.bank_id !== bankId) {
        throw new ForbiddenException(
          'That transaction does not belong to your bank',
        );
      }

      const previousStatus = transaction.transaction_status;

      await manager.query(
        `UPDATE bank_transactions SET transaction_status = $2 WHERE bank_transaction_id = $1`,
        [transactionId, data.status],
      );

      await this.auditLogsService.record(manager, {
        memberId: userId,
        actionType: 'bank.transaction_status_change',
        affectedTable: 'bank_transactions',
        affectedRecordId: transactionId,
        oldValue: { status: previousStatus },
        newValue: { status: data.status },
        ipAddress,
      });

      await this.notificationsService.create(manager, {
        memberId: transaction.member_id,
        notificationType: 'Contribution',
        title: `${transaction.transaction_type} ${data.status.toLowerCase()}`,
        message: `Your ${transaction.transaction_type.toLowerCase()} of ${formatTsh(Number(transaction.amount))} (ref ${transaction.transaction_reference}) is now ${data.status.toLowerCase()}.`,
      });

      return { ...transaction, transaction_status: data.status };
    });
  }

  // =====================================================
  // Settlements
  // =====================================================

  async createSettlement(
    userId: number,
    data: CreateSettlementDto,
    ipAddress: string | null = null,
  ) {
    const bankId = await this.getAssignedBankId(userId);

    return this.dataSource.transaction(async (manager) => {
      const settlementAccount = await this.getOrCreateFundAccount(
        manager,
        bankId,
        'Settlement',
      );

      const available =
        Number(settlementAccount.balance) -
        Number(settlementAccount.reserved_balance);

      if (data.amount > available) {
        throw new BadRequestException(
          `Insufficient available balance in the Settlement account (available: ${formatTsh(available)})`,
        );
      }

      await manager.query(
        `UPDATE bank_fund_accounts
         SET reserved_balance = reserved_balance + $2, updated_at = NOW()
         WHERE fund_account_id = $1`,
        [settlementAccount.fund_account_id, data.amount],
      );

      const [settlement] = await manager.query<SettlementRow[]>(
        `INSERT INTO settlements
           (bank_id, counterparty_type, counterparty_name, telecom_operator_id, hospital_id, amount, settlement_status, initiated_by)
         VALUES ($1, $2, $3, $4, $5, $6, 'Pending', $7)
         RETURNING settlement_id, counterparty_type, counterparty_name, amount, settlement_status, settlement_date`,
        [
          bankId,
          data.counterpartyType,
          data.counterpartyName,
          data.telecomOperatorId ?? null,
          data.hospitalId ?? null,
          data.amount,
          userId,
        ],
      );

      await this.auditLogsService.record(manager, {
        memberId: userId,
        actionType: 'bank.settlement_create',
        affectedTable: 'settlements',
        affectedRecordId: settlement.settlement_id,
        newValue: {
          counterpartyName: data.counterpartyName,
          amount: data.amount,
        },
        ipAddress,
      });

      return settlement;
    });
  }

  async completeSettlement(
    userId: number,
    settlementId: number,
    ipAddress: string | null = null,
  ) {
    const bankId = await this.getAssignedBankId(userId);

    return this.dataSource.transaction(async (manager) => {
      const [settlement] = await manager.query<SettlementRow[]>(
        `SELECT settlement_id, counterparty_type, counterparty_name, amount, settlement_status, settlement_date
         FROM settlements
         WHERE settlement_id = $1 AND bank_id = $2`,
        [settlementId, bankId],
      );

      if (!settlement) {
        throw new NotFoundException('Settlement not found');
      }

      if (settlement.settlement_status !== 'Pending') {
        throw new BadRequestException(
          'Only a pending settlement can be completed',
        );
      }

      const settlementAccount = await this.getOrCreateFundAccount(
        manager,
        bankId,
        'Settlement',
      );
      const amount = Number(settlement.amount);

      await manager.query(
        `UPDATE bank_fund_accounts
         SET balance = balance - $2, reserved_balance = reserved_balance - $2, updated_at = NOW()
         WHERE fund_account_id = $1`,
        [settlementAccount.fund_account_id, amount],
      );

      await manager.query(
        `INSERT INTO bank_fund_transfers
           (fund_account_id, transfer_type, amount, balance_after, reference, description, initiated_by)
         VALUES ($1, 'Settlement Out', $2, $3, $4, $5, $6)`,
        [
          settlementAccount.fund_account_id,
          amount,
          Number(settlementAccount.balance) - amount,
          `SETTLEMENT-${settlementId}`,
          `Settlement paid to ${settlement.counterparty_name}`,
          userId,
        ],
      );

      await manager.query(
        `UPDATE settlements SET settlement_status = 'Completed' WHERE settlement_id = $1`,
        [settlementId],
      );

      await this.auditLogsService.record(manager, {
        memberId: userId,
        actionType: 'bank.settlement_complete',
        affectedTable: 'settlements',
        affectedRecordId: settlementId,
        newValue: { status: 'Completed' },
        ipAddress,
      });

      return { ...settlement, settlement_status: 'Completed' };
    });
  }

  async listSettlements(
    userId: number,
    status: string | undefined,
    counterpartyType: string | undefined,
  ) {
    const bankId = await this.getAssignedBankId(userId);

    return this.dataSource.query<SettlementRow[]>(
      `SELECT settlement_id, counterparty_type, counterparty_name, amount, settlement_status, settlement_date
       FROM settlements
       WHERE bank_id = $1
         AND ($2::text IS NULL OR settlement_status = $2)
         AND ($3::text IS NULL OR counterparty_type = $3)
       ORDER BY settlement_date DESC`,
      [bankId, status ?? null, counterpartyType ?? null],
    );
  }

  // =====================================================
  // Reconciliation — three-way match (Matched / Discrepancy / Unmatched)
  // since the spec calls out Discrepancies distinctly from Bank's
  // reconciliation, unlike Telecom's binary version.
  // =====================================================

  async createReconciliationRun(userId: number, data: UploadReconciliationDto) {
    const bankId = await this.getAssignedBankId(userId);

    return this.dataSource.transaction(async (manager) => {
      let matchedCount = 0;
      let unmatchedCount = 0;

      const [run] = await manager.query<{ run_id: number }[]>(
        `INSERT INTO bank_reconciliation_runs
           (bank_id, initiated_by, total_uploaded, matched_count, unmatched_count)
         VALUES ($1, $2, $3, 0, 0)
         RETURNING run_id`,
        [bankId, userId, data.records.length],
      );

      for (const record of data.records) {
        const [exactMatch] = await manager.query<
          { bank_transaction_id: number }[]
        >(
          `SELECT bt.bank_transaction_id
           FROM bank_transactions bt
           JOIN member_bank_accounts mba ON mba.member_bank_account_id = bt.member_bank_account_id
           WHERE mba.bank_id = $1 AND bt.transaction_reference = $2 AND bt.amount = $3
           LIMIT 1`,
          [bankId, record.externalReference, record.amount],
        );

        let matchStatus: string;
        let matchedTransactionId: number | null = null;
        let discrepancyNotes: string | null = null;

        if (exactMatch) {
          matchStatus = 'Matched';
          matchedTransactionId = exactMatch.bank_transaction_id;
          matchedCount += 1;
        } else {
          const [refMatch] = await manager.query<
            { bank_transaction_id: number; amount: string }[]
          >(
            `SELECT bt.bank_transaction_id, bt.amount
             FROM bank_transactions bt
             JOIN member_bank_accounts mba ON mba.member_bank_account_id = bt.member_bank_account_id
             WHERE mba.bank_id = $1 AND bt.transaction_reference = $2
             LIMIT 1`,
            [bankId, record.externalReference],
          );

          if (refMatch) {
            matchStatus = 'Discrepancy';
            matchedTransactionId = refMatch.bank_transaction_id;
            discrepancyNotes = `Uploaded amount ${record.amount} does not match HSIMS amount ${refMatch.amount}`;
          } else {
            matchStatus = 'Unmatched';
          }

          unmatchedCount += 1;
        }

        await manager.query(
          `INSERT INTO bank_reconciliation_records
             (run_id, external_reference, amount, record_date, matched_bank_transaction_id, match_status, discrepancy_notes)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            run.run_id,
            record.externalReference,
            record.amount,
            record.recordDate ?? null,
            matchedTransactionId,
            matchStatus,
            discrepancyNotes,
          ],
        );
      }

      await manager.query(
        `UPDATE bank_reconciliation_runs SET matched_count = $2, unmatched_count = $3 WHERE run_id = $1`,
        [run.run_id, matchedCount, unmatchedCount],
      );

      await this.auditLogsService.record(manager, {
        memberId: userId,
        actionType: 'bank_reconciliation.run',
        affectedTable: 'bank_reconciliation_runs',
        affectedRecordId: run.run_id,
        newValue: {
          totalUploaded: data.records.length,
          matchedCount,
          unmatchedCount,
        },
      });

      return {
        runId: run.run_id,
        totalUploaded: data.records.length,
        matchedCount,
        unmatchedCount,
      };
    });
  }

  async listReconciliationRuns(userId: number) {
    const bankId = await this.getAssignedBankId(userId);

    return this.dataSource.query<ReconciliationRunRow[]>(
      `SELECT run_id, total_uploaded, matched_count, unmatched_count, run_date
       FROM bank_reconciliation_runs
       WHERE bank_id = $1
       ORDER BY run_date DESC`,
      [bankId],
    );
  }

  async getReconciliationRun(userId: number, runId: number) {
    const bankId = await this.getAssignedBankId(userId);

    const [run] = await this.dataSource.query<ReconciliationRunRow[]>(
      `SELECT run_id, total_uploaded, matched_count, unmatched_count, run_date
       FROM bank_reconciliation_runs
       WHERE run_id = $1 AND bank_id = $2`,
      [runId, bankId],
    );

    if (!run) {
      throw new NotFoundException('Reconciliation run not found');
    }

    const records = await this.dataSource.query<ReconciliationRecordRow[]>(
      `SELECT record_id, external_reference, amount, record_date, matched_bank_transaction_id, match_status, discrepancy_notes
       FROM bank_reconciliation_records
       WHERE run_id = $1
       ORDER BY record_id`,
      [runId],
    );

    return { ...run, records };
  }

  // =====================================================
  // Reports
  // =====================================================

  async getReports(userId: number, period: 'daily' | 'weekly' | 'monthly') {
    const bankId = await this.getAssignedBankId(userId);

    const truncUnit =
      period === 'daily' ? 'day' : period === 'weekly' ? 'week' : 'month';

    const buckets = await this.dataSource.query<
      { bucket: Date; transaction_type: string; count: number; total: string }[]
    >(
      `SELECT date_trunc($2, bt.transaction_date) AS bucket, bt.transaction_type,
              COUNT(*)::int AS count, COALESCE(SUM(bt.amount), 0) AS total
       FROM bank_transactions bt
       JOIN member_bank_accounts mba ON mba.member_bank_account_id = bt.member_bank_account_id
       WHERE mba.bank_id = $1
       GROUP BY bucket, bt.transaction_type
       ORDER BY bucket DESC
       LIMIT 24`,
      [bankId, truncUnit],
    );

    const settlementTotals = await this.dataSource.query<
      { settlement_status: string; count: number; total: string }[]
    >(
      `SELECT settlement_status, COUNT(*)::int AS count, COALESCE(SUM(amount), 0) AS total
       FROM settlements
       WHERE bank_id = $1
       GROUP BY settlement_status`,
      [bankId],
    );

    return { period, buckets, settlementTotals };
  }

  // =====================================================
  // Audit & Security
  // =====================================================

  // Scoped to (a) this bank's own profile changes and (b) actions this
  // specific staff member took — not every action on every settlement/
  // transaction row, since affected_record_id there is a settlement/
  // transaction id, not a bank id, and can't be tenant-checked without
  // a join. Same deliberately-narrow shape as TelecomService's version.
  async listActivityLogs(userId: number) {
    const bankId = await this.getAssignedBankId(userId);

    return this.dataSource.query<ActivityLogRow[]>(
      `SELECT audit_id, member_id, action_type, affected_table, affected_record_id, ip_address, created_at
       FROM audit_logs
       WHERE (affected_table = 'banks' AND affected_record_id = $1)
          OR member_id = $2
       ORDER BY created_at DESC
       LIMIT 100`,
      [bankId, userId],
    );
  }

  async listApiAccessLogs(userId: number) {
    const bankId = await this.getAssignedBankId(userId);

    return this.dataSource.query<ApiAccessLogRow[]>(
      `SELECT log_id, event_type, endpoint, response_status, success, message, created_at
       FROM bank_api_access_logs
       WHERE bank_id = $1
       ORDER BY created_at DESC
       LIMIT 100`,
      [bankId],
    );
  }
}
