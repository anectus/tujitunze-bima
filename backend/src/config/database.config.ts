import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const databaseConfig = (): TypeOrmModuleOptions => ({
  type: 'postgres',

  host: process.env.DB_HOST || 'localhost',

  port: parseInt(process.env.DB_PORT || '5432', 10),

  username: process.env.DB_USERNAME || 'developer',

  password: process.env.DB_PASSWORD || '',

  database: process.env.DB_DATABASE || 'tujitunze',

  autoLoadEntities: true,

  synchronize: false,

  logging: false,
});