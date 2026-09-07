import { BadRequestException } from '@nestjs/common';
import { existsSync, mkdirSync } from 'fs';
import { diskStorage } from 'multer';
import { extname } from 'path';

const DESTINATION = './uploads/vision-prescriptions';

/**
 * Eye prescription upload — patient-flows flow 3 step 5.
 *
 * Same shape as the lab and diagnostics prescription uploads: random filename,
 * original name kept on the record, images and PDFs only. Its own directory
 * because the report download helper resolves a missing file by basename inside
 * one known folder, and mixing kinds there would let a lab path resolve to a
 * vision file.
 */
export const visionPrescriptionMulterConfig = {
  storage: diskStorage({
    destination: (_req: any, _file: any, cb: any) => {
      if (!existsSync(DESTINATION)) {
        mkdirSync(DESTINATION, { recursive: true });
      }
      cb(null, DESTINATION);
    },
    filename: (_req: any, file: any, cb: any) => {
      const random = Array(32)
        .fill(null)
        .map(() => Math.round(Math.random() * 16).toString(16))
        .join('');
      cb(null, `${random}${extname(file.originalname)}`);
    },
  }),
  fileFilter: (_req: any, file: any, cb: any) => {
    const allowed = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
    ];
    if (!allowed.includes(file.mimetype)) {
      return cb(
        new BadRequestException('Upload a PDF or a photo (JPG, PNG, GIF or WebP)'),
        false,
      );
    }
    cb(null, true);
  },
  limits: {
    fileSize: 15 * 1024 * 1024,
    files: 1,
  },
};
