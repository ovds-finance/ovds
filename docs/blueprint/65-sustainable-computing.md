# 65 — Sustainable Computing and Green Operations

## 1. Green Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Sustainable Computing                          │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │   Energy    │  │   Carbon    │  │   Optimization           │ │
│  │   Monitoring│  │   Tracking  │  │                         │ │
│  │             │  │             │  │ - Query Optimization    │ │
│  │ - Per-pod  │  │ - Scope 1/2 │  │ - Batch Processing      │ │
│  │ - Per-svc  │  │   /3       │  │ - Cold Storage          │ │
│  │ - Per-region│  │ - Offsets  │  │ - Edge Computing        │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
│         │                │                    │                  │
│         └────────────────┼────────────────────┘                  │
│                          ▼                                       │
│                   ┌─────────────────────┐                        │
│                   │   Carbon-aware       │                        │
│                   │   Scheduler          │                        │
│                   └─────────────────────┘                        │
└─────────────────────────────────────────────────────────────────┘
```

## 2. Energy Monitoring

```typescript
// sustainability/energy/energy-monitoring.service.ts
@Injectable()
export class EnergyMonitoringService {
  async collectMetrics(): Promise<EnergyMetrics> {
    const pods = await this.kubernetesClient.getPods();

    const podMetrics = await Promise.all(
      pods.map(async (pod) => {
        const metrics = await this.kubernetesClient.getPodMetrics(pod.metadata.name);
        const energy = this.convertToEnergy(metrics);

        return {
          podName: pod.metadata.name,
          namespace: pod.metadata.namespace,
          cpuEnergy: energy.cpu,
          memoryEnergy: energy.memory,
          networkEnergy: energy.network,
          totalEnergy: energy.total,
        };
      }),
    );

    return {
      timestamp: new Date(),
      pods: podMetrics,
      totalEnergy: podMetrics.reduce((sum, p) => sum + p.totalEnergy, 0),
      region: this.getRegion(),
    };
  }

  private convertToEnergy(metrics: PodMetrics): EnergyBreakdown {
    // Convert CPU/Memory usage to energy using SPECpower profiles
    const cpuEnergy = this.cpuToEnergy(metrics.cpu.usage);
    const memoryEnergy = this.memoryToEnergy(metrics.memory.usage);
    const networkEnergy = this.networkToEnergy(metrics.network);

    return {
      cpu: cpuEnergy,
      memory: memoryEnergy,
      network: networkEnergy,
      total: cpuEnergy + memoryEnergy + networkEnergy,
    };
  }
}
```

## 3. Carbon Tracking

```typescript
// sustainability/carbon/carbon-tracking.service.ts
@Injectable()
export class CarbonTrackingService {
  async calculateCarbonFootprint(energy: EnergyMetrics): Promise<CarbonFootprint> {
    const gridIntensity = await this.getGridCarbonIntensity(energy.region);

    const scope1 = this.calculateScope1(energy); // Direct emissions
    const scope2 = this.calculateScope2(energy, gridIntensity); // Indirect from electricity
    const scope3 = this.calculateScope3(energy); // Other indirect

    return {
      scope1,
      scope2,
      scope3,
      total: scope1 + scope2 + scope3,
      unit: 'kgCO2e',
      region: energy.region,
      timestamp: new Date(),
    };
  }

  private calculateScope2(energy: EnergyMetrics, gridIntensity: number): number {
    // Scope 2: Electricity consumption
    const kWh = this.convertJoulesToKWh(energy.totalEnergy);
    return kWh * gridIntensity;
  }
}
```

## 4. Carbon-aware Scheduling

```typescript
// sustainability/scheduler/carbon-aware-scheduler.service.ts
@Injectable()
export class CarbonAwareSchedulerService {
  async scheduleJob(job: BatchJob, earliestStart: Date, latestEnd: Date): Promise<Schedule> {
    const carbonForecast = await this.getCarbonForecast(earliestStart, latestEnd);

    // Find optimal time slot with lowest carbon intensity
    const optimalSlot = this.findOptimalSlot(carbonForecast, job.duration);

    return {
      scheduledAt: optimalSlot.start,
      estimatedCarbon: optimalSlot.carbonIntensity * job.estimatedEnergy,
    };
  }

