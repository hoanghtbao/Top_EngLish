/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description Schema cấu hình hệ thống & giao diện lưu trữ trong MongoDB
 */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SystemSettingDocument = SystemSetting & Document;

@Schema({ timestamps: true, collection: 'system_settings' })
export class SystemSetting {
  @Prop({ required: true, unique: true, index: true })
  key: string;

  @Prop({ type: Object, required: true })
  value: Record<string, any>;

  @Prop({ type: String })
  description?: string;

  @Prop({ type: String })
  updatedBy?: string;
}

export const SystemSettingSchema = SchemaFactory.createForClass(SystemSetting);
