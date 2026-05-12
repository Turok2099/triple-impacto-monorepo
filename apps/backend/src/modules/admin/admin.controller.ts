import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, Req, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { AdminService } from './admin.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  async getUsers(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    return this.adminService.getUsers(Number(page), Number(limit));
  }

  @Get('users/:id/payments')
  async getUserPayments(@Param('id') userId: string) {
    return this.adminService.getUserPayments(userId);
  }

  @Post('users')
  async createUser(@Req() req: any, @Body() payload: any) {
    const adminId = req.user?.userId;
    return this.adminService.createUser(adminId, payload);
  }

  @Patch('users/:id')
  async updateUser(@Req() req: any, @Param('id') userId: string, @Body() payload: any) {
    const adminId = req.user?.userId;
    return this.adminService.updateUser(adminId, userId, payload);
  }

  @Patch('users/:id/role')
  @Roles('admin')
  async updateUserRole(@Req() req: any, @Param('id') userId: string, @Body() payload: { role: string }) {
    const adminId = req.user?.userId;
    return this.adminService.updateUserRole(adminId, userId, payload.role);
  }

  @Delete('users/:id')
  async deleteUser(@Req() req: any, @Param('id') userId: string) {
    const adminId = req.user?.userId;
    return this.adminService.deleteUser(adminId, userId);
  }

  @Delete('users/:id/affiliate/:bondaCode/microsite/:micrositeId')
  async deleteAffiliate(
    @Req() req: any, 
    @Param('id') userId: string, 
    @Param('bondaCode') bondaCode: string,
    @Param('micrositeId') micrositeId: string
  ) {
    const adminId = req.user?.userId;
    return this.adminService.deleteAffiliate(adminId, userId, bondaCode, micrositeId);
  }

  // ==========================================
  // ONGs / ORGANIZACIONES
  // ==========================================

  @Get('organizaciones')
  async getOrganizaciones() {
    return this.adminService.getOrganizaciones();
  }

  @Post('organizaciones/upload-logo')
  @UseInterceptors(require('@nestjs/platform-express').FileInterceptor('file'))
  async uploadLogo(@UploadedFile() file: any) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    return this.adminService.uploadLogo(file);
  }

  @Post('organizaciones')
  async createOrganizacion(@Req() req: any, @Body() payload: any) {
    const adminId = req.user?.userId;
    return this.adminService.createOrganizacion(adminId, payload);
  }

  @Patch('organizaciones/:id')
  async updateOrganizacion(@Req() req: any, @Param('id') id: string, @Body() payload: any) {
    const adminId = req.user?.userId;
    return this.adminService.updateOrganizacion(adminId, id, payload);
  }

  @Delete('organizaciones/:id')
  async deleteOrganizacion(@Req() req: any, @Param('id') id: string) {
    const adminId = req.user?.userId;
    return this.adminService.deleteOrganizacion(adminId, id);
  }

  // ==========================================
  // BANNERS
  // ==========================================

  @Get('banners')
  async getBanners() {
    return this.adminService.getBanners();
  }

  @Post('banners/upload')
  @UseInterceptors(require('@nestjs/platform-express').FileInterceptor('file'))
  async uploadBannerImage(@UploadedFile() file: any) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    return this.adminService.uploadBannerImage(file);
  }

  @Post('banners')
  async createBanner(@Req() req: any, @Body() payload: any) {
    const adminId = req.user?.userId;
    return this.adminService.createBanner(adminId, payload);
  }

  @Patch('banners/:id')
  async updateBanner(@Req() req: any, @Param('id') id: string, @Body() payload: any) {
    const adminId = req.user?.userId;
    return this.adminService.updateBanner(adminId, id, payload);
  }

  @Delete('banners/:id')
  async deleteBanner(@Req() req: any, @Param('id') id: string) {
    const adminId = req.user?.userId;
    return this.adminService.deleteBanner(adminId, id);
  }
}
