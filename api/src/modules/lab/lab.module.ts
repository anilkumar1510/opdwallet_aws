import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { LabPrescription, LabPrescriptionSchema } from './schemas/lab-prescription.schema';
import { LabCart, LabCartSchema } from './schemas/lab-cart.schema';
import { LabService, LabServiceSchema } from './schemas/lab-service.schema';
import { LabVendor, LabVendorSchema } from './schemas/lab-vendor.schema';
import { LabVendorPricing, LabVendorPricingSchema } from './schemas/lab-vendor-pricing.schema';
import { LabVendorSlot, LabVendorSlotSchema } from './schemas/lab-vendor-slot.schema';
import { LabOrder, LabOrderSchema } from './schemas/lab-order.schema';
import { LabPrescriptionService } from './services/lab-prescription.service';
import { LabCartService } from './services/lab-cart.service';
import { LabServiceService } from './services/lab-service.service';
import { LabVendorService } from './services/lab-vendor.service';
import { LabOrderService } from './services/lab-order.service';
import { LabMemberController } from './controllers/lab-member.controller';
import { LabAdminController } from './controllers/lab-admin.controller';
import { LabOpsController } from './controllers/lab-ops.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: LabPrescription.name, schema: LabPrescriptionSchema },
      { name: LabCart.name, schema: LabCartSchema },
      { name: LabService.name, schema: LabServiceSchema },
      { name: LabVendor.name, schema: LabVendorSchema },
      { name: LabVendorPricing.name, schema: LabVendorPricingSchema },
      { name: LabVendorSlot.name, schema: LabVendorSlotSchema },
      { name: LabOrder.name, schema: LabOrderSchema },
    ]),
    MulterModule.register({
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = file.fieldname === 'file'
            ? './uploads/lab-prescriptions'
            : './uploads/lab-reports';
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
      fileFilter: (req, file, cb) => {
        if (
          file.mimetype === 'image/jpeg' ||
          file.mimetype === 'image/png' ||
          file.mimetype === 'image/jpg' ||
          file.mimetype === 'application/pdf'
        ) {
          cb(null, true);
        } else {
          cb(new Error('Only images and PDF files are allowed'), false);
        }
      },
    }),
  ],
  controllers: [
    LabMemberController,
    LabAdminController,
    LabOpsController,
  ],
  providers: [
    LabPrescriptionService,
    LabCartService,
    LabServiceService,
    LabVendorService,
    LabOrderService,
  ],
  exports: [
    LabPrescriptionService,
    LabCartService,
    LabServiceService,
    LabVendorService,
    LabOrderService,
  ],
})
export class LabModule {}
