import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { AiProcessingService } from "./ai-processing.service";

@Injectable()
export class AiProcessingCron {
    private readonly logger: Logger = new Logger("AiProcessingService");

    constructor(private readonly service: AiProcessingService) {}

    // onModuleInit() {
    //     this.createTrade();
    // }

    @Cron(CronExpression.EVERY_MINUTE)
    async actualizeTickerData() {
        this.logger.debug("Actualizing ticket data start");
        await this.service.actualizeTickerData();
        this.logger.debug("Actualizing ticket data end");
    }

    @Cron("*/5 * * * *")
    async closeBot() {
        this.logger.debug("Close bots process start");
        await this.service.closeBots();
        this.logger.debug("Close bots process end");
    }

    @Cron("*/1 * * * *")
    async createTrade() {
        this.logger.debug("trade creation start");
        await this.service.createTrades();
        this.logger.debug("trade creation end");
    }

    @Cron("*/1 * * * *")
    async processTrade() {
        this.logger.debug("trade processing start");
        await this.service.processTrades();
        this.logger.debug("trade processing end");
    }
}
