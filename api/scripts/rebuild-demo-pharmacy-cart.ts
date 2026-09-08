/**
 * Rebuilds the open pharmacy cart the way the stand-in adjudicator does, with
 * the varied quantities a prescription actually carries. Used to set up a
 * demo — the running dev API may still be on the old all-ones build.
 */
import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { AppModule } from '../src/app.module';
import { PharmacyCartService } from '../src/modules/pharmacy/services/pharmacy-cart.service';
import { PharmacyCatalogueService } from '../src/modules/pharmacy/services/pharmacy-catalogue.service';

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
  const carts = app.get(PharmacyCartService);
  const catalogue = app.get(PharmacyCatalogueService);
  const cartModel: any = app.get(getModelToken('PharmacyCart'));

  const cart = await cartModel.findOne({ status: 'CREATED' }).sort({ updatedAt: -1 });
  if (!cart) throw new Error('No open cart');

  const medicines = (await catalogue.search(undefined)).filter((m: any) => m.inStock).slice(0, 3);
  const built = await carts.buildCart(
    cart.cartId,
    medicines.map((m: any) => ({ medicineId: m.medicineId, quantity: 3 })),
  );
  console.log(
    built.cartId,
    JSON.stringify(built.items.map((i: any) => [i.name, i.quantity])),
  );
  await app.close();
}
main().catch((e) => {
  console.error('ERR', e.message);
  process.exit(1);
});
