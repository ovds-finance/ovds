# 94 — Brain-Computer Interfaces and Neural Control

## 1. BCI Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│              Brain-Computer Interfaces                             │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │   Neural    │  │   Signal    │  │   Application Layer      │ │
│  │   Interface │  │   Processing│  │                         │ │
│  │             │  │             │  │ - Control               │ │
│  │ - EEG       │  │ - Filter    │  │ - Communication         │ │
│  │ - ECoG      │  │ - Feature   │  │ - Rehabilitation         │ │
│  │ - Invasive  │  │   Extract   │  │ - Enhancement           │ │
│  │ - fNIRS     │  │ - Decode    │  │ - Gaming                │ │
│  │             │  │ - Classify  │  │ - Medical               │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
│         │                │                    │                  │
│         └────────────────┼────────────────────┘                  │
│                          ▼                                       │
│                   ┌─────────────────────┐                        │
│                   │   Neural            │                        │
│                   │   Feedback Loop     │                        │
│                   └─────────────────────┘                        │
└─────────────────────────────────────────────────────────────────┘
```

## 2. BCI Service

```typescript
// bci/bci.service.ts
@InjectInject()
export class BCIService {
  async connect(config: BCIConfig): Promise<BCIConnection> {
    const interface = this.getInterface(config.type);

    const connection = await interface.connect(config);

    await this.calibrate(connection);

    return connection;
  }

  async processSignal(connection: BCIConnection, signal: NeuralSignal): Promise<ProcessedSignal> {
    // Step 1: Filter noise
    const filtered = await this.filter(signal);

    // Step 2: Extract features
    const features = await this.extractFeatures(filtered);

    // Step 3: Classify intent
    const intent = await this.classifyIntent(features);

    return {
      connection: connection.id,
      intent,
      confidence: intent.confidence,
      features,
    };
  }

  async executeCommand(connection: BCIConnection, intent: Intent): Promise<CommandResult> {
    const command = await this.mapIntentToCommand(intent);

    return this.execute(command);
  }

  private async calibrate(connection: BCIConnection): Promise<CalibrationResult> {
    const baseline = await this.recordBaseline(connection);

    const thresholds = await this.computeThresholds(baseline);

    connection.calibration = { baseline, thresholds };

    return { success: true, thresholds };
  }
}
```

## 3. Signal Processing

```typescript
// bci/signal/signal-processor.service.ts
@InjectInject()
export class SignalProcessorService {
  async filter(signal: NeuralSignal): Promise<FilteredSignal> {
    // Bandpass filter (1-50 Hz for EEG)
    const bandpassed = this.bandpassFilter(signal.data, 1, 50);

    // Notch filter (remove 50/60 Hz power line noise)
    const notched = this.notchFilter(bandpassed, 50);

    // Remove artifacts
    const cleaned = await this.removeArtifacts(notched);

    return { ...signal, data: cleaned };
  }

  async extractFeatures(signal: FilteredSignal): Promise<SignalFeatures> {
    const features: SignalFeatures = {
      timeDomain: this.extractTimeDomainFeatures(signal.data),
      frequencyDomain: this.extractFrequencyDomainFeatures(signal.data),
      timeFrequency: await this.extractTimeFrequencyFeatures(signal.data),
      nonLinear: this.extractNonLinearFeatures(signal.data),
    };

    return features;
  }

  private extractTimeDomainFeatures(data: number[]): TimeDomainFeatures {
    return {
      mean: mean(data),
      variance: variance(data),
      stdDev: standardDeviation(data),
      max: max(data),
      min: min(data),
      zeroCrossings: this.countZeroCrossings(data),
      peakToPeak: max(data) - min(data),
    };
  }

  private extractFrequencyDomainFeatures(data: number[]): FrequencyDomainFeatures {
    const fft = this.computeFFT(data);

    const bands = {
      delta: this.extractBand(fft, 0.5, 4),
      theta: this.extractBand(fft, 4, 8),
      alpha: this.extractBand(fft, 8, 13),
      beta: this.extractBand(fft, 13, 30),
      gamma: this.extractBand(fft, 30, 100),
    };

    return {
      bands,
      spectralCentroid: this.computeSpectralCentroid(fft),
      spectralEntropy: this.computeSpectralEntropy(fft),
      dominantFrequency: this.findDominantFrequency(fft),
    };
  }
}
```

## 4. Intent Classification

```typescript
// bci/intent/intent-classifier.service.ts
@InjectInject()
export class IntentClassifierService {
  async classify(features: SignalFeatures): Promise<Intent> {
    const model = await this.loadModel();

    const predictions = await model.predict(features);

    const intents = predictions.map((p, i) => ({
      type: this.INTENT_LABELS[i],
      confidence: p,
    }));

    intents.sort((a, b) => b.confidence - a.confidence);

    return {
      type: intents[0].type,
      confidence: intents[0].confidence,
      alternatives: intents.slice(1, 4),
      features,
    };
  }
}
```

## 5. Neural Feedback

```typescript
// bci/feedback/neural-feedback.service.ts
@InjectInject()
export class NeuralFeedbackService {
  async provideFeedback(connection: BCIConnection, result: CommandResult): Promise<void> {
    const success = result.success;

    if (success) {
      await this.positiveReinforcement(connection);
    } else {
      await this.negativeReinforcement(connection);
    }

    await this.updateModel(connection, result);
  }

  private async positiveReinforcement(connection: BCIConnection): Promise<void> {
    // Increase reward signal
    await this.stimulate(connection, {
      region: 'ventral_tegmental_area',
      intensity: 0.7,
      duration: 100,
    });
  }

