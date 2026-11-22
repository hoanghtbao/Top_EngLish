/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description Cấu hình Multer dùng chung để nhận ảnh vào memoryStorage trước khi lưu vào MongoDB GridFS
 */

import { BadRequestException } from '@nestjs/common';
import type { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { memoryStorage } from 'multer';

export function createImageMemoryMulterOptions(
  maxFileSizeBytes: number,
): MulterOptions {
  return {
    storage: memoryStorage(),
    fileFilter: (req, file, cb) => {
      if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp|svg|avif)$/i)) {
        return cb(
          new BadRequestException(
            'Chỉ chấp nhận các định dạng ảnh hợp lệ (JPG, JPEG, PNG, WEBP, SVG, AVIF)',
          ),
          false,
        );
      }
      cb(null, true);
    },
    limits: {
      fileSize: maxFileSizeBytes,
    },
  };
}
