import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity({ name: 'contribution_rules' })
export class ContributionRule {
  @PrimaryGeneratedColumn({ name: 'rule_id' })
  ruleId: number;

  @Column({ name: 'rule_name', unique: true })
  ruleName: string;

  @Column({ name: 'source_type' })
  sourceType: string;

  @Column({ name: 'calculation_type' })
  calculationType: string;

  @Column({ name: 'fixed_amount', type: 'numeric', precision: 15, scale: 2, nullable: true })
  fixedAmount?: string;

  @Column({ name: 'percentage_rate', type: 'numeric', precision: 8, scale: 5, nullable: true })
  percentageRate?: string;

  @Column({ name: 'maximum_contribution_amount', type: 'numeric', precision: 15, scale: 2, nullable: true })
  maximumContributionAmount?: string;

  @Column({ name: 'status', default: 'ACTIVE' })
  status: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
