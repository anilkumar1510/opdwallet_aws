import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WalletService } from './wallet.service';
import { UserWallet, UserWalletSchema } from './schemas/user-wallet.schema';
import { WalletTransaction, WalletTransactionSchema } from './schemas/wallet-transaction.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserWallet.name, schema: UserWalletSchema },
      { name: WalletTransaction.name, schema: WalletTransactionSchema },
    ]),
  ],
  providers: [WalletService],
  exports: [WalletService],
})
export class WalletModule {}