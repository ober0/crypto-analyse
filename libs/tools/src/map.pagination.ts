import { PaginationDto } from "@app/common-dto/pagination.dto";

export const mapPagination = (dto?: PaginationDto) => {
    return {
        take: dto?.count,
        skip: dto?.page ? (dto.page - 1) * dto.count : undefined
    };
};
