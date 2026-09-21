# 76 — Enterprise Service Bus and Integration Patterns

## 1. ESB Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│              Enterprise Service Bus (ESB)                         │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │   Message   │  │   Routing   │  │   Transformation         │ │
│  │   Broker    │  │   Engine    │  │   Engine                 │ │
│  │             │  │             │  │                         │ │
│  │ - RabbitMQ  │  │ - Content   │  │ - XSLT                  │ │
│  │ - Kafka     │  │ - Topic     │  │ - JSON/XML              │ │
│  │ - ActiveMQ  │  │ - Fanout    │  │ - Data Mapping          │ │
│  │ - NATS      │  │ - Direct    │  │ - Protocol Bridge       │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
│         │                │                    │                  │
│         └────────────────┼────────────────────┘                  │
│                          ▼                                       │
│                   ┌─────────────────────┐                        │
│                   │   Integration       │                        │
│                   │   Orchestrator      │                        │
│                   └─────────────────────┘                        │
└─────────────────────────────────────────────────────────────────┘
```

## 2. Message Broker

```typescript
// esb/broker/message-broker.service.ts
@Injectable()
export class MessageBrokerService {
  constructor(private readonly rabbitMQ: RabbitMQService) {}

  async publish(topic: string, message: Message, options?: PublishOptions): Promise<void> {
    const exchange = this.getExchange(topic);
    const routingKey = this.getRoutingKey(topic);

    await this.rabbitMQ.publish(exchange, routingKey, {
      body: JSON.stringify(message),
      contentType: 'application/json',
      headers: {
        'x-message-id': v4(),
        'x-timestamp': new Date().toISOString(),
        'x-organization-id': message.organizationId,
        ...options?.headers,
      },
      persistent: options?.persistent ?? true,
    });
  }

  async subscribe(topic: string, handler: MessageHandler): Promise<void> {
    const queue = await this.rabbitMQ.createQueue({
      name: `queue:${topic}:${v4()}`,
      durable: true,
    });

    await this.rabbitMQ.bindQueue(queue.name, this.getExchange(topic), this.getRoutingKey(topic));

    await this.rabbitMQ.consume(queue.name, async (msg) => {
      if (msg) {
        try {
          const message = JSON.parse(msg.content.toString());
          await handler(message);
          await this.rabbitMQ.ack(msg);
        } catch (error) {
          await this.handleError(msg, error);
        }
      }
    });
  }
}
```

## 3. Routing Engine

```typescript
// esb/routing/routing-engine.service.ts
@Injectable()
export class RoutingEngineService {
  async route(message: Message, routes: Route[]): Promise<RouteResult[]> {
    const results: RouteResult[] = [];

    for (const route of routes) {
      if (await this.matchRoute(message, route)) {
        const result = await this.executeRoute(route, message);
        results.push(result);
      }
    }

    return results;
  }

  private async matchRoute(message: Message, route: Route): Promise<boolean> {
    // Content-based routing
    if (route.contentFilter) {
      const matches = await this.matchContent(message, route.contentFilter);
      if (!matches) return false;
    }

    // Header-based routing
    if (route.headerFilter) {
      const matches = this.matchHeaders(message.headers, route.headerFilter);
      if (!matches) return false;
    }

    // Priority-based routing
    if (route.priority) {
      const priorityMatch = await this.checkPriority(message, route.priority);
      if (!priorityMatch) return false;
    }

    return true;
  }
}
```

## 4. Transformation Engine

```typescript
// esb/transformation/transformation-engine.service.ts
@Injectable()
export class TransformationEngineService {
  async transform(message: Message, transformation: Transformation): Promise<TransformedMessage> {
    switch (transformation.type) {
      case 'xslt':
        return this.transformXSLT(message, transformation);
      case 'jsonata':
        return this.transformJSONata(message, transformation);
      case 'dataweave':
        return this.transformDataWeave(message, transformation);
      case 'custom':
        return this.transformCustom(message, transformation);
      default:
        throw new UnknownTransformationTypeException(transformation.type);
    }
  }

  private async transformJSONata(message: Message, transformation: Transformation): Promise<TransformedMessage> {
    const expression = JSONata(transformation.expression);
    const result = expression.evaluate(message.payload);

    return {
      ...message,
      payload: result,
      transformations: [...message.transformations, transformation.name],
    };
  }

