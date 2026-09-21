# 89 — Universal Adapters and Legacy System Integration

## 1. Universal Adapter Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│              Universal Adapters and Legacy Integration            │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │   Protocol  │  │   Data      │  │   Transformation         │ │
│  │   Adapters  │  │   Adapters  │  │   Engine                 │ │
│  │             │  │             │  │                         │ │
│  │ - REST      │  │ - XML       │  │ - ETL Pipelines         │ │
│  │ - SOAP      │  │ - JSON      │  │ - Field Mapping         │ │
│  │ - gRPC      │  │ - CSV       │  │ - Data Cleansing        │ │
│  │ - FTP       │  │ - Fixed     │  │ - Validation            │ │
│  │ - MQ        │  │   Width     │  │ - Enrichment            │ │
│  │ - Mainframe │  │ - EDI       │  │                         │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
│         │                │                    │                  │
│         └────────────────┼────────────────────┘                  │
│                          ▼                                       │
│                   ┌─────────────────────┐                        │
│                   │   Legacy Bridge     │                        │
│                   │   (ESB/Router)      │                        │
│                   └─────────────────────┘                        │
└─────────────────────────────────────────────────────────────────┘
```

## 2. Protocol Adapter

```typescript
// adapters/protocols/protocol-adapter.interface.ts
export interface ProtocolAdapter {
  readonly protocol: string;
  readonly version: string;

  connect(config: ConnectionConfig): Promise<void>;
  disconnect(): Promise<void>;

  send(message: AdapterMessage): Promise<void>;
  receive(): Promise<AdapterMessage>;

  transform(message: AdapterMessage, targetProtocol: string): Promise<AdapterMessage>;
}

// adapters/protocols/soap-adapter.ts
@Injectable()
export class SOAPAdapter implements ProtocolAdapter {
  readonly protocol = 'SOAP';
  readonly version = '1.2';

  private client: SOAPClient;

  async connect(config: ConnectionConfig): Promise<void> {
    this.client = new SOAPClient({
      endpoint: config.endpoint,
      wsdl: config.wsdl,
      headers: config.headers,
    });

    await this.client.initialize();
  }

  async send(message: AdapterMessage): Promise<void> {
    const soapEnvelope = this.wrapInSOAP(message.payload);

    await this.client.send(soapEnvelope);
  }

  async receive(): Promise<AdapterMessage> {
    const response = await this.client.receive();

    const payload = this.unwrapFromSOAP(response);

    return {
      id: response.messageId,
      protocol: 'SOAP',
      payload,
      headers: response.headers,
      timestamp: new Date(),
    };
  }

  private wrapInSOAP(payload: any): SOAPEnvelope {
    return {
      soapEnvelope: {
        header: {
          messageId: v4(),
          timestamp: new Date().toISOString(),
        },
        body: payload,
      },
    };
  }
}

// adapters/protocols/mainframe-adapter.ts
@InjectInject()
export class MainframeAdapter implements ProtocolAdapter {
  readonly protocol = 'MAINFRAME';
  readonly version = 'TN5250';

  private tn5250: TN5250Client;

  async connect(config: ConnectionConfig): Promise<void> {
    this.tn5250 = new TN5250Client({
      host: config.host,
      port: config.port || 23,
      deviceName: config.deviceName,
    });

    await this.tn5250.connect();
  }

  async send(message: AdapterMessage): Promise<void> {
    const screen = this.mapToScreen(message.payload);

    await this.tn5250.sendScreen(screen);
  }

  async receive(): Promise<AdapterMessage> {
    const screen = await this.tn5250.receiveScreen();

    const payload = this.mapFromScreen(screen);

    return {
      id: screen.id,
      protocol: 'MAINFRAME',
      payload,
      timestamp: new Date(),
    };
  }
}
```

## 3. Data Adapter

```typescript
// adapters/data/data-adapter.interface.ts
export interface DataAdapter {
  readonly format: DataFormat;

  parse(data: Buffer): Promise<DataRecord[]>;
  format(records: DataRecord[]): Promise<Buffer>;

  validate(record: DataRecord): Promise<ValidationResult>;
  transform(record: DataRecord, mapping: FieldMapping): Promise<DataRecord>;
}

// adapters/data/edi-adapter.ts
@Injectable()
export class EDIAdapter implements DataAdapter {
  readonly format = 'EDI';

  async parse(data: Buffer): Promise<DataRecord[]> {
    const edi = data.toString('utf-8');

    const segments = edi.split('~').filter((s) => s.trim());

    const records: DataRecord[] = [];

    for (const segment of segments) {
      const elements = segment.split('*');

      records.push({
        id: elements[0],
        type: elements[1],
        data: this.parseElements(elements.slice(2)),
      });
    }

    return records;
  }

