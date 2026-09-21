# 44 — API Client SDK and Type Generation

## 1. OpenAPI-First Development

All API contracts are defined in OpenAPI 3.1 and used to generate type-safe clients.

```yaml
# apps/api/openapi/openapi.yaml
openapi: 3.1.0
info:
  title: VAT Declaration System API
  version: 1.0.0
  description: Online VAT Declaration SaaS API

servers:
  - url: https://api.vat-saas.com/v1
    description: Production
  - url: http://localhost:3001/v1
    description: Development

paths:
  /vat-returns:
    get:
      tags: [vat-returns]
      summary: List VAT returns
      security:
        - bearerAuth: []
      parameters:
        - name: page
          in: query
          schema: { type: integer, default: 1 }
        - name: limit
          in: query
          schema: { type: integer, default: 20 }
        - name: status
          in: query
          schema: { type: string, enum: [draft, submitted, accepted, rejected, paid] }
        - name: periodStart
          in: query
          schema: { type: string, format: date }
        - name: periodEnd
          in: query
          schema: { type: string, format: date }
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                type: object
                properties:
                  success: { type: boolean }
                  data:
                    type: array
                    items:
                      $ref: '#/components/schemas/VatReturn'
                  meta:
                    $ref: '#/components/schemas/PaginationMeta'
    post:
      tags: [vat-returns]
      summary: Create VAT return
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateVatReturnRequest'
      responses:
        '201':
          description: VAT return created
          content:
            application/json:
              schema:
                type: object
                properties:
                  success: { type: boolean }
                  data:
                    $ref: '#/components/schemas/VatReturn'

  /vat-returns/{id}:
    get:
      tags: [vat-returns]
      summary: Get VAT return
      security:
        - bearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema: { type: string }
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                type: object
                properties:
                  success: { type: boolean }
                  data:
                    $ref: '#/components/schemas/VatReturn'

  /vat-returns/{id}/submit:
    post:
      tags: [vat-returns]
      summary: Submit VAT return
      security:
        - bearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema: { type: string }
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/SubmitVatReturnRequest'
      responses:
        '200':
          description: VAT return submitted
          content:
            application/json:
              schema:
                type: object
                properties:
                  success: { type: boolean }
                  data:
                    $ref: '#/components/schemas/VatReturn'

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

  schemas:
    VatReturn:
      type: object
      required: [id, organizationId, vatRegistrationId, periodStart, periodEnd, dueDate, status]
      properties:
        id: { type: string, format: uuid }
        organizationId: { type: string, format: uuid }
        vatRegistrationId: { type: string, format: uuid }
        periodStart: { type: string, format: date }
        periodEnd: { type: string, format: date }
        dueDate: { type: string, format: date }
        status: { type: string, enum: [draft, pending_review, submitted, accepted, rejected, paid] }
        submissionId: { type: string, nullable: true }
        submittedAt: { type: string, format: date-time, nullable: true }
        acceptedAt: { type: string, format: date-time, nullable: true }
        rejectedAt: { type: string, format: date-time, nullable: true }
        rejectionReason: { type: string, nullable: true }
        version: { type: integer }
        totalSales: { type: number, nullable: true }
        totalPurchases: { type: number, nullable: true }
        totalVatDue: { type: number, nullable: true }
        totalVatReclaim: { type: number, nullable: true }
        netVatDue: { type: number, nullable: true }
        currencyCode: { type: string, maxLength: 3 }
        items:
          type: array
          items:
            $ref: '#/components/schemas/VatReturnItem'
        createdAt: { type: string, format: date-time }
        updatedAt: { type: string, format: date-time }

    VatReturnItem:
      type: object
      required: [id, vatReturnId, type, boxCode, netAmount, vatRate, vatAmount, grossAmount]
      properties:
        id: { type: string, format: uuid }
        vatReturnId: { type: string, format: uuid }
        type: { type: string, enum: [sales, purchases, adjustments, corrections] }
        boxCode: { type: string }
        description: { type: string, nullable: true }
        netAmount: { type: number }
        vatRate: { type: number }
        vatAmount: { type: number }
        grossAmount: { type: number }
        currencyCode: { type: string, maxLength: 3 }
        transactionId: { type: string, nullable: true }
        createdAt: { type: string, format: date-time }

    CreateVatReturnRequest:
      type: object
      required: [vatRegistrationId, periodStart, periodEnd, items]
      properties:
        vatRegistrationId: { type: string, format: uuid }
        periodStart: { type: string, format: date }
        periodEnd: { type: string, format: date }
        dueDate: { type: string, format: date, nullable: true }
        notes: { type: string, nullable: true }
        items:
          type: array
          items:
            $ref: '#/components/schemas/CreateVatReturnItemRequest'

    CreateVatReturnItemRequest:
      type: object
      required: [type, boxCode, netAmount, vatRate, vatAmount, grossAmount]
      properties:
        type: { type: string, enum: [sales, purchases, adjustments, corrections] }
        boxCode: { type: string }
        description: { type: string, nullable: true }
        netAmount: { type: number }
        vatRate: { type: number }
        vatAmount: { type: number }
        grossAmount: { type: number }
        transactionId: { type: string, nullable: true }

    SubmitVatReturnRequest:
      type: object
      required: [confirmAccuracy, confirmSubmission]
      properties:
        confirmAccuracy: { type: boolean }
        confirmSubmission: { type: boolean }
        notes: { type: string, nullable: true }

    PaginationMeta:
      type: object
      properties:
        page: { type: integer }
        limit: { type: integer }
        total: { type: integer }
        totalPages: { type: integer }

    Error:
      type: object
      properties:
        code: { type: string }
        message: { type: string }
        details: { type: array, items: { type: object } }
```

