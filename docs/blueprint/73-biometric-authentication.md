# 73 — Biometric Authentication and Identity Verification

## 1. Biometric Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│              Biometric Authentication and Identity                 │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │   Biometric │  │   Identity  │  │   Verification           │ │
│  │   Capture   │  │   Store     │  │   Engine                 │ │
│  │             │  │             │  │                         │ │
│  │ - Finger   │  │ - Encrypted  │  │ - Liveness Detection    │ │
│  │   Print    │  │   Templates  │  │ - Template Matching     │ │
│  │ - Face     │  │ - HSM       │  │ - Multi-modal Fusion    │ │
│  │ - Voice    │  │ - Zero-Know │  │ - Risk Scoring          │ │
│  │ - Iris     │  │   ledge     │  │                         │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
│         │                │                    │                  │
│         └────────────────┼────────────────────┘                  │
│                          ▼                                       │
│                   ┌─────────────────────┐                        │
│                   │   Identity Provider │                        │
│                   │   (FIDO2/WebAuthn)  │                        │
│                   └─────────────────────┘                        │
└─────────────────────────────────────────────────────────────────┘
```

## 2. Biometric Service

```typescript
// biometrics/biometric.service.ts
@Injectable()
export class BiometricService {
  async register(userId: string, type: BiometricType, data: BiometricData): Promise<RegistrationResult> {
    // Liveness detection
    const livenessResult = await this.livenessDetector.detect(data);

    if (!livenessResult.isLive) {
      throw new LivenessDetectionFailedException();
    }

    // Extract template
    const template = await this.extractTemplate(type, data);

    // Encrypt template
    const encryptedTemplate = await this.encryptTemplate(template);

    // Store in HSM
    const storedTemplate = await this.hsmService.storeBiometricTemplate(userId, type, encryptedTemplate);

    return {
      success: true,
      templateId: storedTemplate.id,
      confidence: livenessResult.confidence,
    };
  }

  async verify(userId: string, type: BiometricType, data: BiometricData): Promise<VerificationResult> {
    // Liveness detection
    const livenessResult = await this.livenessDetector.detect(data);

    if (!livenessResult.isLive) {
      return { success: false, reason: 'liveness_failed', confidence: 0 };
    }

    // Extract template
    const template = await this.extractTemplate(type, data);

    // Retrieve stored template
    const storedTemplate = await this.hsmService.getBiometricTemplate(userId, type);

    // Decrypt
    const decryptedTemplate = await this.decryptTemplate(storedTemplate.encryptedData);

    // Match
    const matchResult = await this.matchTemplates(template, decryptedTemplate);

    return {
      success: matchResult.score > this.MATCH_THRESHOLD,
      score: matchResult.score,
      confidence: matchResult.confidence,
    };
  }
}
```

## 3. Face Recognition

```typescript
// biometrics/face/face-recognition.service.ts
@Injectable()
export class FaceRecognitionService {
  async extractTemplate(image: Buffer): Promise<FaceTemplate> {
    const detection = await this.faceDetector.detect(image);

    if (detection.faces.length === 0) {
      throw new NoFaceDetectedException();
    }

    const face = detection.faces[0];

    const landmarks = await this.landmarkDetector.detect(image, face.boundingBox);
    const embedding = await this.faceNet.computeEmbedding(image, landmarks);

    return {
      embedding: Array.from(embedding),
      landmarks: landmarks.map((l) => ({ x: l.x, y: l.y })),
      boundingBox: face.boundingBox,
    };
  }

  async matchTemplates(template1: FaceTemplate, template2: FaceTemplate): Promise<MatchResult> {
    const similarity = this.computeCosineSimilarity(template1.embedding, template2.embedding);

    return {
      score: similarity,
      confidence: this.scoreToConfidence(similarity),
      match: similarity > 0.7,
    };
  }
}
```

## 4. Fingerprint Recognition

```typescript
// biometrics/fingerprint/fingerprint.service.ts
@Injectable()
export class FingerprintService {
  async extractTemplate(image: Buffer): Promise<FingerprintTemplate> {
    const enhanced = await this.enhanceImage(image);
    const minutiae = await this.extractMinutiae(enhanced);

    return {
      minutiae: minutiae.map((m) => ({ x: m.x, y: m.y, angle: m.angle, type: m.type })),
      quality: this.computeQuality(minutiae),
    };
  }

