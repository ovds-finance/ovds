// apps/shared-domains/accounting/src/events/kafka-producer.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Kafka, Producer, RecordMetadata } from 'kafkajs';

@Injectable()
export class KafkaProducerService implements OnModuleInit, OnModuleDestroy {
  private kafka = new Kafka({ clientId: 'ovds-accounting', brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(',') });
  private producer: Producer = this.kafka.producer();

  async onModuleInit() { await this.producer.connect(); }

  async emitLedgerEvent(tenantId: string, eventType: string, payload: any): Promise<RecordMetadata[]> {
    const targetTopic = `tenant.${tenantId}.accounting.events`;
    return await this.producer.send({
      topic: targetTopic,
      messages: [{ key: payload.entryId || tenantId, value: JSON.stringify({ eventType, tenantId, timestamp: new Date().toISOString(), data: payload }) }],
    });
  }

  async onModuleDestroy() { await this.producer.disconnect(); }
}
