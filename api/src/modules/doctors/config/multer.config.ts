import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { BadRequestException } from '@nestjs/common';

// Ensure upload directory exists
const uploadPath = join(process.cwd(), 'uploads', 'doctors');
if (!existsSync(uploadPath)) {
  mkdirSync(uploadPath, { recursive: true });
}

export const doctorPhotoMulterConfig = {
  storage: diskStorage({
    destination: (req: any, file: any, callback: any) => {
      callback(null, uploadPath);
    },
    filename: (req: any, file: any, callback: any) => {
      // Generate unique filename with doctor ID
      const doctorId = req.params.doctorId || 'unknown';
      const uniqueSuffix = Date.now();
      const ext = extname(file.originalname);
      const fileName = `doctor-${doctorId}-${uniqueSuffix}${ext}`;
      callback(null, fileName);
    },
  }),
  fileFilter: (req: any, file: any, callback: any) => {
    // Only allow image files for doctor photos
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      return callback(
        new BadRequestException(
          'Invalid file type. Only JPEG and PNG images are allowed for doctor photos.',
        ),
        false,
      );
    }

    callback(null, true);
  },
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB limit for doctor photos
    files: 1, // Only one photo at a time
  },
};