  async format(records: DataRecord[]): Promise<Buffer> {
    const segments = records.map((record) => {
      const elements = [record.id, record.type, ...this.formatData(record.data)];
      return elements.join('*') + '~';
    });

    return Buffer.from(segments.join('\n'));
  }
}

// adapters/data/fixed-width-adapter.ts
@Injectable()
export class FixedWidthAdapter implements DataAdapter {
  readonly format = 'FIXED_WIDTH';

  constructor(private readonly schema: FixedWidthSchema) {}

  async parse(data: Buffer): Promise<DataRecord[]> {
    const lines = data.toString('utf-8').split('\n').filter((l) => l.trim());

    return lines.map((line, index) => this.parseLine(line, index));
  }

  private parseLine(line: string, index: number): DataRecord {
    const record: DataRecord = { id: String(index) };

    for (const field of this.schema.fields) {
      const value = line.substring(field.start, field.end).trim();
      record[field.name] = this.castValue(value, field.type);
    }

    return record;
  }

  async format(records: DataRecord[]): Promise<Buffer> {
    const lines = records.map((record) => {
      let line = '';

      for (const field of this.schema.fields) {
        const value = String(record[field.name] || '');
        line += value.padEnd(field.length).substring(0, field.length);
      }

      return line;
    });

    return Buffer.from(lines.join('\n'));
  }
}
```

## 4. Transformation Engine

```typescript
// adapters/transformation/transformation-engine.service.ts
@Injectable()
export class TransformationEngineService {
  async transform(data: any, mapping: TransformationMapping): Promise<TransformedData> {
    let result = { ...data };

    for (const rule of mapping.rules) {
      switch (rule.type) {
        case 'direct':
          result[rule.target] = result[rule.source];
          break;
        case 'lookup':
          result[rule.target] = await this.lookup(rule, result[rule.source]);
          break;
        case 'calculation':
          result[rule.target] = await this.calculate(rule, result);
          break;
        case 'format':
          result[rule.target] = this.format(rule, result[rule.source]);
          break;
        case 'conditional':
          result[rule.target] = await this.applyConditional(rule, result);
          break;
      }
    }

    return result;
  }

  private async lookup(rule: LookupRule, value: any): Promise<any> {
    const lookupTable = await this.getLookupTable(rule.lookupTable);

    const entry = lookupTable.find((e) => e.sourceValue === value);

    return entry?.targetValue ?? rule.defaultValue;
  }

  private async calculate(rule: CalculationRule, data: any): Promise<any> {
    const expression = rule.expression;

    // Safe evaluation using a sandboxed context
    const fn = new Function(...Object.keys(data), `return ${expression};`);

    return fn(...Object.values(data));
  }
}
```

## 5. Integration Bridge

```typescript
// adapters/bridge/integration-bridge.service.ts
@Injectable()
export class IntegrationBridgeService {
  async bridge(source: LegacySystem, target: ModernSystem): Promise<Bridge> {
    const sourceAdapter = this.getAdapter(source.type);
    const targetAdapter = this.getAdapter(target.type);

    const mapping = await this.createMapping(source, target);

    const bridge: Bridge = {
      id: v4(),
      source,
      target,
      mapping,
      status: 'active',
      metrics: {
        messagesProcessed: 0,
        errors: 0,
        lastMessage: null,
      },
    };

    // Start listening to source
    await sourceAdapter.connect(source.config);
    sourceAdapter.onMessage(async (message) => {
      await this.processMessage(bridge, message);
    });

    return bridge;
  }

  private async processMessage(bridge: Bridge, message: AdapterMessage): Promise<void> {
    try {
      // Transform message
      const transformed = await this.transformMessage(bridge.mapping, message);

      // Send to target
      await bridge.target.adapter.send(transformed);

      // Update metrics
      bridge.metrics.messagesProcessed++;
      bridge.metrics.lastMessage = new Date();
    } catch (error) {
      bridge.metrics.errors++;

      await this.handleError(bridge, message, error);
    }
  }
}
```

## 6. Mainframe Connector

```typescript
// adapters/mainframe/mainframe-connector.service.ts
@Injectable()
export class MainframeConnectorService {
  async connect(config: MainframeConfig): Promise<MainframeSession> {
    const session = new MainframeSession({
      host: config.host,
      port: config.port,
      username: config.username,
      password: await this.decrypt(config.password),
    });

    await session.connect();

    return session;
  }

  async executeCommand(session: MainframeSession, command: string): Promise<CommandResult> {
    await session.send(command);

    const response = await session.receive();

    return {
      command,
      output: response,
      returnCode: this.parseReturnCode(response),
    };
  }

