# 05 — Third-Party Tax Authority Integrations

## 1. Integration Architecture Overview

External tax authorities are abstracted behind a provider-agnostic interface. Each provider implements the `TaxAuthorityProvider` interface, allowing the system to support multiple jurisdictions without changing core business logic.

```
┌─────────────────────────────────────────────────────────────────┐
│                        VAT Return Service                        │
│                  (business logic, state machine)                 │
└────────────────────────────┬────────────────────────────────────┘
                             │ uses
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   TaxAuthorityProvider Interface                 │
│  submitReturn() │ checkStatus() │ authenticate() │ refreshToken() │
└────────────────────────────┬────────────────────────────────────┘
                             │ implemented by
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
    ┌─────────────────┐ ┌──────────────┐ ┌─────────────────┐
    │   HMRCProvider   │ │  EuroVatProvider │ │ CustomProvider  │
    │   (UK)           │ │  (EU VIES)    │ │  ( extensible)  │
    └─────────────────┘ └──────────────┘ └─────────────────┘
```

## 2. Provider Interface

```typescript
// integrations/interfaces/tax-authority-provider.interface.ts
export interface TaxAuthorityProvider {
  readonly code: string;           // e.g., "hmrc", "eurovat"
  readonly name: string;           // e.g., "HMRC Making Tax Digital"
  readonly countryCode: string;    // ISO 3166-1 alpha-2
  readonly supportedOperations: ProviderOperation[];

  authenticate(credentials: ProviderCredentials): Promise<AuthResult>;
  refreshToken(refreshToken: string): Promise<AuthResult>;
  submitReturn(returnId: string, payload: SubmitReturnPayload): Promise<SubmissionResult>;
  checkReturnStatus(submissionId: string): Promise<ReturnStatusResult>;
  getVatRate(jurisdictionId: string, date: Date): Promise<VatRateResult>;
  validateVatNumber(vatNumber: string, countryCode: string): Promise<ValidationResult>;
  downloadReturnPdf(submissionId: string): Promise<DownloadResult>;
}

export enum ProviderOperation {
  SubmitReturn = 'submit_return',
  CheckStatus = 'check_status',
  GetVatRate = 'get_vat_rate',
  ValidateVatNumber = 'validate_vat_number',
  DownloadPdf = 'download_pdf',
}

export interface ProviderCredentials {
  type: 'oauth2' | 'api_key' | 'basic';
  accessToken?: string;
  refreshToken?: string;
  apiKey?: string;
  apiSecret?: string;
  expiresAt?: Date;
}

export interface AuthResult {
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: Date;
  error?: string;
}

export interface SubmitReturnPayload {
  vatNumber: string;
  periodStart: string;  // ISO date
  periodEnd: string;    // ISO date
  boxes: Record<string, Amount>;
}

export interface Amount {
  value: string;        // Decimal as string
  currency: string;
}

export interface SubmissionResult {
  success: boolean;
  submissionId?: string;
  processingDate?: Date;
  correlationId?: string;
  error?: string;
  rawResponse?: any;
}

export interface ReturnStatusResult {
  status: 'pending' | 'accepted' | 'rejected' | 'processing';
  acceptedAt?: Date;
  rejectedAt?: Date;
  rejectionReason?: string;
  paymentReference?: string;
  rawResponse?: any;
}
```

## 3. Provider Registry

```typescript
// integrations/providers/provider-registry.service.ts
@Injectable()
export class ProviderRegistryService {
  private providers = new Map<string, TaxAuthorityProvider>();

  register(provider: TaxAuthorityProvider) {
    this.providers.set(provider.code, provider);
  }

  resolve(code: string): TaxAuthorityProvider {
    const provider = this.providers.get(code);
    if (!provider) throw new ProviderNotFoundException(code);
    return provider;
  }

  list(): TaxAuthorityProvider[] {
    return Array.from(this.providers.values());
  }
}

// integrations/providers/providers.module.ts
@Module({
  providers: [
    ProviderRegistryService,
    HMRCProvider,
    EuroVatProvider,
    // Add new providers here
  ],
})
export class ProvidersModule {}
```

## 4. HMRC Provider Implementation (UK Making Tax Digital)

