# 49 — Feature Flags and Tenant Onboarding

## 1. Feature Flag System

### 1.1 Flag Types

| Type | Scope | Persistence | Use Case |
|------|-------|-------------|----------|
| Global | All tenants | Config / DB | Beta features, kill switches |
| Tenant | Per-organization | DB | Plan-based features |
| User | Per-user | DB | A/B testing, personalization |
| Percentage | Traffic split | Redis | Gradual rollouts |

### 1.2 Feature Flag Service

```typescript
// libs/api-core/feature-flags/src/feature-flags.service.ts
@Injectable()
export class FeatureFlagService {
  private readonly flags = new Map<string, FeatureFlag>();

  constructor(private readonly prisma: PrismaService) {}

  async isEnabled(flagKey: string, context: FeatureFlagContext): boolean {
    const flag = await this.getFlag(flagKey);
    if (!flag || !flag.enabled) return false;

    switch (flag.type) {
      case 'global':
        return true;
      case 'tenant':
        return this.isEnabledForTenant(flag, context.organizationId);
      case 'user':
        return this.isEnabledForUser(flag, context.userId);
      case 'percentage':
        return this.isEnabledByPercentage(flag, context);
      default:
        return false;
    }
  }

  private async isEnabledForTenant(flag: FeatureFlag, organizationId: string): Promise<boolean> {
    const assignment = await this.prisma.featureFlagAssignment.findFirst({
      where: { flagId: flag.id, organizationId },
    });

    if (assignment) return assignment.enabled;

    // Check plan features
    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      include: { plan: true },
    });

    return org?.plan?.features?.[flag.key] ?? false;
  }

  private isEnabledForUser(flag: FeatureFlag, userId: string): boolean {
    // User-specific flag logic
    return false;
  }

  private isEnabledByPercentage(flag: FeatureFlag, context: FeatureFlagContext): boolean {
    const hash = this.hash(`${flag.id}:${context.userId || context.organizationId}`);
    const percentage = (hash % 100) / 100;
    return percentage < (flag.percentage || 0);
  }

  private hash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }
}
```

### 1.3 Feature Flag Decorator

```typescript
// libs/api-core/feature-flags/src/feature-flag.decorator.ts
export const FeatureFlag = (flagKey: string) =>
  SetMetadata('featureFlag', flagKey);

// Usage in controller
@Get('advanced-reports')
@UseGuards(FeatureFlagGuard)
@FeatureFlag('advanced_reports')
async getAdvancedReports() {
  return this.reportService.getAdvancedReports();
}
```

### 1.4 Feature Flag Guard

```typescript
// libs/api-core/feature-flags/src/feature-flag.guard.ts
@Injectable()
export class FeatureFlagGuard implements CanActivate {
  constructor(private readonly featureFlagService: FeatureFlagService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const handler = context.getHandler();
    const flagKey = Reflect.getMetadata('featureFlag', handler);

    if (!flagKey) return true;

    const request = context.switchToHttp().getRequest();
    const context_: FeatureFlagContext = {
      userId: request.user?.id,
      organizationId: request.organization?.id,
    };

    return this.featureFlagService.isEnabled(flagKey, context_);
  }
}
```

## 2. Tenant Onboarding Flow

### 2.1 Onboarding Steps

```
1. Registration
   └── Email verification

2. Organization Creation
   └── Company details
   └── Country selection
   └── Currency selection

3. Jurisdiction Setup
   └── VAT registrations
   └── Tax rates

4. First VAT Return
   └── Period selection
   └── Initial data entry

5. Integration Setup
   └── Tax authority connection
   └── Accounting system sync

6. Team Invitation
   └── Invite members
   └── Assign roles
```

### 2.2 Onboarding State Machine

```typescript
// organizations/onboarding-state.enum.ts
export enum OnboardingState {
  REGISTERED = 'registered',
  ORGANIZATION_CREATED = 'organization_created',
  JURISDICTIONS_SETUP = 'jurisdictions_setup',
  FIRST_RETURN_CREATED = 'first_return_created',
  INTEGRATIONS_CONNECTED = 'integrations_connected',
  TEAM_INVITED = 'team_invited',
  COMPLETED = 'completed',
}
```

### 2.3 Onboarding Service

