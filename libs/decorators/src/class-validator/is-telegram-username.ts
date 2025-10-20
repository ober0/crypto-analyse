import { registerDecorator, ValidationOptions, ValidationArguments } from "class-validator";

export function IsTelegramUsername(validationOptions?: ValidationOptions) {
    return function (object: object, propertyName: string) {
        registerDecorator({
            name: "isTelegramUsername",
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            validator: {
                validate(value: unknown) {
                    if (typeof value !== "string") {
                        return false;
                    }
                    return /^@[a-zA-Z0-9_]{5,32}$/.test(value);
                },
                defaultMessage() {
                    return "Некорректный Telegram username, Пример: @my_username";
                }
            }
        });
    };
}