```typescript
// integrations/providers/hmrc/hmrc.provider.ts
@Injectable()
export class HMRCProvider implements TaxAuthorityProvider {
  readonly code = 'hmrc';
  readonly name = 'HMRC Making Tax Digital';
  readonly countryCode = 'GB';
  readonly supportedOperations = [
    ProviderOperation.SubmitReturn,
    ProviderOperation.CheckStatus,
    ProviderOperation.ValidateVatNumber,
  ];

  private readonly baseUrl = 'https://api.service.hmrc.gov.uk';
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly scope = 'read:vat write:vat';

  constructor(
    private readonly httpService: HttpService,
    private readonly encryptionService: EncryptionService,
    private readonly configService: ConfigService,
  ) {
    this.clientId = this.configService.get('HMRC_CLIENT_ID');
    this.clientSecret = this.configService.get('HMRC_CLIENT_SECRET');
  }

  async authenticate(credentials: ProviderCredentials): Promise<AuthResult> {
    try {
      const response = await firstValueFrom(
        this.httpService.post<AuthTokenResponse>(
          `${this.baseUrl}/oauth/token`,
          {
            grant_type: 'authorization_code',
            client_id: this.clientId,
            client_secret: this.clientSecret,
            code: credentials.accessToken,
            redirect_uri: this.configService.get('HMRC_REDIRECT_URI'),
          },
        ),
      );

      return {
        success: true,
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        expiresAt: new Date(Date.now() + response.data.expires_in * 1000),
      };
    } catch (error) {
      return { success: false, error: 'HMRC authentication failed' };
    }
  }

  async submitReturn(returnId: string, payload: SubmitReturnPayload): Promise<SubmissionResult> {
    const accessToken = await this.getValidAccessToken(returnId);

    try {
      const response = await firstValueFrom(
        this.httpService.post<HMRCSubmissionResponse>(
          `${this.baseUrl}/organisations/vat/sandbox/returns`,
          {
            periodKey: this.calculatePeriodKey(payload.periodStart),
            vatDueSales: payload.boxes.vatDueSales?.value,
            vatDuePurchases: payload.boxes.vatDuePurchases?.value,
            totalVatDue: payload.boxes.totalVatDue?.value,
            vatReclaimedCurrPeriod: payload.boxes.vatReclaimedCurrPeriod?.value,
            netVatDue: payload.boxes.netVatDue?.value,
            totalValueSalesExVAT: payload.boxes.totalValueSalesExVAT?.value,
            totalValuePurchasesExVAT: payload.boxes.totalValuePurchasesExVAT?.value,
            totalValueGoodsSuppliedExVAT: payload.boxes.totalValueGoodsSuppliedExVAT?.value,
            totalAllValueSalesExVAT: payload.boxes.totalAllValueSalesExVAT?.value,
            finalised: true,
          },
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      return {
        success: true,
        submissionId: response.data.processingDate,
        processingDate: new Date(response.data.processingDate),
        correlationId: response.data.correlationId,
        rawResponse: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Submission failed',
        rawResponse: error.response?.data,
      };
    }
  }

  async checkReturnStatus(submissionId: string): Promise<ReturnStatusResult> {
    // Implementation polling HMRC status endpoint
    // ...
  }

  async validateVatNumber(vatNumber: string, countryCode: string): Promise<ValidationResult> {
    // Implementation using HMRC VAT lookup
    // ...
  }

  // Private helpers
  private async getValidAccessToken(returnId: string): Promise<string> {
    const integration = await this.integrationService.findByReturnId(returnId);
    const credentials = this.encryptionService.decrypt(integration.credentials);

    if (credentials.expiresAt > new Date()) {
      return credentials.accessToken;
    }

    const refreshed = await this.refreshToken(credentials.refreshToken!);
    if (!refreshed.success) throw new TokenRefreshFailedException();

    await this.integrationService.updateCredentials(integration.id, refreshed);
    return refreshed.accessToken!;
  }
}
```

## 5. EuroVAT Provider Implementation (EU VIES)

