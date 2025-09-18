/**
 * Migration: Create benefitCoverageMatrix collection
 * Date: 2025-09-18
 * Description: Creates the benefitCoverageMatrix collection with proper indexes
 */

import { Db } from 'mongodb';

export async function up(db: Db): Promise<void> {
  // Create the benefitCoverageMatrix collection
  const collection = await db.createCollection('benefitCoverageMatrix');

  // Create compound unique index on policyId and planVersion
  await collection.createIndex(
    { policyId: 1, planVersion: 1 },
    { unique: true, name: 'policy_version_unique' }
  );

  // Create query optimization indexes
  await collection.createIndex(
    { policyId: 1 },
    { name: 'policy_index' }
  );

  await collection.createIndex(
    { planVersion: 1 },
    { name: 'version_index' }
  );

  console.log('Created benefitCoverageMatrix collection with indexes');
}

export async function down(db: Db): Promise<void> {
  // Drop the collection and all its indexes
  await db.dropCollection('benefitCoverageMatrix');
  console.log('Dropped benefitCoverageMatrix collection');
}