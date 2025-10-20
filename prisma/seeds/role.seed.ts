import { PrismaClient, RoleNames } from "@prisma/client";

export async function roleSeed(prisma: PrismaClient) {
    for (const name of Object.keys(RoleNames)) {
        await prisma.role.upsert({
            where: {
                name: name as RoleNames
            },
            update: {},
            create: {
                name: name as RoleNames
            }
        });
    }
}
