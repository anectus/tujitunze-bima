import { IsUrl } from 'class-validator';

export class ConfigureWebhookDto {
  @IsUrl({ require_tld: false, require_protocol: true })
  webhookUrl!: string;
}