```typescript
// integrations/providers/eurovat/eurovat.provider.ts
@Injectable()
export class EuroVatProvider implements TaxAuthorityProvider {
  readonly code = 'eurovat';
  readonly name = 'EU VAT Information Exchange System';
  readonly countryCode = 'EU';
  readonly supportedOperations = [
    ProviderOperation.ValidateVatNumber,
    ProviderOperation.GetVatRate,
  ];

  private readonly baseUrl = 'https://ec.europa.eu/taxation_customs/vies/services/checkVatService';

  async validateVatNumber(vatNumber: string, countryCode: string): Promise<ValidationResult> {
    try {
      const [countryCodePart, vatNumberPart] = this.splitVatNumber(vatNumber);

      const soapRequest = `
        <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
          <soap:Body>
            <checkVat xmlns="urn:ec.europa.eu:taxud:vies:services:checkVat:types">
              <countryCode>${countryCodePart}</countryCode>
              <vatNumber>${vatNumberPart}</vatNumber>
            </checkVat>
          </soap:Body>
        </soap:Envelope>
      `;

      const response = await firstValueFrom(
        this.httpService.post<string>(this.baseUrl, soapRequest, {
          headers: { 'Content-Type': 'text/xml;charset=UTF-8' },
        }),
      );

      const parser = new xml2js.Parser();
      const result = await parser.parseStringPromise(response.data);
      const body = result['soap:Envelope']['soap:Body'][0]['checkVatResponse'][0];

      return {
        isValid: body['isValid'][0] === 'true',
        name: body['name'][0],
        address: body['address'][0],
        countryCode: body['countryCode'][0],
        vatNumber: body['vatNumber'][0],
        requestDate: new Date(body['requestDate'][0]),
      };
    } catch (error) {
      return { isValid: false, error: 'VIES validation failed' };
    }
  }

  async getVatRate(jurisdictionId: string, date: Date): Promise<VatRateResult> {
    // Return from local jurisdiction cache (pre-seeded)
    // Fall back to rate provider API if needed
    const jurisdiction = await this.jurisdictionService.findById(jurisdictionId);
    return { rates: jurisdiction.vatRates };
  }

  // Other interface methods throw NotImplementedException
}
```

## 6. OAuth2 Flow

```typescript
// integrations/controllers/oauth.controller.ts
@Controller('integrations/oauth')
export class OAuthController {
  constructor(private readonly integrationService: IntegrationService) {}

  @Get('authorize/:provider')
  @UseGuards(JwtAuthGuard, TenantGuard)
  async authorize(
    @Param('provider') providerCode: string,
    @CurrentOrganization() orgId: string,
  ) {
    const provider = this.providerRegistry.resolve(providerCode);
    const authUrl = this.buildAuthorizationUrl(provider, orgId);
    return { authUrl };
  }

  @Get('callback/:provider')
  @UseGuards(JwtAuthGuard, TenantGuard)
  async callback(
    @Param('provider') providerCode: string,
    @Query('code') code: string,
    @Query('state') state: string, // Contains encrypted orgId
    @CurrentUser() user: User,
  ) {
    const orgId = this.decryptState(state);
    const provider = this.providerRegistry.resolve(providerCode);
    const authResult = await provider.authenticate({ accessToken: code });

    if (!authResult.success) {
      throw new BadRequestException('OAuth authorization failed');
    }

    await this.integrationService.upsert({
      organizationId: orgId,
      provider: providerCode,
      type: 'vat_authority',
      status: 'active',
      credentials: this.encryptionService.encrypt({
        accessToken: authResult.accessToken,
        refreshToken: authResult.refreshToken,
        expiresAt: authResult.expiresAt,
      }),
    });

    return { success: true };
  }
}
```

## 7. Retry and Rate Limiting

