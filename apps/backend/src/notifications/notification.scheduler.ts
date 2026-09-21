/**
 * Scheduled jobs for the notification subsystem.
 * - Daily cleanup of old read notifications (default 90-day retention).
 * - Daily sweep for task due-date reminders (dispatches via the event bus).
 *
 * When Redis is disabled the queue injection resolves to null via @Optional()
 * and all cron jobs that would enqueue BullMQ work are skipped gracefully.
 */
import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger, Optional } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Queue } from 'bullmq';

import { PrismaService } from '../common/prisma.service';

import { NotificationDispatchService } from './notification-dispatch.service';
import {
  NOTIFICATION_QUEUE,
  NOTIFICATION_JOB,
  type CleanupJobData,
} from './notification.jobs';

@Injectable()
export class NotificationScheduler {
  private readonly logger = new Logger(NotificationScheduler.name);

  constructor(
    @Optional() @InjectQueue(NOTIFICATION_QUEUE) private readonly queue: Queue | null,
    private readonly prisma: PrismaService,
    private readonly dispatch: NotificationDispatchService,
  ) {}

  /** Enqueue the cleanup job every day at 02:00 UTC */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async scheduleCleanup() {
    if (!this.queue) {
      this.logger.debug('Notification cleanup skipped — Redis is disabled.');
      return;
    }

    const retentionDays = parseInt(process.env.NOTIFICATION_RETENTION_DAYS ?? '90', 10);
    await this.queue.add(
      NOTIFICATION_JOB.CLEANUP,
      { retentionDays } satisfies CleanupJobData,
      { removeOnComplete: true, removeOnFail: { count: 10 } },
    );
    this.logger.log(`Notification cleanup scheduled (retention: ${retentionDays}d)`);
  }

  /**
   * Task due-date sweep — runs every day at 08:00 UTC.
   * Finds tasks due within the next 24 hours and dispatches due-soon notifications
   * to their assignees.
   *
   * dispatch() itself is already a no-op when Redis is disabled, but we skip the
   * DB query entirely to avoid unnecessary load.
   */
  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async sweepTaskDueDates() {
    if (!this.queue) {
      this.logger.debug('Due-date sweep skipped — Redis is disabled.');
      return;
    }

    try {
      const now      = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      // Adjust field names to match your actual Task model in schema.prisma
      const tasks = await (this.prisma as any).task?.findMany({
        where: {
          dueDate:    { gte: now, lte: tomorrow },
          status:     { notIn: ['DONE', 'CANCELLED'] },
          assigneeId: { not: null },
        },
        select: { id: true, title: true, assigneeId: true, companyId: true },
      }) ?? [];

      const results = await Promise.allSettled(
        tasks.map((task: any) =>
          this.dispatch.dispatch({
            userId:    task.assigneeId,
            companyId: task.companyId ?? undefined,
            title:     'Task due soon',
            message:   `"${task.title}" is due within 24 hours.`,
            link:      `/projects/tasks/${task.id}`,
            channels:  ['in_app', 'email'],
            metadata:  { taskId: task.id },
          }),
        ),
      );

      const failed = results.filter((r) => r.status === 'rejected').length;
      if (failed > 0) {
        this.logger.warn(`Due-date sweep: ${failed}/${tasks.length} dispatches failed`);
      }
      if (tasks.length > 0) {
        this.logger.log(`Due-date sweep: notified ${tasks.length - failed}/${tasks.length} task assignees`);
      }
    } catch (err) {
      this.logger.error('sweepTaskDueDates failed', err);
    }
  }
}
