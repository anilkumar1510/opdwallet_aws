import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { BadRequestException } from '@nestjs/common';

// Ensure upload directory exists
const uploadPath = join(process.cwd(), 'uploads', 'claims');
if (!existsSync(uploadPath)) {
  mkdirSync(uploadPath, { recursive: true });
}

export const multerConfig = {
  storage: diskStorage({
    destination: (req: any, file: any, callback: any) => {
      // Create user-specific directory
      const userId = req['user']?.userId || req['user']?.id || 'anonymous';
      const userUploadPath = join(uploadPath, userId);

      if (!existsSync(userUploadPath)) {
        mkdirSync(userUploadPath, { recursive: true });
      }

      callback(null, userUploadPath);
    },
    filename: (req: any, file: any, callback: any) => {
      // Generate unique filename
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = extname(file.originalname);
      const fileName = `claim-${uniqueSuffix}${ext}`;
      callback(null, fileName);
    },
  }),
  fileFilter: (req: any, file: any, callback: any) => {
    // Allowed file types
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      return callback(
        new BadRequestException(
          'Invalid file type. Only images (JPEG, PNG, GIF, WebP) and PDFs are allowed.',
        ),
        false,
      );
    }

    callback(null, true);
  },
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB limit per file
    files: 10, // Maximum 10 files per upload
  },
};

export const imageFileFilter = (req: Express.Request, file: Express.Multer.File, callback: Function) => {
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp|pdf)$/i)) {
    return callback(
      new BadRequestException('Only image and PDF files are allowed!'),
      false,
    );
  }
  callback(null, true);
};