```typescript
// organizations/services/onboarding.service.ts
@Injectable()
export class OnboardingService {
  constructor(private readonly prisma: PrismaService) {}

  async getState(organizationId: string): Promise<OnboardingState> {
    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        vatRegistrations: true,
        vatReturns: true,
        integrations: true,
        users: true,
      },
    });

    if (org.users.length > 1) return OnboardingState.TEAM_INVITED;
    if (org.integrations.length > 0) return OnboardingState.INTEGRATIONS_CONNECTED;
    if (org.vatReturns.length > 0) return OnboardingState.FIRST_RETURN_CREATED;
    if (org.vatRegistrations.length > 0) return OnboardingState.JURISDICTIONS_SETUP;
    if (org.settings?.onboardingCompleted) return OnboardingState.COMPLETED;

    return OnboardingState.ORGANIZATION_CREATED;
  }

  async completeStep(organizationId: string, step: OnboardingState): Promise<void> {
    await this.prisma.organization.update({
      where: { id: organizationId },
      data: {
        settings: {
          ...(await this.getSettings(organizationId)),
          onboardingStep: step,
          onboardingCompleted: step === OnboardingState.COMPLETED,
        },
      },
    });
  }
}
```

### 2.4 Onboarding Wizard

```typescript
// apps/web/src/features/onboarding/components/onboarding-wizard.tsx
export function OnboardingWizard() {
  const { data: state } = useOnboardingState();
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    { id: 'organization', title: 'Organization', component: OrganizationStep },
    { id: 'jurisdictions', title: 'Jurisdictions', component: JurisdictionsStep },
    { id: 'registrations', title: 'VAT Registrations', component: RegistrationsStep },
    { id: 'first-return', title: 'First Return', component: FirstReturnStep },
    { id: 'integrations', title: 'Integrations', component: IntegrationsStep },
    { id: 'team', title: 'Team', component: TeamStep },
  ];

  const CurrentStepComponent = steps[currentStep].component;

  return (
    <div className="max-w-3xl mx-auto">
      <Stepper currentStep={currentStep} steps={steps} onChange={setCurrentStep} />
      <div className="mt-8">
        <CurrentStepComponent onComplete={() => setCurrentStep((s) => s + 1)} />
      </div>
    </div>
  );
}
```

## 3. Self-Service Provisioning

```typescript
// organizations/services/provisioning.service.ts
@Injectable()
export class ProvisioningService {
  async provisionOrganization(data: ProvisioningData): Promise<Organization> {
    // 1. Create organization
    const org = await this.createOrganization(data);

    // 2. Create owner user
    const owner = await this.createOwnerUser(org.id, data.owner);

    // 3. Seed tenant data
    await this.tenantSeedService.seedOrganization(org.id);

    // 4. Setup default integrations
    await this.setupDefaultIntegrations(org.id, data.countryCode);

    // 5. Send welcome email
    await this.notificationService.send({
      organizationId: org.id,
      userId: owner.id,
      type: 'welcome',
      title: 'Welcome to VAT SaaS',
      message: 'Your organization is ready.',
    });

    return org;
  }
}
```

## 4. Data Residency

```typescript
// organizations/services/data-residency.service.ts
export enum DataRegion {
  EU = 'eu',
  US = 'us',
  APAC = 'apac',
}

@Injectable()
export class DataResidencyService {
  async getRegionForCountry(countryCode: string): Promise<DataRegion> {
    const euCountries = ['DE', 'FR', 'NL', 'BE', 'IT', 'ES', 'PL', 'AT', 'PT', 'GR'];
    if (euCountries.includes(countryCode)) return DataRegion.EU;

    const usCountries = ['US', 'CA'];
    if (usCountries.includes(countryCode)) return DataRegion.US;

    return DataRegion.APAC;
  }

  async assignDatabase(organizationId: string, countryCode: string): Promise<void> {
    const region = await this.getRegionForCountry(countryCode);
    const databaseUrl = this.getDatabaseUrl(region);

    await this.prisma.organization.update({
      where: { id: organizationId },
      data: { databaseUrl, dataRegion: region },
    });
  }
}
```

## 5. Compliance Onboarding

```typescript
// organizations/services/compliance-onboarding.service.ts
@Injectable()
export class ComplianceOnboardingService {
  async setupCompliance(orgId: string, countryCode: string): Promise<void> {
    // 1. Determine applicable regulations
    const regulations = this.getApplicableRegulations(countryCode);

    // 2. Create compliance settings
    await this.prisma.complianceSettings.create({
      data: {
        organizationId: orgId,
        regulations,
        dataRetentionYears: this.getRetentionPeriod(countryCode),
        gdprEnabled: this.isGDPRApplicable(countryCode),
        consentRequired: true,
      },
    });

    // 3. Create default consent templates
    await this.createConsentTemplates(orgId, regulations);
  }
}
```
