import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OperationsController } from './operations.controller';
import { OperationsService } from './operations.service';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Doctor, DoctorSchema } from '../doctors/schemas/doctor.schema';
import { Appointment, AppointmentSchema } from '../appointments/schemas/appointment.schema';
import { LabPrescription, LabPrescriptionSchema } from '../lab/schemas/lab-prescription.schema';
import { LabOrder, LabOrderSchema } from '../lab/schemas/lab-order.schema';
import { WalletModule } from '../wallet/wallet.module';
import { AssignmentsModule } from '../assignments/assignments.module';
import { ClinicServicePricingModule } from './dental-services/clinic-service-pricing.module';
import { DentalBookingsModule } from '../dental-bookings/dental-bookings.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Doctor.name, schema: DoctorSchema },
      { name: Appointment.name, schema: AppointmentSchema },
      { name: LabPrescription.name, schema: LabPrescriptionSchema },
      { name: LabOrder.name, schema: LabOrderSchema },
    ]),
    WalletModule,
    AssignmentsModule,
    ClinicServicePricingModule,
    DentalBookingsModule,
  ],
  controllers: [OperationsController],
  providers: [OperationsService],
  exports: [OperationsService],
})
export class OperationsModule {}
