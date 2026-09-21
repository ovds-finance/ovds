# 69 — Chaos Engineering and Resilience Testing

## 1. Chaos Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                  Chaos Engineering Framework                      │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │   Chaos     │  │   Steady    │  │   Blast Radius           │ │
│  │   Manager   │  │   State     │  │   Control                │ │
│  │             │  │   Verifier  │  │                         │ │
│  │ - Inject    │  │             │  │ - Environment           │ │
│  │ - Schedule  │  │ - Health    │  │ - Pod Isolation         │ │
│  │ - Rollback  │  │   Checks    │  │ - Rate Limiting         │ │
│  │             │  │             │  │ - Time Travel           │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
│         │                │                    │                  │
│         └────────────────┼────────────────────┘                  │
│                          ▼                                       │
│                   ┌─────────────────────┐                        │
│                   │   Chaos Experiment  │                        │
│                   │   Results           │                        │
│                   └─────────────────────┘                        │
└─────────────────────────────────────────────────────────────────┘
```

## 2. Chaos Manager

```typescript
// chaos/chaos-manager.service.ts
@Injectable()
export class ChaosManagerService {
  private readonly experiments = new Map<string, ChaosExperiment>();

  async scheduleExperiment(experiment: ChaosExperiment): Promise<void> {
    this.experiments.set(experiment.id, experiment);

    // Validate blast radius
    await this.validateBlastRadius(experiment);

    // Capture steady state
    const steadyState = await this.captureSteadyState(experiment);

    // Schedule chaos
    await this.scheduleChaos(experiment);

    // Monitor during chaos
    await this.monitorChaos(experiment, steadyState);
  }

  private async scheduleChaos(experiment: ChaosExperiment): Promise<void> {
    const scheduler = new ChaosScheduler();

    for (const action of experiment.actions) {
      await scheduler.schedule({
        experimentId: experiment.id,
        action: action.type,
        target: action.target,
        delay: action.delay,
        duration: action.duration,
      });
    }
  }
}
```

## 3. Fault Injection

```typescript
// chaos/faults/fault-injector.interface.ts
export interface FaultInjector {
  readonly type: FaultType;
  inject(target: FaultTarget, params: FaultParams): Promise<void>;
  rollback(target: FaultTarget): Promise<void>;
}

export type FaultType = 'pod_kill' | 'network_latency' | 'network_partition' | 'cpu_stress' | 'memory_stress' | 'disk_fill' | 'time_travel';

// chaos/faults/pod-kill.injector.ts
@Injectable()
export class PodKillInjector implements FaultInjector {
  readonly type = 'pod_kill';

  async inject(target: FaultTarget, params: FaultParams): Promise<void> {
    const pods = await this.kubernetesClient.getPods(target.selector);

    for (const pod of pods) {
      if (Math.random() < params.percentage / 100) {
        await this.kubernetesClient.deletePod(pod.metadata.name);
      }
    }
  }

  async rollback(target: FaultTarget): Promise<void> {
    // Kubernetes will automatically restart pods
    // No manual rollback needed
  }
}

// chaos/faults/network-latency.injector.ts
@Injectable()
export class NetworkLatencyInjector implements FaultInjector {
  readonly type = 'network_latency';

  async inject(target: FaultTarget, params: FaultParams): Promise<void> {
    const pods = await this.kubernetesClient.getPods(target.selector);

    for (const pod of pods) {
      await this.kubernetesClient.exec(pod.metadata.name, [
        'tc', 'qdisc', 'add', 'dev', 'eth0', 'root', 'netem',
        'delay', `${params.latency}ms`,
        ...(params.jitter ? ['jitter', `${params.jitter}ms`] : []),
      ]);
    }
  }

  async rollback(target: FaultTarget): Promise<void> {
    const pods = await this.kubernetesClient.getPods(target.selector);

    for (const pod of pods) {
      await this.kubernetesClient.exec(pod.metadata.name, [
        'tc', 'qdisc', 'del', 'dev', 'eth0', 'root',
      ]);
    }
  }
}
```

## 4. Steady State Verification

```typescript
// chaos/verification/steady-state.service.ts
@Injectable()
export class SteadyStateService {
  async captureSteadyState(experiment: ChaosExperiment): Promise<SteadyState> {
    const checks: HealthCheck[] = [];

    // Check API latency
    checks.push(await this.checkApiLatency());

    // Check error rate
    checks.push(await this.checkErrorRate());

    // Check database connectivity
    checks.push(await this.checkDatabaseConnectivity());

    // Check queue depth
    checks.push(await this.checkQueueDepth());

    // Check cache hit rate
    checks.push(await this.checkCacheHitRate());

    return {
      timestamp: new Date(),
      checks,
      overallHealth: this.computeHealth(checks),
    };
  }

