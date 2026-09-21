# 96 — Ambient Computing and Context-Aware Systems

## 1. Ambient Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│              Ambient Computing and Context-Aware                  │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │   Sensors   │  │   Context   │  │   Adaptive Services      │ │
│  │             │  │   Engine    │  │                         │ │
│  │ - Motion    │  │             │  │ - Proactive              │ │
│  │ - Ambient   │  │ - User     │  │ - Predictive             │ │
│  │ - Location  │  │   Profile   │  │ - Invisible              │ │
│  │ - Biometric │  │ - Activity  │  │ - Privacy-Preserving     │ │
│  │ - Environ   │  │ - Environ   │  │                         │ │
│  │             │  │             │  │                         │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
│         │                │                    │                  │
│         └────────────────┼────────────────────┘                  │
│                          ▼                                       │
│                   ┌─────────────────────┐                        │
│                   │   Privacy Layer     │                        │
│                   │   (Edge + Local)    │                        │
│                   └─────────────────────┘                        │
└─────────────────────────────────────────────────────────────────┘
```

## 2. Context Engine

```typescript
// ambient/context/context-engine.service.ts
@InjectInject()
export class ContextEngineService {
  async buildContext(userId: string): Promise<UserContext> {
    const location = await this.getLocation(userId);
    const activity = await this.detectActivity(userId);
    const environment = await this.getEnvironment(userId);
    const preferences = await this.getPreferences(userId);
    const calendar = await this.getCalendar(userId);
    const health = await this.getHealthData(userId);

    return {
      userId,
      location,
      activity,
      environment,
      preferences,
      calendar,
      health,
      timestamp: new Date(),
    };
  }

  async predictNextAction(context: UserContext): Promise<PredictedAction> {
    const model = await this.loadPredictionModel();

    const features = this.extractFeatures(context);

    const prediction = await model.predict(features);

    return {
      action: prediction.action,
      confidence: prediction.confidence,
      parameters: prediction.parameters,
    };
  }
}
```

## 3. Sensor Fusion

```typescript
// ambient/sensors/sensor-fusion.service.ts
@InjectInject()
export class SensorFusionService {
  async fuse(sensors: Sensor[]): Promise<FusedData> {
    const readings = await Promise.all(
      sensors.map((sensor) => this.readSensor(sensor)),
    );

    const fused = this.kalmanFilter(readings);

    return {
      fused,
      confidence: this.computeConfidence(readings),
      sensors: readings.map((r) => ({ id: r.sensorId, quality: r.quality })),
    };
  }

  private kalmanFilter(readings: SensorReading[]): FusedReading {
    let state = { value: 0, uncertainty: 1 };

    for (const reading of readings) {
      // Predict
      const predictedState = {
        value: state.value,
        uncertainty: state.uncertainty + reading.processNoise,
      };

      // Update
      const kalmanGain = predictedState.uncertainty / (predictedState.uncertainty + reading.measurementNoise);
      state.value = predictedState.value + kalmanGain * (reading.value - predictedState.value);
      state.uncertainty = (1 - kalmanGain) * predictedState.uncertainty;
    }

    return { value: state.value, uncertainty: state.uncertainty };
  }
}
```

## 4. Adaptive Services

```typescript
// ambient/adaptive/adaptive-service.service.ts
@InjectInject()
export class AdaptiveServiceService {
  async adapt(context: UserContext, service: Service): Promise<AdaptedService> {
    const adaptations: Adaptation[] = [];

    // Proactive adaptation
    adaptations.push(...await this.proactiveAdaptations(context, service));

    // Predictive adaptation
    adaptations.push(...await this.predictiveAdaptations(context, service));

    // Environmental adaptation
    adaptations.push(...await this.environmentalAdaptations(context, service));

    return {
      service: service.id,
      adaptations,
      adaptedAt: new Date(),
    };
  }

  private async proactiveAdaptations(context: UserContext, service: Service): Promise<Adaptation[]> {
    const adaptations: Adaptation[] = [];

    // If user is in meeting, mute notifications
    if (context.activity.type === 'meeting') {
      adaptations.push({
        type: 'mute_notifications',
        parameters: { duration: context.calendar.nextEvent?.duration || 60 },
      });
    }

    // If user is driving, enable voice mode
    if (context.activity.type === 'driving') {
      adaptations.push({
        type: 'enable_voice',
        parameters: {},
      });
    }

    // If user is sleeping, enable do not disturb
    if (context.activity.type === 'sleeping') {
      adaptations.push({
        type: 'do_not_disturb',
        parameters: { until: context.health.sleepEndTime },
      });
    }

    return adaptations;
  }
}
```

## 5. Privacy-Preserving Context

```typescript
// ambient/privacy/privacy-preserving-context.service.ts
@InjectInject()
export class PrivacyPreservingContextService {
  async anonymize(context: UserContext): Promise<AnonymizedContext> {
    // Remove direct identifiers
    const anonymized = this.removeIdentifiers(context);

    // Apply differential privacy
    const privateData = await this.addDifferentialPrivacy(anonymized);

    // Local processing only
    const localOnly = this.keepLocal(privateData);

    return localOnly;
  }

  private keepLocal(context: UserContext): AnonymizedContext {
    return {
      ...context,
      userId: 'anonymous',
      location: this.approxLocation(context.location),
      health: this.approxHealth(context.health),
      processedLocally: true,
    };
  }

