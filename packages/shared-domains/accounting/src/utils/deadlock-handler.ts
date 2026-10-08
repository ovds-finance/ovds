import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@ovds/database';

export class DeadlockResilienceRunner {
  static async executeWithLockRetry<T>(operation: () => Promise<T>, maxRetries = 4, baseDelayMs = 200): Promise<T> {
    let attempts = 0;
    while (attempts < maxRetries) {
      try {
        attempts++;
        return await operation();
      } catch (error: any) {
        const isDeadlock = error.message?.includes('P2034') || error.code === 'P2034' || error.message?.includes('deadlock detected');
        if (!isDeadlock || attempts >= maxRetries) throw error;
        const jitter = Math.random() * 100;
        const sleepDuration = baseDelayMs * Math.pow(2, attempts) + jitter;
        console.warn(`[DEADLOCK] Attempt ${attempts}/${maxRetries}. Backing off ${sleepDuration.toFixed(0)}ms`);
        await new Promise((resolve) => setTimeout(resolve, sleepDuration));
      }
    }
    throw new Error('Critical DB error after retries.');
  }
}