## 2. TypeScript Client Generation

```typescript
// apps/web/src/lib/api/types.ts
// Generated from OpenAPI schema

export interface VatReturn {
  id: string;
  organizationId: string;
  vatRegistrationId: string;
  periodStart: string;
  periodEnd: string;
  dueDate: string;
  status: 'draft' | 'pending_review' | 'submitted' | 'accepted' | 'rejected' | 'paid';
  submissionId?: string;
  submittedAt?: string;
  acceptedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  version: number;
  totalSales?: number;
  totalPurchases?: number;
  totalVatDue?: number;
  totalVatReclaim?: number;
  netVatDue?: number;
  currencyCode: string;
  items: VatReturnItem[];
  createdAt: string;
  updatedAt: string;
}

export interface VatReturnItem {
  id: string;
  vatReturnId: string;
  type: 'sales' | 'purchases' | 'adjustments' | 'corrections';
  boxCode: string;
  description?: string;
  netAmount: number;
  vatRate: number;
  vatAmount: number;
  grossAmount: number;
  currencyCode: string;
  transactionId?: string;
  createdAt: string;
}

export interface CreateVatReturnRequest {
  vatRegistrationId: string;
  periodStart: string;
  periodEnd: string;
  dueDate?: string;
  notes?: string;
  items: CreateVatReturnItemRequest[];
}

export interface CreateVatReturnItemRequest {
  type: 'sales' | 'purchases' | 'adjustments' | 'corrections';
  boxCode: string;
  description?: string;
  netAmount: number;
  vatRate: number;
  vatAmount: number;
  grossAmount: number;
  transactionId?: string;
}

export interface SubmitVatReturnRequest {
  confirmAccuracy: boolean;
  confirmSubmission: boolean;
  notes?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any[];
  };
}
```

## 3. API Client Implementation

```typescript
// apps/web/src/lib/api/client.ts
import axios, { AxiosInstance, AxiosError } from 'axios';
import { useAuthStore } from '@/stores/auth.store';

export class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: import.meta.env.VITE_API_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    this.client.interceptors.request.use((config) => {
      const token = useAuthStore.getState().token;
      const orgId = useAuthStore.getState().organizationId;

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      if (orgId) {
        config.headers['X-Organization-ID'] = orgId;
      }

      return config;
    });

    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError<ApiError>) => {
        if (error.response?.status === 401) {
          await useAuthStore.getState().logout();
          window.location.href = '/login';
        }
        return Promise.reject(error);
      },
    );
  }

  async get<T>(url: string, params?: any): Promise<T> {
    const response = await this.client.get(url, { params });
    return response.data.data;
  }

  async post<T>(url: string, data?: any): Promise<T> {
    const response = await this.client.post(url, data);
    return response.data.data;
  }

  async put<T>(url: string, data?: any): Promise<T> {
    const response = await this.client.put(url, data);
    return response.data.data;
  }

  async patch<T>(url: string, data?: any): Promise<T> {
    const response = await this.client.patch(url, data);
    return response.data.data;
  }

  async delete(url: string): Promise<void> {
    await this.client.delete(url);
  }
}

export const apiClient = new ApiClient();
```

## 4. Feature-Specific API Services

