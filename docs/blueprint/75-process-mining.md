# 75 — Process Mining and Workflow Discovery

## 1. Process Mining Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                  Process Mining and Workflow Discovery             │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │   Event      │  │   Process   │  │   Optimization           │ │
│  │   Log        │  │   Discovery │  │                         │ │
│  │   Collector  │  │   Engine    │  │ - Bottleneck Detection  │ │
│  │             │  │             │  │ - Conformance Checking  │ │
│  │ - DB Query  │  │ - Alpha     │  │ - Variant Analysis      │ │
│  │ - Queue     │  │   Algorithm │  │ - Simulation            │ │
│  │ - Import    │  │ - Inductive │  │ - Recommendation        │ │
│  │             │  │ - Heuristic │  │                         │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
│         │                │                    │                  │
│         └────────────────┼────────────────────┘                  │
│                          ▼                                       │
│                   ┌─────────────────────┐                        │
│                   │   Process Model     │                        │
│                   │   (BPMN/Petri Net)  │                        │
│                   └─────────────────────┘                        │
└─────────────────────────────────────────────────────────────────┘
```

## 2. Event Log Collector

```typescript
// process-mining/collector/event-log-collector.service.ts
@Injectable()
export class EventLogCollectorService {
  async collectFromDatabase(orgId: string): Promise<EventLog> {
    const events = await this.prisma.$queryRaw`
      SELECT
        id,
        organization_id,
        event_type,
        resource_type,
        resource_id,
        actor_id,
        timestamp,
        metadata
      FROM audit_logs
      WHERE organization_id = ${orgId}
      ORDER BY timestamp ASC
    `;

    return {
      traces: this.extractTraces(events),
      events: events.map((e) => ({
        caseId: e.resource_id,
        activity: e.event_type,
        timestamp: new Date(e.timestamp),
        resource: e.resource_type,
        actor: e.actor_id,
        attributes: e.metadata,
      })),
    };
  }

  async collectFromQueue(orgId: string): Promise<EventLog> {
    const jobs = await this.queueService.getJobHistory(orgId);

    return {
      traces: this.extractTracesFromJobs(jobs),
      events: jobs.flatMap((job) =>
        job.history.map((h) => ({
          caseId: job.id,
          activity: h.state,
          timestamp: new Date(h.timestamp),
          resource: job.queue,
          attributes: { duration: h.duration },
        })),
      ),
    };
  }

  private extractTraces(events: any[]): Trace[] {
    const traces = new Map<string, any[]>();

    for (const event of events) {
      const caseId = event.resource_id;
      if (!traces.has(caseId)) {
        traces.set(caseId, []);
      }
      traces.get(caseId)!.push(event);
    }

    return Array.from(traces.entries()).map(([caseId, events]) => ({
      caseId,
      events,
    }));
  }
}
```

## 3. Process Discovery

```typescript
// process-mining/discovery/process-discovery.service.ts
@Injectable()
export class ProcessDiscoveryService {
  async discover(eventLog: EventLog): Promise<ProcessModel> {
    const alphaMiner = new AlphaMiner();
    const inductiveMiner = new InductiveMiner();
    const heuristicMiner = new HeuristicMiner();

    const alphaModel = alphaMiner.discover(eventLog);
    const inductiveModel = inductiveMiner.discover(eventLog);
    const heuristicModel = heuristicMiner.discover(eventLog);

    // Select best model based on fitness and precision
    const models = [alphaModel, inductiveModel, heuristicModel];
    const bestModel = this.selectBestModel(models, eventLog);

    return {
      model: bestModel,
      fitness: this.computeFitness(bestModel, eventLog),
      precision: this.computePrecision(bestModel, eventLog),
      simplicity: this.computeSimplicity(bestModel),
      variants: this.discoverVariants(eventLog),
      bottlenecks: this.identifyBottlenecks(bestModel, eventLog),
    };
  }
}

// Alpha Miner
export class AlphaMiner {
  discover(eventLog: EventLog): ProcessModel {
    // Build footprint matrix
    const footprint = this.buildFootprintMatrix(eventLog);

    // Find places
    const places = this.findPlaces(footprint);

    // Build Petri net
    return this.buildPetriNet(places, eventLog);
  }
}

// Inductive Miner
export class InductiveMiner {
  discover(eventLog: EventLog): ProcessModel {
    // Build process tree using divide-and-conquer
    const tree = this.buildProcessTree(eventLog);

    // Convert to BPMN
    return this.convertToBPMN(tree);
  }
}
```

## 4. Conformance Checking

```typescript
// process-mining/conformance/conformance-checker.service.ts
@Injectable()
export class ConformanceCheckerService {
  async check(eventLog: EventLog, model: ProcessModel): Promise<ConformanceResult> {
    const tokenReplay = new TokenReplay();

    const replayResult = tokenReplay.replay(eventLog, model);

    const fitness = this.computeFitness(replayResult);
    const precision = this.computePrecision(eventLog, model);
    const generalization = this.computeGeneralization(eventLog, model);
    const simplicity = this.computeSimplicity(model);

    return {
      fitness,
      precision,
      generalization,
      simplicity,
      issues: this.identifyIssues(replayResult),
    };
  }

