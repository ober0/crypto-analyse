import { Module } from '@nestjs/common';
import { TickersProcessingService } from './tickers-processing.service';

@Module({
  providers: [TickersProcessingService]
})
export class TickersProcessingModule {}
