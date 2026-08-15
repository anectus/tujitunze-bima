import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

// Proves the rate-limit guards CLAUDE.md's Known Security Gaps called out
// as missing (#1: /auth/login, /members/register, /members/phone-numbers;
// #9/#10: /super-admin/administrators, /super-admin/roles*) actually
// fire, rather than just asserting the @Throttle() decorator is present.
// Every body below is deliberately invalid so the ValidationPipe rejects
// it with 400/401 before any DB write happens — the point here is the
// request *count* against each route's bucket, not what the handler does
// with it. ThrottlerGuard runs before validation, so an invalid body
// still consumes one hit. Unlike the app's other e2e specs, this one
// applies the same global ValidationPipe main.ts does — without it,
// class-validator never runs and an empty body reaches the service layer
// unchecked (e.g. createRole's dto.roleName.trim() on undefined),
// producing 500s that would otherwise mask what's actually being tested
// here.
describe('Rate limiting (e2e)', () => {
  let app: INestApplication<App>;
  let jwtService: JwtService;

  const signToken = (userId: number, roles: string[], firstName: string) =>
    jwtService.sign({ sub: userId, roles, firstName });

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    jwtService = app.get(JwtService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('throttles POST /auth/login at 5/min per IP', async () => {
    const statuses: number[] = [];

    for (let i = 0; i < 6; i++) {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ identifier: 'no-such-user@test.local', password: 'wrong' });
      statuses.push(response.status);
    }

    expect(statuses.slice(0, 5)).toEqual([401, 401, 401, 401, 401]);
    expect(statuses[5]).toBe(429);
  });

  it('throttles POST /members/register at 5/min per IP', async () => {
    const statuses: number[] = [];

    for (let i = 0; i < 6; i++) {
      const response = await request(app.getHttpServer())
        .post('/members/register')
        .send({});
      statuses.push(response.status);
    }

    expect(statuses.slice(0, 5)).toEqual([400, 400, 400, 400, 400]);
    expect(statuses[5]).toBe(429);
  });

  it('throttles POST /members/phone-numbers at 10/min per IP', async () => {
    const token = signToken(999999, ['Member'], 'RateLimitTest');
    const statuses: number[] = [];

    for (let i = 0; i < 11; i++) {
      const response = await request(app.getHttpServer())
        .post('/members/phone-numbers')
        .set('Authorization', `Bearer ${token}`)
        .send({});
      statuses.push(response.status);
    }

    expect(statuses.slice(0, 10)).toEqual(new Array(10).fill(400));
    expect(statuses[10]).toBe(429);
  });

  it('throttles POST /super-admin/administrators at 20/min per IP', async () => {
    const token = signToken(999999, ['Super-admin'], 'RateLimitTest');
    const statuses: number[] = [];

    for (let i = 0; i < 21; i++) {
      const response = await request(app.getHttpServer())
        .post('/super-admin/administrators')
        .set('Authorization', `Bearer ${token}`)
        .send({});
      statuses.push(response.status);
    }

    expect(statuses.slice(0, 20)).toEqual(new Array(20).fill(400));
    expect(statuses[20]).toBe(429);
  });

  it('throttles POST /super-admin/roles at 30/min per IP', async () => {
    const token = signToken(999999, ['Super-admin'], 'RateLimitTest');
    const statuses: number[] = [];

    for (let i = 0; i < 31; i++) {
      const response = await request(app.getHttpServer())
        .post('/super-admin/roles')
        .set('Authorization', `Bearer ${token}`)
        .send({});
      statuses.push(response.status);
    }

    expect(statuses.slice(0, 30)).toEqual(new Array(30).fill(400));
    expect(statuses[30]).toBe(429);
  });
});
