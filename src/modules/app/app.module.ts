import { Module } from "@nestjs/common";

import { PrismaModule } from "../prisma/prisma.module";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from "../auth/auth.module";
import { UserModule } from "../user/user.module";
import { CryptModule } from "../crypt/crypt.module";

@Module({
    imports: [PrismaModule, ConfigModule.forRoot({ isGlobal: true }), UserModule, AuthModule, CryptModule]
})
export class AppModule {}