  async verifySteadyState(experiment: ChaosExperiment, baseline: SteadyState): Promise<VerificationResult> {
    const current = await this.captureSteadyState(experiment);

    const violations: Violation[] = [];

    for (const check of baseline.checks) {
      const currentCheck = current.checks.find((c) => c.name === check.name);

      if (currentCheck && !this.isWithinThreshold(check, currentCheck, experiment.tolerance)) {
        violations.push({
          check: check.name,
          baseline: check.value,
          current: currentCheck.value,
          threshold: experiment.tolerance,
        });
      }
    }

    return {
      isHealthy: violations.length === 0,
      violations,
      baseline,
      current,
    };
  }
}
```

## 5. Blast Radius Control

```typescript
// chaos/blast-radius/blast-radius.service.ts
@Injectable()
export class BlastRadiusService {
  async validateBlastRadius(experiment: ChaosExperiment): Promise<ValidationResult> {
    const target = experiment.target;

    // Check if target is in production
    if (target.environment === 'production') {
      return {
        valid: false,
        reason: 'Cannot run chaos experiments in production',
      };
    }

    // Check if target is isolated
    const isolation = await this.checkIsolation(target);
    if (!isolation.isIsolated) {
      return {
        valid: false,
        reason: 'Target is not properly isolated',
      };
    }

    // Check if blast radius is within limits
    const radius = await this.computeBlastRadius(target);
    if (radius.affectedUsers > experiment.maxAffectedUsers) {
      return {
        valid: false,
        reason: `Blast radius too large: ${radius.affectedUsers} users affected`,
      };
    }

    return { valid: true };
  }

  private async computeBlastRadius(target: FaultTarget): Promise<BlastRadius> {
    const affectedPods = await this.getAffectedPods(target);
    const affectedServices = new Set(affectedPods.map((p) => p.service));

    return {
      affectedPods: affectedPods.length,
      affectedServices: Array.from(affectedServices),
      affectedUsers: await this.estimateAffectedUsers(affectedServices),
    };
  }
}
```

## 6. Time Travel

```typescript
// chaos/time-travel/time-travel.service.ts
@Injectable()
export class TimeTravelService {
  async travel(target: FaultTarget, offset: TimeOffset): Promise<void> {
    const pods = await this.kubernetesClient.getPods(target.selector);

    for (const pod of pods) {
      await this.kubernetesClient.exec(pod.metadata.name, [
        'date', '-s', offset.timestamp,
      ]);
    }
  }

  async restoreTime(target: FaultTarget): Promise<void> {
    const pods = await this.kubernetesClient.getPods(target.selector);

    for (const pod of pods) {
      await this.kubernetesClient.exec(pod.metadata.name, [
        'date', '-s', new Date().toISOString(),
      ]);
    }
  }
}
```

## 7. Chaos Dashboard

```typescript
// apps/web/src/features/chaos/components/chaos-dashboard.tsx
export function ChaosDashboard() {
  const { data: experiments, isLoading } = useChaosExperiments();
  const [selectedExperiment, setSelectedExperiment] = useState<ChaosExperiment | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Chaos Engineering</h1>
        <Button onClick={() => createExperiment()}>New Experiment</Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader><CardTitle>Active Experiments</CardTitle></CardHeader>
          <CardContent>
            <Metric value={experiments?.active || 0} label="Running" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Resilience Score</CardTitle></CardHeader>
          <CardContent>
            <ResilienceScore score={experiments?.resilienceScore || 0} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>System Health</CardTitle></CardHeader>
          <CardContent>
            <HealthIndicator health={experiments?.health || 'healthy'} />
          </CardContent>
        </Card>
      </div>

      <DataTable data={experiments?.history || []} columns={experimentColumns}>
        <TableBody>
          {experiments?.history.map((exp) => (
            <TableRow key={exp.id}>
              <TableCell>{exp.name}</TableCell>
              <TableCell><Badge variant={getStatusVariant(exp.status)}>{exp.status}</Badge></TableCell>
              <TableCell>{formatDate(exp.startedAt)}</TableCell>
              <TableCell>{formatDate(exp.completedAt)}</TableCell>
              <TableCell>
                <Button variant="ghost" size="sm" onClick={() => setSelectedExperiment(exp)}>View</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </DataTable>
    </div>
  );
}
```

## 8. Experiment Results

```typescript
// chaos/results/experiment-results.service.ts
@Injectable()
export class ExperimentResultsService {
  async saveResults(experimentId: string, results: ChaosResults): Promise<void> {
    await this.prisma.chaosExperiment.update({
      where: { id: experimentId },
      data: {
        status: 'completed',
        completedAt: new Date(),
        results: {
          steadyStateViolations: results.violations,
          resilienceScore: this.computeResilienceScore(results),
          recommendations: this.generateRecommendations(results),
        },
      },
    });
  }

  private computeResilienceScore(results: ChaosResults): number {
    const totalChecks = results.baseline.checks.length;
    const passedChecks = totalChecks - results.violations.length;

    return Math.round((passedChecks / totalChecks) * 100);
  }
}
```
