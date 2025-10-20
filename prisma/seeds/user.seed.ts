import { PrismaClient, RoleNames } from "@prisma/client";
import * as bcrypt from "bcrypt";

const salt = process.env.SALT_ROUNDS;
if (!salt) {
    throw new Error("SALT_ROUNDS не указана в енвах");
}

async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, Number(salt));
}

async function createAdmin(prisma: PrismaClient) {
    const role = await prisma.role.findUnique({
        where: {
            name: RoleNames.Admin
        }
    });
    if (!role) {
        throw new Error("Роль admin не найдена в бд");
    }

    const username = process.env.BASE_ADMIN_USERNAME;
    const password = process.env.BASE_ADMIN_PASSWORD;

    if (!username || !password) {
        throw new Error("В env не указаны данные для администратора");
    }

    const passwordHash = await hashPassword(password);

    await prisma.user.upsert({
        where: {
            username
        },
        create: {
            username,
            password: passwordHash,
            role: {
                connect: {
                    id: role.id
                }
            }
        },
        update: {}
    });
}

export async function userSeed(prisma: PrismaClient) {
    await createAdmin(prisma);
}
