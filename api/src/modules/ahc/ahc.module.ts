import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { AhcPackage, AhcPackageSchema } from './schemas/ahc-package.schema';
import { AhcOrder, AhcOrderSchema } from './schemas/ahc-order.schema';
import { AhcPackageService } from './services/ahc-package.service';
import { AhcPackageMemberService } from './services/ahc-package-member.service';
import { AhcOrderService } from './services/ahc-order.service';
import { AhcAdminController } from './controllers/ahc-admin.controller';
import { AhcMemberController } from './controllers/ahc-member.controller';
import { AhcOpsController } from './controllers/ahc-ops.controller';
import { LabService, LabServiceSchema } from '../lab/schemas/lab-service.schema';
import { DiagnosticService, DiagnosticServiceSchema } from '../diagnostics/schemas/diagnostic-service.schema';
import { LabVendorSlot, LabVendorSlotSchema } from '../lab/schemas/lab-vendor-slot.schema';
import { DiagnosticVendorSlot, DiagnosticVendorSlotSchema } from '../diagnostics/schemas/diagnostic-vendor-slot.schema';
import { PlanConfig, PlanConfigSchema } from '../plan-config/schemas/plan-config.schema';

// Import other modules needed for AHC orders
import { LabModule } from '../lab/lab.module';
import { DiagnosticsModule } from '../diagnostics/diagnostics.module';
import { AssignmentsModule } from '../assignments/assignments.module';
import { PlanConfigModule } from '../plan-config/plan-config.module';
import { WalletModule } from '../wallet/wallet.module';
import { TransactionSummaryModule } from '../transactions/transaction-summary.module';
import { User, UserSchema } from '../users/schemas/user.schema';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AhcPackage.name, schema: AhcPackageSchema },
      { name: AhcOrder.name, schema: AhcOrderSchema },
      { name: LabService.name, schema: LabServiceSchema },
      { name: DiagnosticService.name, schema: DiagnosticServiceSchema },
      { name: LabVendorSlot.name, schema: LabVendorSlotSchema },
      { name: DiagnosticVendorSlot.name, schema: DiagnosticVendorSlotSchema },
      { name: User.name, schema: UserSchema },
      { name: PlanConfig.name, schema: PlanConfigSchema },
    ]),
    // Configure Multer for dual file uploads (lab and diagnostic reports)
    MulterModule.register({
      storage: diskStorage({
        destination: (req, file, cb) => {
          let path = './uploads/ahc-reports/';
          // Separate directories for lab and diagnostic reports
          path += file.fieldname === 'labReport' ? 'lab' : 'diagnostic';
          // Create directory if it doesn't exist
          if (!existsSync(path)) {
            mkdirSync(path, { recursive: true });
          }
          cb(null, path);
        },
        filename: (req, file, cb) => {
          // Generate random filename
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max file size
      },
      fileFilter: (req, file, cb) => {
        // Only allow PDF and image files
        const allowedMimeTypes = [
          'image/jpeg',
          'image/png',
          'application/pdf',
        ];
        cb(null, allowedMimeTypes.includes(file.mimetype));
      },
    }),
    // Import other modules for service dependencies
    LabModule,
    DiagnosticsModule,
    AssignmentsModule,
    PlanConfigModule,
    WalletModule,
    TransactionSummaryModule,
    NotificationsModule,
  ],
  controllers: [
    AhcAdminController,
    AhcMemberController,
    AhcOpsController,
  ],
  providers: [
    AhcPackageService,
    AhcPackageMemberService,
    AhcOrderService,
  ],
  exports: [
    AhcPackageService,
    AhcPackageMemberService,
    AhcOrderService,
  ],
})
export class AhcModule {}
