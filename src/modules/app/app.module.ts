import { Module } from "@nestjs/common";

import { PrismaModule } from "../prisma/prisma.module";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from "../auth/auth.module";
import { UserModule } from "../user/user.module";
import { TickersModule } from "../tickers/tickers.module";
import { ChatgptModule } from "../chatgpt/chatgpt.module";

@Module({
    imports: [
        PrismaModule,
        ConfigModule.forRoot({ isGlobal: true }),
        UserModule,
        AuthModule,
        TickersModule,
        ChatgptModule
    ]
})
export class AppModule {}