  async transferDataset(session: MainframeSession, dataset: string): Promise<Dataset> {
    await session.send(`SUBMIT TSO TRANSMIT RECEIVE INDATASET('${dataset}')`);

    const data = await session.receiveFile();

    return {
      name: dataset,
      content: data,
      format: 'mainframe',
    };
  }
}
```

## 7. Message Queue Adapters

```typescript
// adapters/mq/mq-adapters.service.ts
@Injectable()
export class MQAdaptersService {
  async createIBMAdapter(config: IBMmqConfig): Promise<IBMmqAdapter> {
    return new IBMmqAdapter({
      queueManager: config.queueManager,
      host: config.host,
      port: config.port,
      channel: config.channel,
      queueName: config.queueName,
    });
  }

  async createTibcoAdapter(config: TibcoConfig): Promise<TibcoAdapter> {
    return new TibcoAdapter({
      serverUrl: config.serverUrl,
      username: config.username,
      password: config.password,
    });
  }

  async createRabbitAdapter(config: RabbitConfig): Promise<RabbitAdapter> {
    return new RabbitAdapter({
      url: config.url,
      queue: config.queue,
      exchange: config.exchange,
    });
  }
}
```

## 8. Legacy API Wrapper

```typescript
// adapters/api/legacy-api-wrapper.service.ts
@Injectable()
export class LegacyAPIWrapperService {
  async wrap(legacyApi: LegacyAPI): Promise<ModernAPI> {
    const endpoints = await this.discoverEndpoints(legacyApi);

    const wrapped: ModernAPI = {
      baseUrl: `/api/v1/legacy/${legacyApi.name}`,
      endpoints: endpoints.map((ep) => this.wrapEndpoint(ep)),
    };

    return wrapped;
  }

  private wrapEndpoint(endpoint: LegacyEndpoint): ModernEndpoint {
    return {
      method: this.mapMethod(endpoint.method),
      path: this.mapPath(endpoint.path),
      description: endpoint.description,
      parameters: endpoint.parameters.map((p) => this.mapParameter(p)),
      responses: {
        200: {
          description: 'Success',
          schema: this.mapSchema(endpoint.responseSchema),
        },
      },
      handler: async (req: Request) => {
        const legacyRequest = this.mapToLegacyRequest(req, endpoint);

        const legacyResponse = await this.callLegacy(endpoint, legacyRequest);

        return this.mapFromLegacyResponse(legacyResponse);
      },
    };
  }
}
```

## 9. Data Quality

```typescript
// adapters/quality/data-quality.service.ts
@Injectable()
export class DataQualityService {
  async validateMapping(source: any, target: any, mapping: FieldMapping): Promise<MappingValidation> {
    const issues: MappingIssue[] = [];

    for (const rule of mapping.rules) {
      const sourceValue = this.getNestedValue(source, rule.source);

      if (rule.required && sourceValue === undefined) {
        issues.push({
          severity: 'error',
          field: rule.target,
          message: `Required field ${rule.source} is missing`,
        });
      }

      if (sourceValue !== undefined && rule.type) {
        const typeValid = this.validateType(sourceValue, rule.type);

        if (!typeValid) {
          issues.push({
            severity: 'error',
            field: rule.target,
            message: `Type mismatch: expected ${rule.type}, got ${typeof sourceValue}`,
          });
        }
      }
    }

    return {
      valid: issues.filter((i) => i.severity === 'error').length === 0,
      issues,
    };
  }
}
```

## 10. Migration Playbook

```typescript
// adapters/migration/migration-playbook.service.ts
@Injectable()
export class MigrationPlaybookService {
  async createPlaybook(source: LegacySystem, target: ModernSystem): Promise<MigrationPlaybook> {
    const analysis = await this.analyzeLegacy(source);

    const playbook: MigrationPlaybook = {
      id: v4(),
      sourceSystem: source.name,
      targetSystem: target.name,
      phases: [
        {
          name: 'Discovery',
          tasks: [
            { name: 'Inventory APIs', status: 'pending' },
            { name: 'Document data models', status: 'pending' },
            { name: 'Identify integrations', status: 'pending' },
          ],
        },
        {
          name: 'Adapter Development',
          tasks: [
            { name: 'Build protocol adapters', status: 'pending' },
            { name: 'Create data mappings', status: 'pending' },
            { name: 'Implement transformations', status: 'pending' },
          ],
        },
        {
          name: 'Testing',
          tasks: [
            { name: 'Unit tests', status: 'pending' },
            { name: 'Integration tests', status: 'pending' },
            { name: 'Performance tests', status: 'pending' },
          ],
        },
        {
          name: 'Migration',
          tasks: [
            { name: 'Pilot migration', status: 'pending' },
            { name: 'Full migration', status: 'pending' },
            { name: 'Decommission legacy', status: 'pending' },
          ],
        },
      ],
      timeline: this.estimateTimeline(analysis),
      risks: this.identifyRisks(analysis),
    };

    return playbook;
  }
}
```