  private async negativeReinforcement(connection: BCIConnection): Promise<void> {
    // Decrease reward signal
    await this.stimulate(connection, {
      region: 'ventral_tegmental_area',
      intensity: 0.3,
      duration: 50,
    });
  }
}
```

## 6. Invasive Interfaces

```typescript
// bci/invasive/invasive-interface.service.ts
@InjectInject()
export class InvasiveInterfaceService {
  async implantElectrodeArray(config: ImplantConfig): Promise<Implant> {
    const array = await this.fabricateElectrodeArray(config);

    const surgeryPlan = await this.generateSurgeryPlan(config);

    const implant: Implant = {
      id: v4(),
      array,
      surgeryPlan,
      status: 'implanted',
      implantedAt: new Date(),
    };

    await this.storeImplant(implant);

    return implant;
  }

  async recordNeuralActivity(implant: Implant): Promise<NeuralActivity> {
    const signals = await this.readElectrodes(implant.array);

    const spikes = await this.detectSpikes(signals);

    const lfp = await this.computeLFP(signals);

    return {
      implantId: implant.id,
      timestamp: new Date(),
      spikes,
      lfp,
    };
  }

  async stimulate(implant: Implant, params: StimulationParams): Promise<StimulationResult> {
    const waveform = this.generateWaveform(params);

    await this.applyStimulation(implant.array, waveform);

    return {
      implantId: implant.id,
      parameters: params,
      timestamp: new Date(),
    };
  }
}
```

## 7. Non-Invasive Interfaces

```typescript
// bci/non-invasive/non-invasive-interface.service.ts
@InjectInject()
export class NonInvasiveInterfaceService {
  async connectEEG(config: EEGConfig): Promise<EEGConnection> {
    const headset = await this.getHeadset(config.deviceId);

    await headset.connect();

    const impedance = await this.checkImpedance(headset);

    if (impedance.average > this.IMPEDANCE_THRESHOLD) {
      throw new ImpedanceException('Electrode impedance too high');
    }

    return {
      headset,
      impedance,
      status: 'connected',
    };
  }

  async connectfNIRS(config: fNIRSConfig): Promise<fNIRSConnection> {
    const device = await this.getfNIRSDevice(config.deviceId);

    await device.connect();

    const signal = await device.startMeasurement();

    return {
      device,
      signal,
      status: 'connected',
    };
  }
}
```

## 8. Rehabilitation

```typescript
// bci/rehabilitation/rehabilitation.service.ts
@InjectInject()
export class RehabilitationService {
  async createProtocol(patient: Patient, condition: Condition): Promise<RehabilitationProtocol> {
    const exercises = await this.selectExercises(patient, condition);

    const feedback = await this.configureFeedback(patient, exercises);

    return {
      id: v4(),
      patientId: patient.id,
      condition,
      exercises,
      feedback,
      duration: 12, // weeks
      sessionsPerWeek: 5,
    };
  }

  async runSession(protocol: RehabilitationProtocol): Promise<SessionResult> {
    const exercise = protocol.exercises[protocol.currentExercise];

    const signal = await this.readSignal();

    const performance = await this.evaluatePerformance(signal, exercise);

    const feedback = await this.generateFeedback(performance, protocol.feedback);

    await this.provideFeedback(feedback);

    return {
      exercise: exercise.id,
      performance,
      feedback,
      completed: performance.score > exercise.threshold,
    };
  }
}
```

## 9. Neural Control

```typescript
// bci/control/neural-control.service.ts
@InjectInject()
export class NeuralControlService {
  async controlDevice(connection: BCIConnection, device: Device): Promise<ControlResult> {
    const intent = await this.getIntent(connection);

    const command = await this.translateIntent(intent, device);

    const executed = await device.execute(command);

    await this.provideFeedback(connection, executed);

    return {
      device: device.id,
      command,
      executed,
      timestamp: new Date(),
    };
  }

  async controlAvatar(connection: BCIConnection, avatar: Avatar): Promise<AvatarControlResult> {
    const movement = await this.decodeMovement(connection);

    await avatar.move(movement);

    const feedback = await this.sendProprioceptiveFeedback(connection, avatar.position);

    return {
      avatar: avatar.id,
      movement,
      feedback,
    };
  }
}
```

## 10. BCI Dashboard

```typescript
// apps/web/src/features/bci/components/bci-dashboard.tsx
export function BCIDashboard() {
  const { data: connection, isLoading } = useBCIConnection();
  const [selectedChannel, setSelectedChannel] = useState<number | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Brain-Computer Interface</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => calibrate()}>Calibrate</Button>
          <Button onClick={() => startSession()}>Start Session</Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader><CardTitle>Connection Status</CardTitle></CardHeader>
          <CardContent>
            <Badge variant={connection?.connected ? 'default' : 'secondary'}>
              {connection?.connected ? 'Connected' : 'Disconnected'}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Signal Quality</CardTitle></CardHeader>
          <CardContent>
            <Metric value={`${(connection?.signalQuality || 0).toFixed(1)}%`} label="Quality" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Current Intent</CardTitle></CardHeader>
          <CardContent>
            <Badge variant="outline">{connection?.currentIntent || 'Neutral'}</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Confidence</CardTitle></CardHeader>
          <CardContent>
            <Metric value={`${((connection?.confidence || 0) * 100).toFixed(1)}%`} label="Confidence" />
          </CardContent>
        </Card>
      </div>

      <EEGVisualization channels={connection?.channels || []} onSelect={setSelectedChannel} />
    </div>
  );
}
```
