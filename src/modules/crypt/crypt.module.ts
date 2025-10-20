import { Module } from '@nestjs/common'
import { CryptService } from 'src/modules/crypt/crypt.service'

@Module({
    exports: [CryptService],
    providers: [CryptService]
})
export class CryptModule {}
