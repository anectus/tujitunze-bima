import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      const allowed =
        !origin ||
        /^http:\/\/localhost:\d+$/.test(origin) ||
        origin === process.env.FRONTEND_URL;

      callback(allowed ? null : new Error('Not allowed by CORS'), allowed);
    },
  });
  await app.listen(process.env.PORT ?? 3002);
}
bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
