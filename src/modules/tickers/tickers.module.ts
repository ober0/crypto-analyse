import { Module } from "@nestjs/common";
import { TickersController } from "./tickers.controller";
import { TickersService } from "./tickers.service";
import { TickersRepository } from "./tickers.repository";

@Module({
    controllers: [TickersController],
    providers: [TickersService, TickersRepository],
    exports: [TickersService]
})
export class TickersModule {}
