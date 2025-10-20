import { NestFactory } from "@nestjs/core";
import { AppModule } from "./modules/app/app.module";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { ValidationPipe } from "@nestjs/common";
import { NestExpressApplication } from "@nestjs/platform-express";

async function bootstrap() {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);
    const name: string = "base-template";

    app.set("trust proxy", true);
    app.setGlobalPrefix("api");

    app.useGlobalPipes(
        new ValidationPipe({
            transform: true,
            whitelist: true
        })
    );

    const port = process.env.PORT || 3000;

    const config = new DocumentBuilder()
        .setTitle(`${name} API Documentation`)
        .setDescription("Документация для API ${name}")
        .setVersion("0.0.1")
        .addBearerAuth({
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
            name: "JWT",
            description: "Введите JWT токен",
            in: "header"
        })
        .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup("api", app, document, { customSiteTitle: name });

    await app.listen(port);
}

bootstrap();
