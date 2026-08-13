import { Body, Controller, Post, Req } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';

import { ContactService } from './contact.service';
import { CreateContactMessageDto } from './dto/create-contact-message.dto';
import type { JwtPayload } from '../auth/jwt.strategy';

@Controller('contact')
export class ContactController {
  constructor(
    private readonly contactService: ContactService,
    private readonly jwtService: JwtService,
  ) {}

  @Post()
  async create(@Body() body: CreateContactMessageDto, @Req() request: Request) {
    // Public endpoint — anyone can send a message, logged in or not. If a
    // valid token is present we opportunistically identify the sender so
    // the service can use their verified name/email; an invalid or
    // missing token just means the message is sent as a guest, it never
    // rejects the request the way a guarded route would.
    const memberId = await this.resolveMemberId(request);

    return this.contactService.create(body, memberId, request.ip);
  }

  private async resolveMemberId(request: Request): Promise<number | null> {
    const authHeader = request.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      return null;
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(
        authHeader.slice('Bearer '.length),
      );

      return payload.sub;
    } catch {
      return null;
    }
  }
}
