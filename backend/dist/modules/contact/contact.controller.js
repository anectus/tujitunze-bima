"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContactController = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const contact_service_1 = require("./contact.service");
const create_contact_message_dto_1 = require("./dto/create-contact-message.dto");
let ContactController = class ContactController {
    contactService;
    jwtService;
    constructor(contactService, jwtService) {
        this.contactService = contactService;
        this.jwtService = jwtService;
    }
    async create(body, request) {
        const memberId = await this.resolveMemberId(request);
        return this.contactService.create(body, memberId, request.ip);
    }
    async resolveMemberId(request) {
        const authHeader = request.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            return null;
        }
        try {
            const payload = await this.jwtService.verifyAsync(authHeader.slice('Bearer '.length));
            return payload.sub;
        }
        catch {
            return null;
        }
    }
};
exports.ContactController = ContactController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_contact_message_dto_1.CreateContactMessageDto, Object]),
    __metadata("design:returntype", Promise)
], ContactController.prototype, "create", null);
exports.ContactController = ContactController = __decorate([
    (0, common_1.Controller)('contact'),
    __metadata("design:paramtypes", [contact_service_1.ContactService,
        jwt_1.JwtService])
], ContactController);
//# sourceMappingURL=contact.controller.js.map