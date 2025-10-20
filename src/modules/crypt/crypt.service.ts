import { Injectable, InternalServerErrorException } from "@nestjs/common";
import * as crypto from "crypto";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class CryptService {
    private readonly algorithm = "aes-256-cbc";
    private readonly ivLength = 16;
    private readonly secretKey: Buffer;

    constructor(private readonly configService: ConfigService) {
        const key = this.configService.get<string>("ENCRYPTION_KEY");
        if (!key) {
            throw new InternalServerErrorException("ENCRYPTION_KEY не задан в .env");
        }

        const keyBuffer = Buffer.from(key, "base64");

        if (keyBuffer.length !== 32) {
            throw new InternalServerErrorException(
                "Неверный ENCRYPTION_KEY: ключ должен быть 32 байта после base64-декодирования"
            );
        }

        this.secretKey = keyBuffer;
    }

    encrypt(text: string): string {
        const iv = crypto.randomBytes(this.ivLength);
        const cipher = crypto.createCipheriv(this.algorithm, this.secretKey, iv);
        const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
        return `${iv.toString("hex")}:${encrypted.toString("hex")}`;
    }

    decrypt(encryptedText: string): string {
        const [ivHex, encryptedHex] = encryptedText.split(":");

        if (!ivHex || !encryptedHex) {
            throw new Error("Неверный формат зашифрованной строки");
        }

        const iv = Buffer.from(ivHex, "hex");
        const encrypted = Buffer.from(encryptedHex, "hex");

        const decipher = crypto.createDecipheriv(this.algorithm, this.secretKey, iv);
        const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);

        return decrypted.toString("utf8");
    }
}