  private async extractMinutiae(image: Buffer): Promise<Minutia[]> {
    const skeleton = await this.skeletonize(image);
    const ridgeEndings = await this.findRidgeEndings(skeleton);
    const bifurcations = await this.findBifurcations(skeleton);

    return [...ridgeEndings, ...bifurcations];
  }
}
```

## 5. Voice Biometrics

```typescript
// biometrics/voice/voice-biometrics.service.ts
@Injectable()
export class VoiceBiometricsService {
  async extractTemplate(audio: Buffer): Promise<VoiceTemplate> {
    const features = await this.extractFeatures(audio);

    return {
      mfcc: features.mfcc,
      pitch: features.pitch,
      formants: features.formants,
      prosody: features.prosody,
    };
  }

  private async extractFeatures(audio: Buffer): Promise<VoiceFeatures> {
    const mfcc = await this.computeMFCC(audio);
    const pitch = await this.computePitch(audio);
    const formants = await this.computeFormants(audio);
    const prosody = await this.computeProsody(audio);

    return { mfcc, pitch, formants, prosody };
  }
}
```

## 6. Multi-Modal Fusion

```typescript
// biometrics/fusion/multi-modal.service.ts
@Injectable()
export class MultiModalService {
  async verify(userId: string, inputs: BiometricInputs): Promise<VerificationResult> {
    const results: VerificationResult[] = [];

    if (inputs.face) {
      results.push(await this.faceService.verify(userId, 'face', inputs.face));
    }

    if (inputs.fingerprint) {
      results.push(await this.fingerprintService.verify(userId, 'fingerprint', inputs.fingerprint));
    }

    if (inputs.voice) {
      results.push(await this.voiceService.verify(userId, 'voice', inputs.voice));
    }

    // Fuse results
    const fusedScore = this.fuseScores(results);

    return {
      success: fusedScore > this.FUSION_THRESHOLD,
      score: fusedScore,
      modalities: results.map((r) => ({ type: r.type, score: r.score })),
    };
  }

  private fuseScores(results: VerificationResult[]): number {
    // Weighted fusion
    const weights = { face: 0.4, fingerprint: 0.4, voice: 0.2 };

    const weightedSum = results.reduce((sum, r) => {
      const weight = weights[r.type as keyof typeof weights] || 0.33;
      return sum + r.score * weight;
    }, 0);

    const totalWeight = results.reduce((sum, r) => {
      const weight = weights[r.type as keyof typeof weights] || 0.33;
      return sum + weight;
    }, 0);

    return weightedSum / totalWeight;
  }
}
```

## 7. Liveness Detection

```typescript
// biometrics/liveness/liveness-detector.service.ts
@Injectable()
export class LivenessDetectorService {
  async detectFaceLiveness(image: Buffer): Promise<LivenessResult> {
    const checks: LivenessCheck[] = [];

    // Check for spoofing artifacts
    checks.push(await this.checkSpoofingArtifacts(image));

    // Check for 3D depth
    checks.push(await this.checkDepth(image));

    // Check for micro-movements (if video)
    checks.push(await this.checkMicroMovements(image));

    // Check for texture
    checks.push(await this.checkTexture(image));

    const isLive = checks.every((c) => c.passed);
    const confidence = checks.reduce((sum, c) => sum + c.confidence, 0) / checks.length;

    return { isLive, confidence, checks };
  }

