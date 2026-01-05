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
import { MasterTestParameter, MasterTestParameterSchema } from './schemas/master-test-parameter.schema';
import { TestNameAlias, TestNameAliasSchema } from './schemas/test-name-alias.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { LabPrescriptionService } from './services/lab-prescription.service';
import { LabCartService } from './services/lab-cart.service';
import { LabServiceService } from './services/lab-service.service';
import { LabVendorService } from './services/lab-vendor.service';
import { LabOrderService } from './services/lab-order.service';
import { MasterTestParameterService } from './services/master-test-parameter.service';
import { TestNameAliasService } from './services/test-name-alias.service';
import { LabMemberController } from './controllers/lab-member.controller';
import { LabAdminController } from './controllers/lab-admin.controller';
import { LabOpsController } from './controllers/lab-ops.controller';
import { AssignmentsModule } from '../assignments/assignments.module';
import { PlanConfigModule } from '../plan-config/plan-config.module';
import { WalletModule } from '../wallet/wallet.module';
import { TransactionSummaryModule } from '../transactions/transaction-summary.module';

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
      { name: MasterTestParameter.name, schema: MasterTestParameterSchema },
      { name: TestNameAlias.name, schema: TestNameAliasSchema },
      { name: User.name, schema: UserSchema },
    ]),
    AssignmentsModule,
    PlanConfigModule,
    WalletModule,
    TransactionSummaryModule,
    MulterModule.register({
      storage: diskStorage({
        destination: (req, file, cb) => {
          // Check request URL to determine upload destination
          const isReportUpload = req.url.includes('/reports/') || req.url.includes('/orders/');
          const uploadPath = isReportUpload
            ? './uploads/lab-reports'
            : './uploads/lab-prescriptions';
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
    MasterTestParameterService,
    TestNameAliasService,
  ],
  exports: [
    LabPrescriptionService,
    LabCartService,
    LabServiceService,
    LabVendorService,
    LabOrderService,
    MasterTestParameterService,
    TestNameAliasService,
  ],
})
export class LabModule {}
