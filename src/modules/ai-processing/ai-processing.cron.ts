import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { AiProcessingService } from "./ai-processing.service";

@Injectable()
export class AiProcessingCron {
    private readonly logger: Logger = new Logger("AiProcessingService");

    constructor(private readonly service: AiProcessingService) {}

    // onModuleInit() {
    //     this.actualizeTickerData();
    // }

    @Cron(CronExpression.EVERY_MINUTE)
    async actualizeTickerData() {
        this.logger.debug("Actualizing ticket data start");
        await this.service.actualizeTickerData();
        this.logger.debug("Actualizing ticket data end");
    }
}
