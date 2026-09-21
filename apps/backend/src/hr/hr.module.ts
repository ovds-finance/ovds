import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../common/prisma.module';
import { PrismaService } from '../common/prisma.service';

import { AttendanceController } from './attendance/attendance.controller';
import { AttendanceService } from './attendance/attendance.service';
import { BiometricsController } from './biometrics/biometrics.controller';
import { BiometricsService } from './biometrics/biometrics.service';
import { DepartmentsController } from './departments/departments.controller';
import { DisasterFundController } from './disaster-fund/disaster-fund.controller';
import { DisasterFundService }    from './disaster-fund/disaster-fund.service';
import { EmployeesController } from './employees/employees.controller';
import { HolidaysController } from './holidays/holidays.controller';
import { HrController } from './hr.controller';
import { HrService } from './hr.service';
import { LeavesController } from './leaves/leaves.controller';
import { PayrollController } from './payroll/payroll.controller';
import { ShiftsController } from './shifts/shifts.controller';


@Module({
  imports: [PrismaModule, AuthModule],
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
  // HrService must be listed before controllers that depend on it so NestJS
  // resolves the dependency graph correctly. PrismaService is re-exported by
  // PrismaModule but listed here as well so sub-controllers can inject it
  // directly without importing PrismaModule themselves.
  providers: [HrService, AttendanceService, BiometricsService, PrismaService, DisasterFundService],
  exports: [HrService, AttendanceService, BiometricsService, DisasterFundService],
})
export class HrModule {}