  async detectFingerprintLiveness(image: Buffer): Promise<LivenessResult> {
    const checks: LivenessCheck[] = [];

    // Check for conductivity
    checks.push(await this.checkConductivity(image));

    // Check for pulse
    checks.push(await this.checkPulse(image));

    // Check for sweat pores
    checks.push(await this.checkPores(image));

    const isLive = checks.every((c) => c.passed);
    const confidence = checks.reduce((sum, c) => sum + c.confidence, 0) / checks.length;

    return { isLive, confidence, checks };
  }
}
```

## 8. Identity Verification

```typescript
// biometrics/verification/identity-verifier.service.ts
@Injectable()
export class IdentityVerifierService {
  async verifyIdentity(userId: string, documents: IdentityDocument[]): Promise<VerificationResult> {
    const results: DocumentVerification[] = [];

    for (const doc of documents) {
      const result = await this.verifyDocument(doc);
      results.push(result);
    }

    const allVerified = results.every((r) => r.verified);
    const averageConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;

    return {
      verified: allVerified && averageConfidence > 0.8,
      confidence: averageConfidence,
      documents: results,
    };
  }

  private async verifyDocument(document: IdentityDocument): Promise<DocumentVerification> {
    // OCR extraction
    const ocrResult = await this.ocrService.extractText(document.image);

    // Validate format
    const formatValid = this.validateDocumentFormat(ocrResult.text, document.type);

    // Check for tampering
    const tamperingCheck = await this.detectTampering(document.image);

    // Cross-reference with database
    const crossReference = await this.crossReference(document, ocrResult);

    return {
      type: document.type,
      verified: formatValid && !tamperingCheck.tampered && crossReference.match,
      confidence: this.computeConfidence(formatValid, tamperingCheck, crossReference),
      extractedData: ocrResult.text,
      tampering: tamperingCheck,
    };
  }
}
```

## 9. FIDO2/WebAuthn Integration

```typescript
// biometrics/fido2/fido2.service.ts
@Injectable()
export class FIDO2Service {
  async beginRegistration(userId: string): Promise<RegistrationOptions> {
    const challenge = crypto.randomBytes(32);

    await this.storeChallenge(userId, challenge);

    return {
      challenge: challenge.toString('base64url'),
      rp: {
        name: this.config.get('APP_NAME'),
        id: this.config.get('APP_DOMAIN'),
      },
      user: {
        id: Buffer.from(userId).toString('base64url'),
        name: userId,
        displayName: userId,
      },
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 },  // ES256
        { type: 'public-key', alg: -257 }, // RS256
      ],
      timeout: 60000,
      attestation: 'direct',
    };
  }

  async finishRegistration(userId: string, response: RegistrationResponse): Promise<Credential> {
    const challenge = await this.getChallenge(userId);

    const verification = await this.webauthn.verifyRegistrationResponse({
      challenge,
      response,
      origin: this.config.get('APP_URL'),
      rpId: this.config.get('APP_DOMAIN'),
    });

    if (verification.verified) {
      await this.storeCredential(userId, verification.registrationInfo);
      return verification.registrationInfo;
    }

    throw new RegistrationFailedException();
  }
}
```

## 10. Risk Scoring

```typescript
// biometrics/risk/risk-scoring.service.ts
@Injectable()
export class RiskScoringService {
  async computeRiskScore(context: AuthContext): Promise<RiskScore> {
    const factors: RiskFactor[] = [];

    // Location risk
    factors.push(await this.computeLocationRisk(context.ip, context.location));

    // Device risk
    factors.push(await this.computeDeviceRisk(context.device));

    // Behavior risk
    factors.push(await this.computeBehaviorRisk(context.userId, context));

    // Time risk
    factors.push(await this.computeTimeRisk(context.timestamp));

    // Biometric risk
    factors.push(await this.computeBiometricRisk(context.biometric));

    const score = this.computeScore(factors);

    return {
      score,
      level: this.getRiskLevel(score),
      factors,
      recommendation: this.getRecommendation(score, factors),
    };
  }

  private computeScore(factors: RiskFactor[]): number {
    const weights = {
      location: 0.25,
      device: 0.25,
      behavior: 0.2,
      time: 0.1,
      biometric: 0.2,
    };

    let score = 0;

    for (const factor of factors) {
      const weight = weights[factor.type as keyof typeof weights] || 0.2;
      score += factor.score * weight;
    }

    return Math.min(100, Math.max(0, score));
  }
}
```
