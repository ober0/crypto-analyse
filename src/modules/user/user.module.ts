import { Global, Module } from "@nestjs/common";
import { UserService } from "./user.service";
import { UserRepository } from "./user.repository";
import { UserController } from './user.controller';

@Global()
@Module({
    providers: [UserService, UserRepository],
    exports: [UserService],
    controllers: [UserController]
})
export class UserModule {}