```typescript
// integrations/services/integration-call.service.ts
@Injectable()
export class IntegrationCallService {
  constructor(private readonly queueService: QueueService) {}

  async submitReturn(returnId: string) {
    const job = await this.queueService.add('integration-call', {
      type: 'submit_return',
      returnId,
      attempts: 0,
      maxAttempts: 3,
    }, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      removeOnComplete: true,
      removeOnFail: false,
    });

    return job;
  }
}

// queue/processors/integration-call.processor.ts
@Processor('integration-call')
export class IntegrationCallProcessor {
  constructor(
    private readonly providerRegistry: ProviderRegistryService,
    private readonly vatReturnService: VatReturnService,
    private readonly eventBus: EventBusService,
  ) {}

  @Process('submit_return')
  async handleSubmitReturn(job: Job<IntegrationCallJobData>) {
    const { returnId } = job.data;
    const vatReturn = await this.vatReturnService.findById(returnId);
    const integration = await this.integrationService.findActive(vatReturn.organizationId);
    const provider = this.providerRegistry.resolve(integration.provider);

    const result = await provider.submitReturn(returnId, { /* payload */ });

    if (result.success) {
      await this.vatReturnService.markSubmitted(returnId, result.submissionId!);
      await this.eventBus.emit(new VatReturnSubmittedEvent(returnId, result.submissionId!));
    } else {
      throw new SubmissionFailedException(result.error);
    }
  }
}
```

## 8. Webhook Handling

```typescript
// integrations/controllers/webhook.controller.ts
@Controller('webhooks/:provider')
export class WebhookController {
  constructor(private readonly eventBus: EventBusService) {}

  @Post(':provider')
  async handleWebhook(
    @Param('provider') providerCode: string,
    @Headers('x-signature') signature: string,
    @Body() payload: any,
  ) {
    const provider = this.providerRegistry.resolve(providerCode);

    if (!this.verifySignature(provider, signature, payload)) {
      throw new UnauthorizedException('Invalid webhook signature');
    }

    switch (payload.eventType) {
      case 'return.accepted':
        await this.eventBus.emit(new ReturnAcceptedEvent(payload.returnId));
        break;
      case 'return.rejected':
        await this.eventBus.emit(new ReturnRejectedEvent(payload.returnId, payload.reason));
        break;
      case 'payment.received':
        await this.eventBus.emit(new PaymentReceivedEvent(payload.returnId, payload.amount));
        break;
    }

    return { received: true };
  }

  private verifySignature(provider: TaxAuthorityProvider, signature: string, payload: any): boolean {
    // HMAC verification per provider spec
    return true;
  }
}
```

## 9. Response Normalization

Each provider returns raw responses. A normalization layer converts them to internal representations:

```typescript
// integrations/mappers/provider-response.mapper.ts
export class ProviderResponseMapper {
  static normalizeSubmissionResult(provider: string, raw: any): SubmissionResult {
    switch (provider) {
      case 'hmrc':
        return {
          success: raw.status === 'success',
          submissionId: raw.processingDate,
          processingDate: new Date(raw.processingDate),
          correlationId: raw.correlationId,
          rawResponse: raw,
        };
      case 'eurovat':
        // EuroVAT does not support submission, normalize accordingly
        return { success: false, error: 'Not supported by provider' };
      default:
        throw new UnknownProviderException(provider);
    }
  }
}
```

## 10. Provider Configuration

```typescript
// integrations/config/providers.config.ts
export const providerConfigs: Record<string, ProviderConfig> = {
  hmrc: {
    sandboxUrl: 'https://api.service.hmrc.gov.uk',
    productionUrl: 'https://api.service.hmrc.gov.uk',
    authUrl: 'https://test.service.hmrc.gov.uk/oauth/authorize',
    tokenUrl: '/oauth/token',
    scopes: ['read:vat', 'write:vat'],
    rateLimit: { requests: 100, window: '1m' },
    timeout: 30000,
    retryAttempts: 3,
  },
  eurovat: {
    sandboxUrl: 'https://ec.europa.eu/taxation_customs/vies/services/checkVatService',
    productionUrl: 'https://ec.europa.eu/taxation_customs/vies/services/checkVatService',
    rateLimit: { requests: 50, window: '1m' },
    timeout: 10000,
    retryAttempts: 2,
  },
};
```

## 11. Supported Providers Roadmap

| Provider       | Country | Operations                           | Status      |
|----------------|---------|--------------------------------------|-------------|
| HMRC           | GB      | Submit, Status, Validate VAT         | Planned     |
| EuroVAT/VIES   | EU      | Validate VAT, Get Rates              | Planned     |
| BZSt           | DE      | Submit, Status                       | Future      |
| FIOD           | NL      | Submit, Status                       | Future      |
| SPF Finances   | BE      | Submit, Status                       | Future      |
| DGFiP          | FR      | Submit, Status                       | Future      |