  private identifyIssues(replayResult: TokenReplayResult): ConformanceIssue[] {
    const issues: ConformanceIssue[] = [];

    for (const trace of replayResult.traces) {
      if (trace.missingTokens > 0) {
        issues.push({
          type: 'missing',
          trace: trace.traceId,
          activity: trace.missingActivity,
          severity: 'high',
        });
      }

      if (trace.remainingTokens > 0) {
        issues.push({
          type: 'remaining',
          trace: trace.traceId,
          activity: trace.remainingActivity,
          severity: 'medium',
        });
      }
    }

    return issues;
  }
}
```

## 5. Variant Analysis

```typescript
// process-mining/variants/variant-analyzer.service.ts
@Injectable()
export class VariantAnalyzerService {
  async analyze(eventLog: EventLog): Promise<VariantAnalysis> {
    const variants = this.extractVariants(eventLog);

    const analysis: VariantAnalysis = {
      totalTraces: eventLog.traces.length,
      totalVariants: variants.length,
      variants: variants.map((variant) => ({
        path: variant.path,
        count: variant.count,
        percentage: (variant.count / eventLog.traces.length) * 100,
        avgDuration: variant.avgDuration,
        cases: variant.cases,
      })),
      topVariants: variants.slice(0, 10),
      rareVariants: variants.filter((v) => v.count === 1),
    };

    return analysis;
  }

  private extractVariants(eventLog: EventLog): Variant[] {
    const variantMap = new Map<string, Variant>();

    for (const trace of eventLog.traces) {
      const path = trace.events.map((e) => e.activity).join('->');

      if (!variantMap.has(path)) {
        variantMap.set(path, {
          path,
          count: 0,
          cases: [],
          totalDuration: 0,
        });
      }

      const variant = variantMap.get(path)!;
      variant.count++;
      variant.cases.push(trace.caseId);

      const duration = this.computeTraceDuration(trace);
      variant.totalDuration += duration;
    }

    const variants = Array.from(variantMap.values());

    for (const variant of variants) {
      variant.avgDuration = variant.totalDuration / variant.count;
    }

    return variants.sort((a, b) => b.count - a.count);
  }
}
```

## 6. Bottleneck Detection

```typescript
// process-mining/bottlenecks/bottleneck-detector.service.ts
@Injectable()
export class BottleneckDetectorService {
  async detect(model: ProcessModel, eventLog: EventLog): Promise<Bottleneck[]> {
    const bottlenecks: Bottleneck[] = [];

    // Waiting time analysis
    const waitingTimes = this.computeWaitingTimes(eventLog);

    for (const [activity, times] of Object.entries(waitingTimes)) {
      const avgWait = average(times);
      const p95Wait = percentile(times, 95);

      if (p95Wait > this.BOTTLENECK_THRESHOLD) {
        bottlenecks.push({
          type: 'waiting_time',
          activity,
          avgWait,
          p95Wait,
          severity: p95Wait > this.CRITICAL_THRESHOLD ? 'critical' : 'high',
        });
      }
    }

    // Resource utilization
    const utilization = this.computeResourceUtilization(eventLog);

    for (const [resource, util] of Object.entries(utilization)) {
      if (util > this.OVERUTILIZATION_THRESHOLD) {
        bottlenecks.push({
          type: 'resource_utilization',
          resource,
          utilization: util,
          severity: util > this.CRITICAL_UTILIZATION ? 'critical' : 'high',
        });
      }
    }

    return bottlenecks.sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }
}
```

## 7. Simulation

```typescript
// process-mining/simulation/process-simulator.service.ts
@Injectable()
export class ProcessSimulatorService {
  async simulate(model: ProcessModel, params: SimulationParams): Promise<SimulationResult> {
    const simulator = new Simulator(model);

    const traces: SimulatedTrace[] = [];

    for (let i = 0; i < params.numTraces; i++) {
      const trace = await simulator.runTrace({
        startTime: params.startTime,
        resources: params.resources,
      });
      traces.push(trace);
    }

    return {
      traces,
      statistics: this.computeStatistics(traces),
      bottlenecks: this.detectBottlenecks(traces),
      recommendations: this.generateRecommendations(traces),
    };
  }
}
```

## 8. Process Mining Dashboard

```typescript
// apps/web/src/features/process-mining/components/process-mining-dashboard.tsx
export function ProcessMiningDashboard() {
  const { data: models, isLoading } = useProcessModels();
  const [selectedModel, setSelectedModel] = useState<ProcessModel | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Process Mining</h1>
        <Button onClick={() => discoverProcess()}>Discover Process</Button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader><CardTitle>Process Models</CardTitle></CardHeader>
          <CardContent>
            <Metric value={models?.length || 0} label="Discovered" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Avg Fitness</CardTitle></CardHeader>
          <CardContent>
            <Metric value={`${(models?.avgFitness || 0) * 100}%`} label="Fitness" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Bottlenecks</CardTitle></CardHeader>
          <CardContent>
            <Metric value={models?.bottleneckCount || 0} label="Detected" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Variants</CardTitle></CardHeader>
          <CardContent>
            <Metric value={models?.variantCount || 0} label="Identified" />
          </CardContent>
        </Card>
      </div>

      <ProcessMap model={selectedModel} onNodeClick={(node) => console.log(node)} />
    </div>
  );
}
```

## 9. Recommendations

```typescript
// process-mining/recommendations/recommendation-engine.service.ts
@Injectable()
export class RecommendationEngineService {
  async generate(model: ProcessModel, eventLog: EventLog): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];

    // Bottleneck recommendations
    const bottlenecks = await this.detectBottlenecks(model, eventLog);
    for (const bottleneck of bottlenecks) {
      recommendations.push({
        type: 'bottleneck',
        priority: bottleneck.severity,
        activity: bottleneck.activity,
        description: `Bottleneck detected at ${bottleneck.activity}`,
        suggestion: this.suggestBottleneckSolution(bottleneck),
        impact: 'high',
      });
    }

    // RPA opportunities
    const rpaOpportunities = this.identifyRPAOpportunities(model, eventLog);
    recommendations.push(...rpaOpportunities);

    // Process simplification
    const simplification = this.identifySimplificationOpportunities(model);
    recommendations.push(...simplification);

    return recommendations.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }
}
```
