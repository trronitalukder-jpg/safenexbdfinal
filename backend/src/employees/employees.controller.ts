import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto, UpdateEmployeeDto } from './dto/employee.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

@Controller('admin/employees')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN')
export class EmployeesController {
  constructor(private employeesService: EmployeesService) {}

  @Get()
  async getEmployees() {
    return this.employeesService.getEmployees();
  }

  @Post()
  async createEmployee(@Body() dto: CreateEmployeeDto) {
    return this.employeesService.createEmployee(dto);
  }

  @Patch(':id')
  async updateEmployee(
    @Param('id') id: string,
    @Body() dto: UpdateEmployeeDto,
  ) {
    return this.employeesService.updateEmployee(id, dto);
  }

  @Patch(':id/toggle')
  async toggleActive(@Param('id') id: string) {
    return this.employeesService.toggleActive(id);
  }

  @Delete(':id')
  async deleteEmployee(@Param('id') id: string) {
    return this.employeesService.deleteEmployee(id);
  }
}

