import { Module } from '@nestjs/common';
import { HrController } from './hr.controller';
import { HrService } from './hr.service';
import { AttendanceService } from './attendance/attendance.service';
import { AttendanceController } from './attendance/attendance.controller';
import { BiometricsService } from './biometrics/biometrics.service';
import { BiometricsController } from './biometrics/biometrics.controller';
import { EmployeesController } from './employees/employees.controller';
import { DepartmentsController } from './departments/departments.controller';
import { LeavesController } from './leaves/leaves.controller';
import { ShiftsController } from './shifts/shifts.controller';
import { HolidaysController } from './holidays/holidays.controller';
import { PayrollController } from './payroll/payroll.controller';
import { DisasterFundController } from './disaster-fund/disaster-fund.controller';
import { PrismaModule } from '../common/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [
    HrController,
    EmployeesController,
    DepartmentsController,
    AttendanceController,
    LeavesController,
    ShiftsController,
    HolidaysController,
    BiometricsController,
    PayrollController,
    DisasterFundController,
  ],
  providers: [HrService, AttendanceService, BiometricsService],
  exports: [HrService, AttendanceService, BiometricsService],
})
export class HrModule {}
