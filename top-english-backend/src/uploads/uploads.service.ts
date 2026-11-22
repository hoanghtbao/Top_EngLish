/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description Service lưu trữ và phát tệp ảnh qua MongoDB GridFS (bền vững trên Render Free / cloud) với fallback đĩa cục bộ
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import type { Response } from 'express';
import * as fs from 'fs';
import { Connection, mongo } from 'mongoose';
import { basename, extname, resolve } from 'path';
import { Readable } from 'stream';

const MIME_BY_EXT: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.avif': 'image/avif',
};

@Injectable()
export class UploadsService {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  private getBucket(): mongo.GridFSBucket {
    if (!this.connection.db) {
      throw new Error('Kết nối MongoDB chưa sẵn sàng để lưu tệp');
    }
    return new mongo.GridFSBucket(this.connection.db, {
      bucketName: 'uploads',
    });
  }

  private resolveMimeType(filename: string, provided?: string): string {
    if (provided && provided.startsWith('image/')) {
      return provided;
    }
    const ext = extname(filename).toLowerCase();
    return MIME_BY_EXT[ext] || 'application/octet-stream';
  }

  /**
   * Lưu tệp ảnh từ Multer memoryStorage vào MongoDB GridFS
   */
  async saveMulterFile(
    file: Express.Multer.File,
    prefix: 'hero-bg' | 'avatar',
  ): Promise<{ filename: string; mimetype: string; size: number }> {
    const ext = extname(file.originalname).toLowerCase() || '.png';
    const filename = `${prefix}-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    const mimetype = this.resolveMimeType(filename, file.mimetype);
    const bucket = this.getBucket();

    await new Promise<void>((resolvePromise, rejectPromise) => {
      const uploadStream = bucket.openUploadStream(filename, {
        metadata: {
          contentType: mimetype,
          originalName: file.originalname,
        },
      });

      Readable.from(file.buffer)
        .pipe(uploadStream)
        .on('error', rejectPromise)
        .on('finish', () => resolvePromise());
    });

    return {
      filename,
      mimetype,
      size: file.size,
    };
  }

  /**
   * Phát tệp ảnh theo tên file: ưu tiên đĩa cục bộ nếu có, ngược lại đọc trực tiếp từ MongoDB GridFS
   */
  async streamFile(rawFilename: string, res: Response): Promise<void> {
    const safeName = basename(rawFilename);
    if (!safeName || safeName === '.' || safeName === '..') {
      throw new NotFoundException('Tên tệp không hợp lệ');
    }

    const localPath = resolve(process.cwd(), 'uploads', safeName);
    if (fs.existsSync(localPath) && fs.statSync(localPath).isFile()) {
      res.setHeader('Content-Type', this.resolveMimeType(safeName));
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      fs.createReadStream(localPath).pipe(res);
      return;
    }

    const bucket = this.getBucket();
    const files = await bucket.find({ filename: safeName }).limit(1).toArray();
    if (!files || files.length === 0) {
      throw new NotFoundException('Không tìm thấy tệp ảnh');
    }

    const fileDoc = files[0];
    const contentType = this.resolveMimeType(
      safeName,
      (fileDoc.metadata as { contentType?: string } | undefined)?.contentType,
    );

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', String(fileDoc.length));
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

    const downloadStream = bucket.openDownloadStream(fileDoc._id);
    downloadStream.on('error', () => {
      if (!res.headersSent) {
        res.status(404).end();
      }
    });
    downloadStream.pipe(res);
  }
}
