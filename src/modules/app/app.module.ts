import { Module } from "@nestjs/common";

import { PrismaModule } from "../prisma/prisma.module";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from "../auth/auth.module";
import { UserModule } from "../user/user.module";
import { CryptModule } from "../crypt/crypt.module";
import { RedisModule } from "../redis/redis.module";

@Module({
    imports: [PrismaModule, ConfigModule.forRoot({ isGlobal: true }), UserModule, AuthModule, CryptModule, RedisModule]
})
export class AppModule {}