  async deferNonCritical(): Promise<void> {
    const currentCarbonIntensity = await this.getCurrentGridIntensity();

    if (currentCarbonIntensity > this.HIGH_CARBON_THRESHOLD) {
      const nonCriticalJobs = await this.getNonCriticalJobs();

      for (const job of nonCriticalJobs) {
        await this.deferJob(job.id, 'high_carbon_intensity');
      }
    }
  }
}
```

## 5. Query Optimization

```typescript
// sustainability/optimization/green-query.service.ts
@Injectable()
export class GreenQueryService {
  async optimizeForEnergy(query: Query): Promise<OptimizedQuery> {
    const plan = await this.analyzeQueryPlan(query);

    const optimizations: QueryOptimization[] = [];

    // Batch small queries
    if (plan.hasManySmallQueries) {
      optimizations.push({
        type: 'batch',
        description: 'Combine N queries into 1 batch',
        estimatedEnergySaving: '15%',
      });
    }

    // Use indexes
    if (!plan.usesIndex) {
      optimizations.push({
        type: 'index',
        description: 'Add index to reduce full table scans',
        estimatedEnergySaving: '40%',
      });
    }

    // Use materialized views
    if (plan.isAggregation && !plan.usesMaterializedView) {
      optimizations.push({
        type: 'materialized_view',
        description: 'Pre-compute aggregation',
        estimatedEnergySaving: '60%',
      });
    }

    return { optimizations, optimizedQuery: this.applyOptimizations(query, optimizations) };
  }
}
```

## 6. Cold Storage

```typescript
// sustainability/storage/cold-storage.service.ts
@Injectable()
export class ColdStorageService {
  async archiveToCold(data: ArchiveableData): Promise<ArchiveResult> {
    const accessPattern = await this.analyzeAccessPattern(data.id);

    if (accessPattern.lastAccessDays > 90) {
      // Move to cold storage (Glacier)
      await this.storageService.moveToGlacier(data.storagePath);

      return {
        status: 'archived',
        storageClass: 'GLACIER',
        estimatedSavings: this.calculateSavings(data.size, 'GLACIER'),
      };
    }

    return { status: 'skipped', reason: 'frequent_access' };
  }

  async restoreFromCold(archiveId: string): Promise<RestoreResult> {
    const archive = await this.prisma.archive.findUnique({ where: { id: archiveId } });

    await this.storageService.restoreFromGlacier(archive.path, {
      days: 3,
      tier: 'Standard',
    });

    return {
      status: 'restoring',
      estimatedCompletion: addDays(new Date(), 3),
    };
  }
}
```

## 7. Sustainability Dashboard

```typescript
// apps/web/src/features/sustainability/components/sustainability-dashboard.tsx
export function SustainabilityDashboard() {
  const { data: metrics, isLoading } = useEnergyMetrics();
  const [period, setPeriod] = useState('last_30_days');

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Sustainability Dashboard</h1>

      <div className="grid grid-cols-4 gap-4">
        <MetricCard title="Total Energy" value={`${metrics?.totalEnergy.toFixed(1)} kWh`} />
        <MetricCard title="Carbon Footprint" value={`${metrics?.carbonFootprint.toFixed(2)} kg CO2e`} />
        <MetricCard title="Carbon Intensity" value={`${metrics?.gridIntensity.toFixed(0)} g/kWh`} />
        <MetricCard title="Efficiency Score" value={`${metrics?.efficiencyScore}%`} trend={metrics?.efficiencyTrend} />
      </div>

      <ChartCard data={metrics?.dailyData} title="Daily Energy Consumption" />
      <ChartCard data={metrics?.carbonData} title="Daily Carbon Emissions" />
    </div>
  );
}
```

## 8. Sustainability Policy

```typescript
// sustainability/policy/sustainability-policy.service.ts
@Injectable()
export class SustainabilityPolicyService {
  async enforcePolicies(): Promise<void> {
    // Policy 1: Defer non-critical jobs during peak carbon hours
    await this.deferNonCriticalJobs();

    // Policy 2: Consolidate small queries
    await this.consolidateQueries();

    // Policy 3: Archive old data to cold storage
    await this.archiveOldData();

    // Policy 4: Scale down during low usage
    await this.scaleDownIdlePods();
  }

  async generateSustainabilityReport(orgId: string, period: DateRange): Promise<SustainabilityReport> {
    const energy = await this.getEnergyData(orgId, period);
    const carbon = await this.calculateCarbon(energy);
    const optimizations = await this.getOptimizations(orgId, period);

    return {
      organizationId: orgId,
      period,
      energy,
      carbon,
      optimizations,
      savings: this.calculateSavings(optimizations),
      rating: this.computeSustainabilityRating(carbon.total),
    };
  }
}
```
