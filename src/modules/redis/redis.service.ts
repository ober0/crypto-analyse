import { Inject, Injectable, Logger } from "@nestjs/common";
import * as Redis from "ioredis";

@Injectable()
export class RedisService {
    private readonly logger = new Logger("RedisService");

    constructor(@Inject("REDIS_CLIENT") private readonly redisClient: Redis.Redis) {}
    async set(key: string, value: string | number, ttl?: number): Promise<void> {
        try {
            if (ttl) {
                await this.redisClient.set(key, value, "EX", ttl);
            } else {
                await this.redisClient.set(key, value);
            }
        } catch (error) {
            this.logger.error(`Ошибка при записи в Redis для ключа: ${key}`, error);
        }
    }

    async get(key: string): Promise<string | number | null> {
        try {
            const result = await this.redisClient.get(key);
            return result ? (isNaN(Number(result)) ? result : Number(result)) : null;
        } catch (error) {
            this.logger.error(`Ошибка при получении из Redis для ключа: ${key}`, error);
            return null;
        }
    }

    async del(key: string | string[]): Promise<number | number[]> {
        if (typeof key === "string") {
            return this.redisClient.del(key);
        } else {
            const data: number[] = await Promise.all(key.map(async (key: string) => this.redisClient.del(key)));
            return data;
        }
    }

    async incrementWithTTL(key: string, incrementBy: number = 1, ttl?: number): Promise<number> {
        try {
            const newValue = await this.redisClient.incrby(key, incrementBy);

            if (ttl) {
                await this.redisClient.expire(key, ttl);
            }

            return newValue;
        } catch (error) {
            this.logger.error(`Ошибка при увеличении значения с TTL в Redis для ключа: ${key}`, error);
            throw error;
        }
    }

    async scanKeysByPrefix(prefix: string) {
        let cursor = "0";
        const foundKeys: string[] = [];

        do {
            const [nextCursor, keys] = await this.redisClient.scan(cursor, "MATCH", prefix, "COUNT", 100);
            cursor = nextCursor;
            foundKeys.push(...keys);
        } while (cursor !== "0");

        return foundKeys;
    }
}
