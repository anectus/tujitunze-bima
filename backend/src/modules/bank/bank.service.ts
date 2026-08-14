import { ForbiddenException, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

interface BankTransactionRow {
  bank_transaction_id: number;
  transaction_reference: string;
  transaction_type: string;
  amount: string;
  transaction_status: string;
  transaction_date: Date;
  account_number: string;
}

@Injectable()
export class BankService {
  constructor(private readonly dataSource: DataSource) {}

  async getDashboard(userId: number) {
    const bankId = await this.getAssignedBankId(userId);

    const [bank] = await this.dataSource.query<
      { bank_name: string; status: string }[]
    >(`SELECT bank_name, status FROM banks WHERE bank_id = $1`, [bankId]);

    const [{ count: linkedAccountCount }] = await this.dataSource.query<
      { count: number }[]
    >(
      `SELECT COUNT(*)::int AS count
       FROM member_bank_accounts
       WHERE bank_id = $1`,
      [bankId],
    );

    const [{ count: transactionCount, total: transactionTotal }] =
      await this.dataSource.query<{ count: number; total: string }[]>(
        `SELECT COUNT(*)::int AS count, COALESCE(SUM(bt.amount), 0) AS total
         FROM bank_transactions bt
         JOIN member_bank_accounts mba
           ON mba.member_bank_account_id = bt.member_bank_account_id
         WHERE mba.bank_id = $1`,
        [bankId],
      );

    const recentTransactions = await this.dataSource.query<
      BankTransactionRow[]
    >(
      `SELECT bt.bank_transaction_id, bt.transaction_reference,
              bt.transaction_type, bt.amount, bt.transaction_status,
              bt.transaction_date, mba.account_number
       FROM bank_transactions bt
       JOIN member_bank_accounts mba
         ON mba.member_bank_account_id = bt.member_bank_account_id
       WHERE mba.bank_id = $1
       ORDER BY bt.transaction_date DESC
       LIMIT 5`,
      [bankId],
    );

    return {
      bank: { name: bank?.bank_name ?? null, status: bank?.status ?? null },
      linkedAccountCount,
      transactionCount,
      transactionTotal,
      recentTransactions: recentTransactions.map((row) => ({
        transactionId: row.bank_transaction_id,
        reference: row.transaction_reference,
        type: row.transaction_type,
        amount: row.amount,
        status: row.transaction_status,
        date: row.transaction_date,
        accountNumber: row.account_number,
      })),
    };
  }

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
}
