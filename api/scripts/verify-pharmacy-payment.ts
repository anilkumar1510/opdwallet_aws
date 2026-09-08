/**
 * Does a completed pharmacy payment actually reach the order?
 *
 * Boots the app for real and calls the same PaymentService.markAsPaid the
 * member's pay button ends at, then reads the order back. Throwaway check for
 * the dispatcher wiring — pharmacy was the one service type missing from it.
 */
import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { AppModule } from '../src/app.module';
import { PaymentService } from '../src/modules/payments/payment.service';

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
  const orderModel: any = app.get(getModelToken('PharmacyOrder'));
  const paymentModel: any = app.get(getModelToken('Payment'));
  const payments = app.get(PaymentService);

  const orderId = process.argv[2];
  const before = await orderModel.findOne({ orderId });
  console.log('BEFORE', before.orderId, before.status, before.paymentStatus, before.paymentId);

  // Rewind so the run is repeatable.
  await paymentModel.updateOne({ paymentId: before.paymentId }, { $set: { status: 'PENDING' } });

  await payments.markAsPaid(before.paymentId, before.userId.toString());

  const after = await orderModel.findOne({ orderId });
  console.log('AFTER ', after.orderId, after.status, after.paymentStatus);
  console.log(after.paymentStatus === 'COMPLETED' ? 'PASS' : 'FAIL');
  await app.close();
}
main().catch((e) => {
  console.error('ERR', e.message);
  process.exit(1);
});
