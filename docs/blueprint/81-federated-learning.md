# 81 — Federated Learning and Privacy-Preserving AI

## 1. Federated Learning Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                  Federated Learning Architecture                  │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │   Client    │  │   Aggregator│  │   Privacy Layer          │ │
│  │   Nodes     │  │   Server    │  │                         │ │
│  │             │  │             │  │ - Differential Privacy  │ │
│  │ - Local     │  │ - FedAvg    │  │ - Secure Aggregation    │ │
│  │   Training  │  │ - FedProx   │  │ - Homomorphic Encryption│ │
│  │ - On-Device │  │ - FedOPT    │  │ - MPC                   │ │
│  │ - Edge      │  │ - FedAdam   │  │                         │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
│         │                │                    │                  │
│         └────────────────┼────────────────────┘                  │
│                          ▼                                       │
│                   ┌─────────────────────┐                        │
│                   │   Global Model      │                        │
│                   │   (Updated)         │                        │
│                   └─────────────────────┘                        │
└─────────────────────────────────────────────────────────────────┘
```

## 2. Federated Learning Service

```typescript
// federated/federated-learning.service.ts
@Injectable()
export class FederatedLearningService {
  private readonly clients = new Map<string, ClientNode>();
  private readonly globalModel: GlobalModel;

  async registerClient(client: ClientNode): Promise<void> {
    this.clients.set(client.id, client);

    await this.sendGlobalModel(client);
  }

  async trainRound(round: number): Promise<TrainingRound> {
    const selectedClients = this.selectClients(round);

    const updates: ModelUpdate[] = [];

    for (const client of selectedClients) {
      const update = await this.trainClient(client, round);
      updates.push(update);
    }

    const aggregated = await this.aggregateUpdates(updates);

    await this.updateGlobalModel(aggregated);

    return {
      round,
      clients: selectedClients.length,
      updates: updates.length,
      globalModelVersion: this.globalModel.version,
    };
  }

  private async trainClient(client: ClientNode, round: number): Promise<ModelUpdate> {
    const model = await this.getClientModel(client);

    const localData = await this.getLocalData(client);

    const trainedModel = await model.train(localData, {
      epochs: 5,
      batchSize: 32,
    });

    const update = this.computeUpdate(model, trainedModel);

    return {
      clientId: client.id,
      round,
      update: this.applyPrivacy(update, client.privacyConfig),
    };
  }
}
```

## 3. Aggregation Algorithms

```typescript
// federated/aggregation/aggregator.service.ts
@Injectable()
export class AggregatorService {
  async fedAvg(updates: ModelUpdate[]): Promise<ModelWeights> {
    const totalSize = updates.reduce((sum, u) => sum + u.dataSize, 0);

    const aggregated = updates.reduce((acc, update) => {
      const weight = update.dataSize / totalSize;

      for (const [key, value] of Object.entries(update.weights)) {
        if (!acc[key]) acc[key] = 0;
        acc[key] += weight * value;
      }

      return acc;
    }, {} as ModelWeights);

    return aggregated;
  }

  async fedProx(updates: ModelUpdate[], globalWeights: ModelWeights, mu: number): Promise<ModelWeights> {
    const aggregated = await this.fedAvg(updates);

    // Apply proximal term
    for (const key of Object.keys(aggregated)) {
      aggregated[key] = aggregated[key] - mu * (aggregated[key] - globalWeights[key]);
    }

    return aggregated;
  }

  async secureAggregation(updates: ModelUpdate[]): Promise<ModelWeights> {
    // Use secret sharing for secure aggregation
    const shares = updates.map((u) => this.splitIntoShares(u.weights));

    const aggregatedShares = this.aggregateShares(shares);

    return this.reconstructFromShares(aggregatedShares);
  }
}
```

## 4. Differential Privacy

```typescript
// federated/privacy/differential-privacy.service.ts
@Injectable()
export class DifferentialPrivacyService {
  async applyDP(weights: ModelWeights, epsilon: number, delta: number): Promise<ModelWeights> {
    const sensitivity = this.computeSensitivity(weights);
    const noiseScale = (sensitivity / epsilon) * Math.sqrt(2 * Math.log(1.25 / delta));

    const noisyWeights: ModelWeights = {};

    for (const [key, value] of Object.entries(weights)) {
      noisyWeights[key] = value + this.sampleLaplace(0, noiseScale);
    }

    return noisyWeights;
  }

