import { MulterModuleOptions } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { BadRequestException } from '@nestjs/common';

export const signatureMulterConfig: MulterModuleOptions = {
  storage: diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = './uploads/signatures';

      if (!existsSync(uploadPath)) {
        mkdirSync(uploadPath, { recursive: true });
      }

      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const doctorId = (req as any).user?.doctorId || 'temp';
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = extname(file.originalname);
      cb(null, `SIG-${doctorId}-${uniqueSuffix}${ext}`);
    },
  }),
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/jpg'];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(
        new BadRequestException('Only PNG and JPG/JPEG images are allowed for signatures'),
        false
      );
    }
    cb(null, true);
  },
  limits: {
    fileSize: 500 * 1024, // 500KB max (transparent background preferred)
  },
};
