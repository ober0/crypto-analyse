import { PrismaClient } from "@prisma/client";
import { userSeed } from "./user.seed";
import { roleSeed } from "./role.seed";

const prisma = new PrismaClient();

async function main() {
    await roleSeed(prisma);
    console.log("[+] Роли созданы");

    await userSeed(prisma);
    console.log("[+] Пользователи созданы");

    console.log("[+] Все готово");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