  private sampleLaplace(mean: number, scale: number): number {
    const u = Math.random() - 0.5;
    return mean - scale * Math.sign(u) * Math.log(1 - 2 * Math.abs(u));
  }

  private computeSensitivity(weights: ModelWeights): number {
    let maxSensitivity = 0;

    for (const value of Object.values(weights)) {
      const sensitivity = Math.max(...Object.values(value).map(Math.abs));
      maxSensitivity = Math.max(maxSensitivity, sensitivity);
    }

    return maxSensitivity;
  }
}
```

## 5. Secure Aggregation

```typescript
// federated/privacy/secure-aggregation.service.ts
@Injectable()
export class SecureAggregationService {
  async setup(clientIds: string[]): Promise<SecureAggregationSetup> {
    const keys = new Map<string, KeyPair>();

    for (const clientId of clientIds) {
      keys.set(clientId, await this.generateKeyPair());
    }

    return { keys, publicKeys: new Map([...keys].map(([id, kp]) => [id, kp.publicKey])) };
  }

  async aggregate(updates: SecureUpdate[]): Promise<AggregatedResult> {
    const decrypted = updates.map((u) => this.decryptUpdate(u));

    const sum = decrypted.reduce((acc, update) => {
      for (const [key, value] of Object.entries(update.weights)) {
        if (!acc[key]) acc[key] = 0;
        acc[key] += value;
      }
      return acc;
    }, {} as ModelWeights);

    const count = decrypted.length;

    for (const key of Object.keys(sum)) {
      sum[key] = sum[key] / count;
    }

    return { weights: sum, count };
  }
}
```

## 6. Client Selection

```typescript
// federated/selection/client-selector.service.ts
@Injectable()
export class ClientSelectorService {
  async selectClients(round: number, config: SelectionConfig): Promise<ClientNode[]> {
    const available = await this.getAvailableClients();

    switch (config.strategy) {
      case 'random':
        return this.selectRandom(available, config.fraction);
      case 'power_of_choice':
        return this.selectPowerOfChoice(available, config.fraction);
      case 'weighted':
        return this.selectWeighted(available, config.fraction);
      case 'stratified':
        return this.selectStratified(available, config.fraction);
      default:
        return this.selectRandom(available, config.fraction);
    }
  }

  private selectRandom(clients: ClientNode[], fraction: number): ClientNode[] {
    const count = Math.max(1, Math.floor(clients.length * fraction));
    return this.shuffle(clients).slice(0, count);
  }

  private selectPowerOfChoice(clients: ClientNode[], fraction: number): ClientNode[] {
    const sampleSize = Math.min(10, clients.length);
    const sample = this.selectRandom(clients, sampleSize / clients.length);

    return sample
      .sort((a, b) => a.quality - b.quality)
      .slice(0, Math.floor(sampleSize * fraction));
  }
}
```

## 7. Model Compression

```typescript
// federated/compression/model-compression.service.ts
@Injectable()
export class ModelCompressionService {
  async compress(weights: ModelWeights, method: CompressionMethod): Promise<CompressedWeights> {
    switch (method) {
      case 'quantization':
        return this.quantize(weights);
      case 'sparsification':
        return this.sparsify(weights);
      case 'sketching':
        return this.sketch(weights);
      case 'subsampling':
        return this.subsample(weights);
      default:
        return this.quantize(weights);
    }
  }

