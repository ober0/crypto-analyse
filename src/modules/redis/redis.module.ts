import { Module, Global } from "@nestjs/common";
import Redis from "ioredis";
import { RedisService } from "./redis.service";

@Global()
@Module({
    providers: [
        {
            provide: "REDIS_CLIENT",
            useFactory: () => {
                const redisUrl = process.env.REDIS_URL;

                if (!redisUrl) {
                    throw new Error("Не указан REDIS_URL");
                }

                return new Redis(redisUrl);
            }
        },
        RedisService
    ],
    exports: ["REDIS_CLIENT", RedisService]
})
export class RedisModule {}
