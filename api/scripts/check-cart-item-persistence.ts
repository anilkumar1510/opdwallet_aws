/**
 * Does changing an item's quantity in place actually reach the database?
 *
 * The symptom was a reduced line springing back the moment another line was
 * touched — exactly what a save that writes nothing looks like from the screen.
 */
import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { AppModule } from '../src/app.module';

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
  const model: any = app.get(getModelToken('PharmacyCart'));

  const cart = await model.findOne({ status: 'CREATED' }).sort({ updatedAt: -1 });
  const item = cart.items[0];
  const was = item.quantity;
  console.log('before', item.name, was);

  item.quantity = was + 7;
  await cart.save();

  const reread = await model.findOne({ cartId: cart.cartId });
  const now = reread.items[0].quantity;
  console.log('after save + reread:', now, now === was + 7 ? 'PERSISTED' : 'LOST');

  // Put it back.
  const restore = await model.findOne({ cartId: cart.cartId });
  restore.items[0].quantity = was;
  restore.markModified('items');
  await restore.save();
  await app.close();
}
main().catch((e) => {
  console.error('ERR', e.message);
  process.exit(1);
});