  private quantize(weights: ModelWeights): CompressedWeights {
    const quantized: CompressedWeights = {};

    for (const [key, value] of Object.entries(weights)) {
      const flat = Object.values(value);
      const min = Math.min(...flat);
      const max = Math.max(...flat);

      const scale = (max - min) / 255;
      const zeroPoint = -min / scale;

      quantized[key] = {
        data: flat.map((v) => Math.round((v - min) / scale)),
        scale,
        zeroPoint,
        shape: Object.values(value).length,
      };
    }

    return quantized;
  }
}
```

## 8. Convergence Monitoring

```typescript
// federated/monitoring/convergence-monitor.service.ts
@Injectable()
export class ConvergenceMonitorService {
  async checkConvergence(history: TrainingRound[]): Promise<ConvergenceReport> {
    if (history.length < 5) {
      return { converged: false, reason: 'insufficient_history' };
    }

    const losses = history.slice(-10).map((r) => r.loss);
    const trend = this.computeTrend(losses);

    const variance = this.computeVariance(losses.slice(-5));

    return {
      converged: trend.slope > -0.01 && variance < 0.001,
      trend,
      variance,
      currentLoss: losses[losses.length - 1],
      recommendation: this.getRecommendation(trend, variance),
    };
  }

  private computeTrend(values: number[]): Trend {
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = values;

    const meanX = x.reduce((a, b) => a + b) / n;
    const meanY = y.reduce((a, b) => a + b) / n;

    const numerator = x.reduce((sum, xi, i) => sum + (xi - meanX) * (y[i] - meanY), 0);
    const denominator = x.reduce((sum, xi) => sum + Math.pow(xi - meanX, 2), 0);

    const slope = numerator / denominator;
    const intercept = meanY - slope * meanX;

    return { slope, intercept, r2: this.computeR2(x, y, slope, intercept) };
  }
}
```

## 9. Heterogeneous Data Handling

```typescript
// federated/heterogeneity/heterogeneous-handler.service.ts
@Injectable()
export class HeterogeneousHandlerService {
  async alignData(clients: ClientNode[]): Promise<AlignedData> {
    const schemas = await this.getSchemas(clients);

    const unifiedSchema = this.unifySchemas(schemas);

    const alignedData = await Promise.all(
      clients.map((client) => this.alignClientData(client, unifiedSchema)),
    );

    return { schema: unifiedSchema, data: alignedData };
  }

  private unifySchemas(schemas: Schema[]): UnifiedSchema {
    const allFields = new Set<string>();

    for (const schema of schemas) {
      for (const field of schema.fields) {
        allFields.add(field.name);
      }
    }

    return {
      fields: Array.from(allFields).map((name) => ({
        name,
        types: schemas.map((s) => s.fields.find((f) => f.name === name)?.type).filter(Boolean),
        required: schemas.every((s) => s.fields.some((f) => f.name === name && f.required)),
      })),
    };
  }
}
```

## 10. Federated Dashboard

```typescript
// apps/web/src/features/federated-learning/components/federated-dashboard.tsx
export function FederatedDashboard() {
  const { data: rounds, isLoading } = useTrainingRounds();
  const [selectedRound, setSelectedRound] = useState<TrainingRound | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Federated Learning</h1>
        <Button onClick={() => startTrainingRound()}>Start Round</Button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader><CardTitle>Active Clients</CardTitle></CardHeader>
          <CardContent>
            <Metric value={rounds?.activeClients || 0} label="Online" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Current Round</CardTitle></CardHeader>
          <CardContent>
            <Metric value={rounds?.currentRound || 0} label="Round" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Global Loss</CardTitle></CardHeader>
          <CardContent>
            <Metric value={rounds?.currentLoss?.toFixed(4) || '0'} label="Loss" trend={rounds?.lossTrend} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Convergence</CardTitle></CardHeader>
          <CardContent>
            <Badge variant={rounds?.converged ? 'default' : 'secondary'}>
              {rounds?.converged ? 'Converged' : 'Training'}
            </Badge>
          </CardContent>
        </Card>
      </div>

      <ChartCard data={rounds?.lossHistory} title="Training Loss" />
    </div>
  );
}
```
