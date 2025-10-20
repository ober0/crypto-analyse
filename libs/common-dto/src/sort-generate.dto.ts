import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsOptional } from "class-validator";
import { SortTypes } from "@app/common-dto/sort-types.dto";

type Constructor<T> = new (...args: unknown[]) => T;

interface SortDtoInputType<T extends object> {
    itemClass: Constructor<T>;
    excludedValue?: (keyof T)[];
    includedValue?: (keyof T)[];
}

export function SortDtoGenerator<T extends object>(data: SortDtoInputType<T>) {
    class SortDto {}

    const instance = new data.itemClass();
    const keys = Object.keys(instance) as (keyof T)[];

    keys.forEach((key) => {
        const shouldInclude =
            (data.includedValue && data.includedValue.includes(key)) ||
            (data.excludedValue && !data.excludedValue.includes(key)) ||
            (!data.includedValue && !data.excludedValue);

        if (shouldInclude) {
            Object.defineProperty(SortDto.prototype, key, {
                value: undefined,
                writable: true,
                enumerable: true,
                configurable: true
            });

            ApiProperty({ enum: SortTypes, required: false })(SortDto.prototype, key.toString());
            IsOptional()(SortDto.prototype, key.toString());
            IsEnum(SortTypes)(SortDto.prototype, key.toString());
        }
    });

    return SortDto as new () => {
        [K in keyof T]?: SortTypes;
    };
}