```typescript
// apps/web/src/features/vat-returns/services/vat-returns.service.ts
import { apiClient } from '@/lib/api/client';
import type { VatReturn, VatReturnItem, CreateVatReturnRequest, SubmitVatReturnRequest, PaginatedResponse } from '@/lib/api/types';

export class VatReturnsService {
  async list(params: {
    page?: number;
    limit?: number;
    status?: string;
    periodStart?: string;
    periodEnd?: string;
  }): Promise<PaginatedResponse<VatReturn>> {
    return apiClient.get('/vat-returns', params);
  }

  async getById(id: string): Promise<VatReturn> {
    return apiClient.get(`/vat-returns/${id}`);
  }

  async create(data: CreateVatReturnRequest): Promise<VatReturn> {
    return apiClient.post('/vat-returns', data);
  }

  async update(id: string, data: Partial<CreateVatReturnRequest>): Promise<VatReturn> {
    return apiClient.put(`/vat-returns/${id}`, data);
  }

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/vat-returns/${id}`);
  }

  async submit(id: string, data: SubmitVatReturnRequest): Promise<VatReturn> {
    return apiClient.post(`/vat-returns/${id}/submit`, data);
  }

  async getItems(vatReturnId: string): Promise<VatReturnItem[]> {
    return apiClient.get(`/vat-returns/${vatReturnId}/items`);
  }
}

export const vatReturnsService = new VatReturnsService();
```

## 5. React Query Hooks

```typescript
// apps/web/src/features/vat-returns/hooks/use-vat-returns.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vatReturnsService } from '../services/vat-returns.service';

export function useVatReturns(filters: {
  page?: number;
  limit?: number;
  status?: string;
  periodStart?: string;
  periodEnd?: string;
} = {}) {
  return useQuery({
    queryKey: ['vat-returns', filters],
    queryFn: () => vatReturnsService.list(filters),
  });
}

export function useVatReturn(id: string) {
  return useQuery({
    queryKey: ['vat-returns', id],
    queryFn: () => vatReturnsService.getById(id),
    enabled: !!id,
  });
}

export function useVatReturnItems(vatReturnId: string) {
  return useQuery({
    queryKey: ['vat-returns', vatReturnId, 'items'],
    queryFn: () => vatReturnsService.getItems(vatReturnId),
    enabled: !!vatReturnId,
  });
}

export function useCreateVatReturn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: vatReturnsService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vat-returns'] });
    },
  });
}

export function useUpdateVatReturn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => vatReturnsService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['vat-returns'] });
      queryClient.invalidateQueries({ queryKey: ['vat-returns', variables.id] });
    },
  });
}

export function useDeleteVatReturn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: vatReturnsService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vat-returns'] });
    },
  });
}

export function useSubmitVatReturn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => vatReturnsService.submit(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['vat-returns'] });
      queryClient.invalidateQueries({ queryKey: ['vat-returns', variables.id] });
    },
  });
}
```

## 6. Code Generation Pipeline

```yaml
# .github/workflows/generate-types.yml
name: Generate API Types

on:
  push:
    branches: [main]
    paths:
      - 'apps/api/openapi/**'

jobs:
  generate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Generate OpenAPI schema
        run: pnpm nx run api:openapi

      - name: Generate TypeScript types
        run: npx openapi-typescript apps/api/openapi/openapi.yaml -o apps/web/src/lib/api/types.ts

      - name: Format generated files
        run: pnpm nx run web:lint -- --fix

      - name: Create PR with generated types
        uses: peter-evans/create-pull-request@v5
        with:
          title: 'chore: regenerate API types from OpenAPI'
          body: 'Auto-generated types from latest OpenAPI schema'
```

## 7. API Versioning Strategy

```
/api/v1/vat-returns          # Current stable API
/api/v1/organizations         # Current stable API
/api/v2/vat-returns           # Future API with breaking changes
```

```typescript
// apps/api/src/main.ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Version 1 (stable)
  app.setGlobalPrefix('api/v1');

  // Or use router for multiple versions
  const v1Router = await buildV1Router(app);
  const v2Router = await buildV2Router(app);

  app.use('/api/v1', v1Router);
  app.use('/api/v2', v2Router);

  await app.listen(3001);
}
```

## 8. SDK Generation

```typescript
// scripts/generate-sdk.ts
import { generateClient } from 'openapi-typescript-codegen';
import { writeFileSync } from 'fs';

generateClient({
  input: './apps/api/openapi/openapi.yaml',
  output: './apps/web/src/lib/api/sdk',
  client: 'axios',
  additionalProperties: {
    withHooks: true,
  },
});

console.log('SDK generated successfully');
```

## 9. API Documentation

```typescript
// apps/api/src/main.ts
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('VAT Declaration System API')
    .setDescription('Online VAT Declaration SaaS API')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('vat-returns', 'VAT return management')
    .addTag('organizations', 'Organization management')
    .addTag('users', 'User management')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  await app.listen(3001);
}
```

## 10. Type Safety Best Practices

1. **Never use `any`** - Use `unknown` with type guards
2. **Generate types from OpenAPI** - Single source of truth
3. **Use Zod for runtime validation** - Match TypeScript types
4. **Enable strict TypeScript** - `strict: true` in tsconfig
5. **Use type-safe API client** - Generic methods with response types
6. **Validate at boundaries** - API client validates responses
7. **Use discriminated unions** - For status fields and variant types
