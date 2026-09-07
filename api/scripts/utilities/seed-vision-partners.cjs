/**
 * Seeds the empanelled vision network — patient-flows flow 3 step 4.
 *
 *   node scripts/utilities/seed-vision-partners.cjs
 *
 * Idempotent: upserts by partnerId, so running it twice changes nothing.
 *
 * Lenskart is here because the Vision Backend tab names it throughout and
 * describes its Insurance Dashboard as where Partner Operations work the order
 * queue. The second partner exists so the picker is a real choice rather than a
 * single disabled option, and to prove the mode filter — Titan Eye+ is IN_STORE
 * only, so the order screen must not offer it an online purchase.
 */
const { MongoClient } = require('mongodb');

const PARTNERS = [
  {
    partnerId: 'VIS-PTR-LENSKART',
    name: 'Lenskart',
    code: 'LENSKART',
    storeUrl: 'https://www.lenskart.com',
    modes: ['ONLINE', 'IN_STORE'],
    description: 'Frames, lenses and contact lenses. Apply your coupon at checkout.',
    isActive: true,
  },
  {
    partnerId: 'VIS-PTR-TITAN',
    name: 'Titan Eye+',
    code: 'TITAN',
    storeUrl: 'https://www.titaneyeplus.com',
    modes: ['IN_STORE'],
    description: 'Visit a Titan Eye+ store with your coupon code.',
    isActive: true,
  },
];

(async () => {
  const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017');
  await client.connect();
  const db = client.db('opd_wallet');
  for (const partner of PARTNERS) {
    const now = new Date();
    await db.collection('vision_partners').updateOne(
      { partnerId: partner.partnerId },
      { $set: { ...partner, updatedAt: now }, $setOnInsert: { createdAt: now } },
      { upsert: true },
    );
    console.log('upserted', partner.partnerId, '-', partner.name);
  }
  console.log('total partners:', await db.collection('vision_partners').countDocuments());
  await client.close();
})();
