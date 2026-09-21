import { Module } from '@nestjs/common';

import { PrismaModule } from '../common/prisma.module';

import { SecurityAssessmentController } from './security-assessment.controller';
import { SecurityAssessmentService } from './security-assessment.service';

@Module({
  imports: [PrismaModule],
  controllers: [SecurityAssessmentController],
  providers: [SecurityAssessmentService],
  exports: [SecurityAssessmentService],
})
export class SecurityAssessmentModule {}
