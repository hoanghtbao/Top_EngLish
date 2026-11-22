/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description Controller phục vụ ảnh tĩnh từ /uploads/:filename (hỗ trợ MongoDB GridFS trên cloud)
 */

import { Controller, Get, Param, Res } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import type { Response } from 'express';
import { UploadsService } from './uploads.service';

@ApiExcludeController()
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Get(':filename')
  async serveUpload(
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    await this.uploadsService.streamFile(filename, res);
  }
}
