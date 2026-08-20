"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    app.enableCors({
        origin: (origin, callback) => {
            const allowed = !origin ||
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
//# sourceMappingURL=main.js.map