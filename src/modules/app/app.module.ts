import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";

import { PrismaModule } from "../prisma/prisma.module";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from "../auth/auth.module";
import { UserModule } from "../user/user.module";
import { TickersModule } from "../tickers/tickers.module";
import { TickerResultsModule } from "../ticker-results/ticker-results.module";
import { TickersProcessingModule } from "../tickers-processing/tickers-processing.module";
import { ScheduleModule } from "@nestjs/schedule";
import { LoggerMiddleware } from "../../logger/logger.middleware";
import { StatisticsModule } from "../statistics/statistics.module";
import { AiModule } from "../ai/ai.module";

@Module({
    imports: [
        PrismaModule,
        ConfigModule.forRoot({ isGlobal: true }),
        ScheduleModule.forRoot(),
        UserModule,
        AuthModule,
        TickersModule,
        TickerResultsModule,
        TickersProcessingModule,
        StatisticsModule,
        AiModule
    ]
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(LoggerMiddleware).forRoutes("*path");
    }
}
