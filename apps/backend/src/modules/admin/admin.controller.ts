import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { AdminService } from './admin.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('superadmin')
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
}
