// apps/shared-domains/accounting/src/events/kafka-consumer.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { Kafka, Consumer } from 'kafkajs';
import { BalancesValidatorListener } from '../balances-validator.listener';

@Injectable()
export class KafkaConsumerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaConsumerService.name);
  private kafka = new Kafka({ clientId: 'ovds-worker', brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(',') });
  private consumer: Consumer = this.kafka.consumer({ groupId: 'ovds-ledger-validators' });

  constructor(private readonly validator: BalancesValidatorListener) {}

  async onModuleInit() {
    await this.consumer.connect();
    await this.consumer.subscribe({ topic: /^tenant\..*\.accounting\.events$/, fromBeginning: false });
    await this.consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const raw = message.value?.toString();
        if (!raw) return;
        try {
          const envelope = JSON.parse(raw);
          if (envelope.eventType === 'JOURNAL_ENTRY_POSTED') {
            await this.validator.handleJournalEntryVerification({ entryId: envelope.data.entryId, tenantId: envelope.tenantId });
          }
        } catch (error: any) { console.error('Kafka consumer error:', error.message); }
      }
    });
  }

  async onModuleDestroy() { await this.consumer.disconnect(); }
}