  private async transformXSLT(message: Message, transformation: Transformation): Promise<TransformedMessage> {
    const xslt = await this.loadXSLT(transformation.stylesheet);
    const result = await this.applyXSLT(message.payload, xslt);

    return {
      ...message,
      payload: result,
      transformations: [...message.transformations, transformation.name],
    };
  }
}
```

## 5. Protocol Bridging

```typescript
// esb/bridges/protocol-bridge.service.ts
@Injectable()
export class ProtocolBridgeService {
  async bridge(source: Protocol, target: Protocol, message: Message): Promise<Message> {
    let transformed = message;

    // Step 1: Transform from source format
    transformed = await this.transformFrom(transformed, source);

    // Step 2: Convert protocol headers
    transformed = await this.convertHeaders(transformed, source, target);

    // Step 3: Transform to target format
    transformed = await this.transformTo(transformed, target);

    return transformed;
  }

  private async convertHeaders(message: Message, source: Protocol, target: Protocol): Promise<Message> {
    const headers: any = {};

    for (const [key, value] of Object.entries(message.headers)) {
      const targetKey = this.mapHeader(key, source, target);
      headers[targetKey] = value;
    }

    return { ...message, headers };
  }

  private mapHeader(header: string, source: Protocol, target: Protocol): string {
    const mapping = this.headerMappings[`${source}->${target}`];
    return mapping?.[header] || header;
  }
}
```

## 6. Orchestration

```typescript
// esb/orchestration/orchestrator.service.ts
@Injectable()
export class OrchestratorService {
  async orchestrate(process: OrchestrationProcess, input: any): Promise<OrchestrationResult> {
    const context: OrchestrationContext = {
      variables: { input },
      errors: [],
    };

    const results: StepResult[] = [];

    for (const step of process.steps) {
      try {
        const result = await this.executeStep(step, context);
        results.push(result);

        if (result.output) {
          context.variables[step.outputVariable || step.id] = result.output;
        }
      } catch (error) {
        context.errors.push({ step: step.id, error });

        if (step.errorHandler) {
          await this.executeErrorHandler(step.errorHandler, context);
        } else if (step.required) {
          throw new OrchestrationFailedException(step.id, error);
        }
      }
    }

    return {
      processId: process.id,
      status: context.errors.length === 0 ? 'completed' : 'failed',
      results,
      context: context.variables,
      errors: context.errors,
    };
  }
}
```

## 7. Integration Patterns

```typescript
// esb/patterns/integration-patterns.service.ts
@Injectable()
export class IntegrationPatternsService {
  async requestReply(service: string, message: Message): Promise<Response> {
    const correlationId = v4();
    const replyQueue = `reply:${correlationId}`;

    await this.publish(`${service}.request`, {
      ...message,
      correlationId,
      replyTo: replyQueue,
    });

    return this.waitForReply(replyQueue, correlationId, message.timeout || 30000);
  }

  async publishSubscribe(topic: string, message: Message): Promise<void> {
    await this.publish(topic, message);
  }

  async competingConsumers(queue: string, message: Message): Promise<void> {
    await this.publish(queue, message);
  }

  async messageFilter(queue: string, filter: Filter, message: Message): Promise<void> {
    if (await this.matchFilter(message, filter)) {
      await this.publish(queue, message);
    }
  }

  async deadLetterChannel(message: Message, reason: string): Promise<void> {
    await this.publish('dead-letter', {
      ...message,
      reason,
      timestamp: new Date(),
    });
  }
}
```

## 8. Monitoring

```typescript
// esb/monitoring/esb-monitor.service.ts
@Injectable()
export class ESBMonitorService {
  async collectMetrics(): Promise<ESBMetrics> {
    const queues = await this.rabbitMQ.getQueues();

    const queueMetrics = await Promise.all(
      queues.map(async (queue) => {
        const info = await this.rabbitMQ.getQueueInfo(queue.name);
        return {
          name: queue.name,
          messages: info.messages,
          consumers: info.consumers,
          rate: info.messageStats.publishDetails.rate,
        };
      }),
    );

    return {
      timestamp: new Date(),
      queues: queueMetrics,
      totalMessages: queueMetrics.reduce((sum, q) => sum + q.messages, 0),
      totalConsumers: queueMetrics.reduce((sum, q) => sum + q.consumers, 0),
    };
  }

  async detectStuckMessages(): Promise<StuckMessage[]> {
    const stuck: StuckMessage[] = [];

    for (const queue of await this.getQueues()) {
      const messages = await this.rabbitMQ.getMessages(queue.name, { count: 100 });

      for (const msg of messages) {
        const age = Date.now() - new Date(msg.properties.timestamp).getTime();

        if (age > this.STUCK_THRESHOLD) {
          stuck.push({
            queue: queue.name,
            messageId: msg.messageId,
            age,
            content: msg.content,
          });
        }
      }
    }

    return stuck;
  }
}
```
