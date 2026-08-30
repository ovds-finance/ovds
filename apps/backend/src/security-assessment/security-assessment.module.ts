import { Module } from '@nestjs/common';
import { SecurityAssessmentController } from './security-assessment.controller';
import { SecurityAssessmentService } from './security-assessment.service';
import { PrismaModule } from '../common/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SecurityAssessmentController],
  providers: [SecurityAssessmentService],
  exports: [SecurityAssessmentService],
})
export class SecurityAssessmentModule {}
