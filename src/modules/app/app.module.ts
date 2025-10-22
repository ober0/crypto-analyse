import { Module } from "@nestjs/common";

import { PrismaModule } from "../prisma/prisma.module";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from "../auth/auth.module";
import { UserModule } from "../user/user.module";
import { TickersModule } from "../tickers/tickers.module";
import { ChatgptModule } from "../chatgpt/chatgpt.module";
import { TickerResultsModule } from "../ticker-results/ticker-results.module";
import { TickersProcessingModule } from "../tickers-processing/tickers-processing.module";

@Module({
    imports: [
        PrismaModule,
        ConfigModule.forRoot({ isGlobal: true }),
        UserModule,
        AuthModule,
        TickersModule,
        ChatgptModule,
        TickerResultsModule,
        TickersProcessingModule
    ]
})
export class AppModule {}
