# 62 — Data Mesh and Domain-Driven Data Ownership

## 1. Data Mesh Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Data Mesh Architecture                      │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │   Domain    │  │   Data      │  │   Self-Service           │ │
│  │   Owners    │  │   Products  │  │   Platform               │ │
│  │             │  │             │  │                         │ │
│  │ - VAT       │  │ - Dataset   │  │ - Data Discovery        │ │
│  │ - Finance   │  │ - Quality   │  │ - Data Lineage          │ │
│  │ - Trans     │  │ - Lineage   │  │ - Data Catalog          │ │
│  │ - Compliance│  │ - SLA       │  │ - Observability         │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
│         │                │                    │                  │
│         └────────────────┼────────────────────┘                  │
│                          ▼                                       │
│                   ┌─────────────────────┐                        │
│                   │   Federated         │                        │
│                   │   Governance        │                        │
│                   └─────────────────────┘                        │
└─────────────────────────────────────────────────────────────────┘
```

## 2. Data Product Model

```prisma
model DataProduct {
  id            String   @id @default(cuid())
  organizationId String
  name          String
  domain        String   // "vat", "finance", "transactions", "compliance"
  description   String
  ownerId       String
  schema        Json     // Data schema definition
  sla           Json     // { "freshness": "1h", "availability": "99.9%" }
  tags          String[]
  isPublic      Boolean  @default(false)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  datasets      DataSet[]
  lineage       DataLineage[]

  @@index([organizationId, domain])
  @@index([ownerId])
}

model DataSet {
  id            String   @id @default(cuid())
  organizationId String
  productId     String
  name          String
  format        String   // "parquet", "json", "csv"
  location      String   // S3 path or database table
  size          Int?
  rowCount      Int?
  lastRefreshed DateTime?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  product       DataProduct @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@index([productId])
}

model DataLineage {
  id            String   @id @default(cuid())
  organizationId String
  sourceProductId String
  targetProductId String
  transformation String  // SQL, dbt model, pipeline name
  createdAt     DateTime @default(now())

  sourceProduct  DataProduct @relation("SourceLineage", fields: [sourceProductId], references: [id])
  targetProduct  DataProduct @relation("TargetLineage", fields: [targetProductId], references: [id])
}
```

## 3. Data Product Interface

```typescript
// data-mesh/data-product.interface.ts
export interface DataProduct {
  readonly id: string;
  readonly organizationId: string;
  readonly name: string;
  readonly domain: string;
  readonly description: string;
  readonly ownerId: string;
  readonly schema: DataSchema;
  readonly sla: DataSLA;
  readonly tags: string[];
  readonly isPublic: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface DataSchema {
  readonly fields: DataField[];
  readonly primaryKey?: string;
  readonly partitionKey?: string;
  readonly indexes?: DataIndex[];
}

export interface DataField {
  readonly name: string;
  readonly type: DataType;
  readonly nullable: boolean;
  readonly description?: string;
  readonly constraints?: DataConstraints;
}

export interface DataSLA {
  readonly freshness: string;        // "1h", "1d"
  readonly availability: string;     // "99.9%"
  readonly retention: string;        // "7y"
  readonly refreshFrequency: string; // "hourly", "daily"
}
```

## 4. Domain Data Services

```typescript
// data-mesh/domains/vat-data-product.service.ts
@Injectable()
export class VatDataProductService implements DomainDataProduct {
  readonly domain = 'vat';
  readonly products = ['vat_returns', 'vat_compliance', 'vat_reconciliation'];

  async getProduct(orgId: string, productName: string): Promise<DataProduct> {
    switch (productName) {
      case 'vat_returns':
        return this.getVatReturnsProduct(orgId);
      case 'vat_compliance':
        return this.getVatComplianceProduct(orgId);
      case 'vat_reconciliation':
        return this.getVatReconciliationProduct(orgId);
      default:
        throw new DataProductNotFoundException(productName);
    }
  }

  private async getVatReturnsProduct(orgId: string): Promise<DataProduct> {
    return {
      id: `vat_returns_${orgId}`,
      organizationId: orgId,
      name: 'VAT Returns',
      domain: 'vat',
      description: 'VAT return data for compliance and reporting',
      ownerId: 'vat-team',
      schema: {
        fields: [
          { name: 'id', type: 'string', nullable: false },
          { name: 'period_start', type: 'date', nullable: false },
          { name: 'period_end', type: 'date', nullable: false },
          { name: 'status', type: 'string', nullable: false },
          { name: 'total_sales', type: 'decimal', nullable: true },
          { name: 'total_vat_due', type: 'decimal', nullable: true },
        ],
        primaryKey: 'id',
      },
      sla: {
        freshness: '1h',
        availability: '99.9%',
        retention: '7y',
        refreshFrequency: 'hourly',
      },
      tags: ['vat', 'compliance', 'returns'],
      isPublic: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}
```

## 5. Self-Service Platform

```typescript
// data-mesh/platform/data-catalog.service.ts
@Injectable()
export class DataCatalogService {
  async search(orgId: string, query: DataCatalogQuery): Promise<DataCatalogResult[]> {
    const products = await this.prisma.dataProduct.findMany({
      where: {
        organizationId: orgId,
        ...(query.domain ? { domain: query.domain } : {}),
        ...(query.tags ? { tags: { hasSome: query.tags } } : {}),
        ...(query.search ? {
          OR: [
            { name: { contains: query.search, mode: 'insensitive' } },
            { description: { contains: query.search, mode: 'insensitive' } },
          ],
        } : {}),
      },
      include: {
        datasets: true,
        lineage: { include: { sourceProduct: true, targetProduct: true } },
      },
    });

    return products.map((product) => this.enrichProduct(product));
  }

  async getLineage(orgId: string, productId: string): Promise<LineageGraph> {
    const product = await this.prisma.dataProduct.findFirst({
      where: { id: productId, organizationId: orgId },
      include: {
        lineage: { include: { sourceProduct: true } },
        _count: { select: { lineage: true } },
      },
    });

    return this.buildLineageGraph(product);
  }
}
```

## 6. Data Quality

```typescript
// data-mesh/quality/data-quality.service.ts
@Injectable()
export class DataQualityService {
  async runQualityChecks(orgId: string, productId: string): Promise<QualityReport> {
    const product = await this.prisma.dataProduct.findFirst({
      where: { id: productId, organizationId: orgId },
    });

    const checks: QualityCheck[] = [];

    // Freshness check
    checks.push(await this.checkFreshness(product));

    // Completeness check
    checks.push(await this.checkCompleteness(product));

    // Validity check
    checks.push(await this.checkValidity(product));

    // Uniqueness check
    checks.push(await this.checkUniqueness(product));

    return {
      productId,
      checks,
      overallScore: this.computeQualityScore(checks),
      timestamp: new Date(),
    };
  }
}
```

## 7. Federated Governance

```typescript
// data-mesh/governance/governance.service.ts
@Injectable()
export class GovernanceService {
  async applyPolicy(orgId: string, productId: string, policy: DataPolicy): Promise<void> {
    const product = await this.prisma.dataProduct.findFirst({
      where: { id: productId, organizationId: orgId },
    });

    // Validate policy
    await this.validatePolicy(policy);

    // Apply policy
    await this.prisma.dataPolicy.create({
      data: {
        organizationId: orgId,
        productId,
        name: policy.name,
        type: policy.type,
        rules: policy.rules,
        appliedAt: new Date(),
      },
    });

    // Notify downstream consumers
    await this.notifyPolicyChange(product, policy);
  }
}
```
