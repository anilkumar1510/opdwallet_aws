import { BadRequestException } from '@nestjs/common';
import { existsSync, mkdirSync } from 'fs';
import { diskStorage } from 'multer';
import { extname } from 'path';

const DESTINATION = './uploads/pharmacy-prescriptions';

/**
 * The prescription a pharmacy order is built from — flow 5 step 2.
 *
 * Its own directory, matching lab, diagnostics and vision: the shared file
 * resolver falls back to a basename lookup inside one known folder, so mixing
 * kinds there would let one resource's path resolve to another's file.
 */
export const pharmacyPrescriptionMulterConfig = {
  storage: diskStorage({
    destination: (_req: any, _file: any, cb: any) => {
      if (!existsSync(DESTINATION)) mkdirSync(DESTINATION, { recursive: true });
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
      return cb(new BadRequestException('Upload a PDF or a photo (JPG, PNG, GIF or WebP)'), false);
    }
    cb(null, true);
  },
  limits: { fileSize: 15 * 1024 * 1024, files: 1 },
};
