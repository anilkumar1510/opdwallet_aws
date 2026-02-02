import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../../app.module';
import { DoctorClinicAssignmentsService } from '../doctor-clinic-assignments.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Doctor, DoctorDocument } from '../../doctors/schemas/doctor.schema';
import { Clinic, ClinicDocument } from '../../clinics/schemas/clinic.schema';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('MigrateDoctorClinics');
  const app = await NestFactory.createApplicationContext(AppModule);

  const assignmentsService = app.get(DoctorClinicAssignmentsService);
  const doctorModel = app.get<Model<DoctorDocument>>('DoctorModel');
  const clinicModel = app.get<Model<ClinicDocument>>('ClinicModel');

  let created = 0;
  let skipped = 0;
  let errors = 0;

  try {
    logger.log('Starting doctor-clinic assignments migration...');

    // Fetch all doctors with non-empty clinics array
    const doctors = await doctorModel.find({
      clinics: { $exists: true, $ne: [] }
    }).exec();

    logger.log(`Found ${doctors.length} doctors with clinic assignments`);

    for (const doctor of doctors) {
      if (!doctor.clinics || doctor.clinics.length === 0) {
        continue;
      }

      logger.log(`Processing doctor ${doctor.doctorId} with ${doctor.clinics.length} clinics...`);

      for (const clinicRef of doctor.clinics) {
        const clinicId = clinicRef.clinicId;

        try {
          // Verify clinic exists
          const clinic = await clinicModel.findOne({ clinicId }).exec();
          if (!clinic) {
            logger.warn(`Clinic ${clinicId} not found, skipping...`);
            skipped++;
            continue;
          }

          // Try to create assignment
          await assignmentsService.assignClinic(
            doctor.doctorId,
            clinicId,
            'MIGRATION_SCRIPT'
          );
          created++;
          logger.log(`✓ Created assignment: ${doctor.doctorId} -> ${clinicId}`);
        } catch (error) {
          if (error.message?.includes('already assigned')) {
            logger.log(`○ Assignment already exists: ${doctor.doctorId} -> ${clinicId}`);
            skipped++;
          } else {
            logger.error(`✗ Error assigning ${clinicId} to ${doctor.doctorId}: ${error.message}`);
            errors++;
          }
        }
      }
    }

    logger.log('\n=== Migration Summary ===');
    logger.log(`Total assignments created: ${created}`);
    logger.log(`Total assignments skipped: ${skipped}`);
    logger.log(`Total errors: ${errors}`);
    logger.log('=========================\n');

    if (errors === 0) {
      logger.log('Migration completed successfully!');
    } else {
      logger.warn(`Migration completed with ${errors} errors. Please review the logs.`);
    }

  } catch (error) {
    logger.error('Migration failed:', error);
    throw error;
  } finally {
    await app.close();
  }
}

bootstrap()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Migration error:', err);
    process.exit(1);
  });