  private approxLocation(location: Location): ApproxLocation {
    return {
      latitude: this.roundTo(location.latitude, 0.01), // ~1km precision
      longitude: this.roundTo(location.longitude, 0.01),
      accuracy: 1000,
    };
  }
}
```

## 6. Activity Recognition

```typescript
// ambient/activity/activity-recognition.service.ts
@InjectInject()
export class ActivityRecognitionService {
  async recognizeActivity(sensorData: SensorData): Promise<Activity> {
    const features = this.extractFeatures(sensorData);

    const model = await this.loadActivityModel();

    const predictions = await model.predict(features);

    const activity = predictions.reduce((max, p) => (p.confidence > max.confidence ? p : max));

    return {
      type: activity.type,
      confidence: activity.confidence,
      startTime: new Date(),
      metadata: activity.metadata,
    };
  }

  private extractFeatures(data: SensorData): ActivityFeatures {
    return {
      accelerometer: this.extractAccelerometerFeatures(data.accelerometer),
      gyroscope: this.extractGyroscopeFeatures(data.gyroscope),
      magnetometer: this.extractMagnetometerFeatures(data.magnetometer),
      barometer: this.extractBarometerFeatures(data.barometer),
      gps: this.extractGPSFeatures(data.gps),
    };
  }
}
```

## 7. Environmental Adaptation

```typescript
// ambient/environment/environmental-adaptation.service.ts
@InjectInject()
export class EnvironmentalAdaptationService {
  async adaptToEnvironment(context: UserContext, app: App): Promise<EnvironmentalAdaptation> {
    const adaptations: EnvironmentalAdaptation[] = [];

    // Lighting adaptation
    if (context.environment.lighting < 50) {
      adaptations.push({
        type: 'dark_mode',
        parameters: {},
      });
    }

    // Noise adaptation
    if (context.environment.noiseLevel > 70) {
      adaptations.push({
        type: 'reduce_audio',
        parameters: { volume: 0.5 },
      });
    }

    // Temperature adaptation
    if (context.environment.temperature > 28) {
      adaptations.push({
        type: 'cool_theme',
        parameters: {},
      });
    }

    return {
      adaptations,
      timestamp: new Date(),
    };
  }
}
```

## 8. Smart Home Integration

```typescript
// ambient/smart-home/smart-home.service.ts
@InjectInject()
export class SmartHomeService {
  async controlDevice(device: SmartDevice, command: DeviceCommand): Promise<CommandResult> {
    const context = await this.getContext(device.room);

    // Auto-adjust based on context
    if (command.type === 'turn_on_light' && context.activity.type === 'sleeping') {
      command.parameters.brightness = 10;
    }

    const result = await this.device.execute(command);

    return result;
  }

  async automateScene(scene: Scene, trigger: Trigger): Promise<void> {
    if (await this.evaluateTrigger(trigger)) {
      for (const action of scene.actions) {
        await this.executeAction(action);
      }
    }
  }
}
```

## 9. Health Integration

```typescript
// ambient/health/health-integration.service.ts
@InjectInject()
export class HealthIntegrationService {
  async monitorHealth(userId: string): Promise<HealthMonitor> {
    const healthData = await this.collectHealthData(userId);

    const anomalies = await this.detectAnomalies(healthData);

    const alerts = await this.generateAlerts(anomalies);

    return {
      userId,
      healthData,
      anomalies,
      alerts,
      timestamp: new Date(),
    };
  }

  async suggestAdaptations(health: HealthMonitor, context: UserContext): Promise<Adaptation[]> {
    const adaptations: Adaptation[] = [];

    if (health.anomalies.some((a) => a.type === 'high_stress')) {
      adaptations.push({
        type: 'suggest_break',
        parameters: { duration: 5 },
      });
    }

    if (health.anomalies.some((a) => a.type === 'sleep_deprivation')) {
      adaptations.push({
        type: 'suggest_rest',
        parameters: {},
      });
    }

    return adaptations;
  }
}
```

## 10. Ambient Dashboard

```typescript
// apps/web/src/features/ambient/components/ambient-dashboard.tsx
export function AmbientDashboard() {
  const { data: context, isLoading } = useUserContext();
  const [selectedDevice, setSelectedDevice] = useState<SmartDevice | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Ambient Computing</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => configureSensors()}>Sensors</Button>
          <Button onClick={() => manageScenes()}>Scenes</Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader><CardTitle>Active Sensors</CardTitle></CardHeader>
          <CardContent>
            <Metric value={context?.sensors || 0} label="Online" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Current Activity</CardTitle></CardHeader>
          <CardContent>
            <Badge variant="outline">{context?.activity?.type || 'Unknown'}</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Environment</CardTitle></CardHeader>
          <CardContent>
            <Metric value={`${context?.environment?.temperature || 0}°C`} label="Temp" />
            <Metric value={`${context?.environment?.lighting || 0}%`} label="Light" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Adaptations</CardTitle></CardHeader>
          <CardContent>
            <Metric value={context?.adaptations || 0} label="Active" />
          </CardContent>
        </Card>
      </div>

      <ContextVisualization context={context} onSelect={setSelectedDevice} />
    </div>
  );
}
```
