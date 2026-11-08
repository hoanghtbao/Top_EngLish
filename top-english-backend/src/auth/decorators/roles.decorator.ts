/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description Decorator khai báo quyền truy cập theo vai trò (@Roles)
 */

import { SetMetadata } from '@nestjs/common';
import { Role } from '../../users/enums/role.enum';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
