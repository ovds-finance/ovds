# The OVDS Ubiquitous Language & Enterprise Communication Standard

This specification establishes the **Ubiquitous Language** and enterprise communication standards for the **Online VAT Declaration System (OVDS)**. It aligns with the **Accounting and Auditing Board of Ethiopia (AABE)** frameworks, the **Federal Inland Revenue Authority (FIRA)** protocols, and Ethiopian Tax Proclamations (including Proclamation No. 285/2002 and its subsequent amendments).

---

## 1. Architectural Strategy & Monorepo Matrix

The OVDS is built as a highly modular system within an **Nx Monorepo**, utilizing **React** for the frontend, **NestJS** for the backend API, and **Prisma** for data modeling. 

### Core Tech Stack Layering
*   **Monorepo Management:** `Nx` (Strict boundary rules using tags: `type:app`, `type:lib`, `scope:shared`, `scope:vat`)
*   **Frontend UI Layer:** `React 19` + `TailwindCSS` + `Shadcn UI` (Atomic Design System)
*   **Backend API Layer:** `NestJS 11` (Domain-Driven Design architecture with strict boundary contexts)
*   **Data Modeling Layer:** `Prisma ORM` + `PostgreSQL` (Enforced database constraints, indexes, and schemas)

### Nx Project Dependency Graph Boundaries
```
                      ┌────────────────────────┐
                      │    ovds-frontend-app   │
                      └───────────┬────────────┘
                                  │
                                  ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                           Shared UI Components                           │
│  @ovds/shared/ui-components (Tailwind + React Functional Components)     │
└──────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                        Enterprise Core Domains                           │
│     @ovds/vat/domain-sales      │      @ovds/vat/domain-purchases        │
└─────────────────────────────────┴────────────────────────────────────────┘
                                  │
                                  ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                          Shared Types & Schemas                          │
│     @ovds/shared/types-contracts (TypeScript Interfaces & Zod Validation)│
└──────────────────────────────────────────────────────────────────────────┘
                                  ▲
                                  │
                      ┌───────────┴────────────┐
                      │    ovds-backend-api    │
                      └────────────────────────┘
```

---

## 2. The Ubiquitous Language Dictionary

To eliminate cognitive friction between Tax Accountants, Engineers, Product Managers, and External Auditors, the exact terms defined below must be utilized verbatim across **UI Form Labels**, **Database Columns**, **API Payloads (JSON)**, and **Financial Reports**.

| English Domain Term | Amharic Domain Term | Business Definition & Regulatory Context | Database Column (`Prisma`) | API Payload Key (`camelCase`) | UI Dashboard Label |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Taxable Transaction** | ታክስ የሚጣልበት ግብይት | Any supply of goods or services subject to VAT under Ethiopian Proclamations. | `taxable_transaction` | `taxableTransaction` | Taxable Transaction |
| **Standard Rated Supply** | መደበኛ ታክስ የሚጣልበት አቅርቦት | Commercial activities taxed at the standard rate of 15%. | `standard_rated_supply` | `standardRatedSupply` | Standard Rated Supply (15%) |
| **Zero Rated Supply** | በባዶ መቶኛ ታክስ የሚጣልበት | Exempt-friendly supplies (e.g., exports) taxed at 0% under Ethiopian Law. | `zero_rated_supply` | `zeroRatedSupply` | Zero-Rated Supply (0%) |
| **Exempt Supply** | ከታክስ ነፃ የሆነ አቅርቦት | Supplies excluded from VAT (e.g., financial services, educational books). | `exempt_supply` | `exemptSupply` | Exempt Supply |
| **Input VAT** | የተከፈለ ቫት (ፈሰስ) | VAT paid on business purchases that can be claimed as a credit or deduction. | `input_vat` | `inputVat` | Input VAT (Claimable) |
| **Output VAT** | የተሰበሰበ ቫት (ገቢ) | VAT charged and collected on sales transactions. | `output_vat` | `outputVat` | Output VAT (Collected) |
| **Taxpayer Identification Number** | የግብር ከፋይ መለያ ቁጥር | The unique 10-digit identification number issued by the Ministry of Revenues. | `tin` | `tin` | TIN |
| **VAT Registration Certificate** | የቫት ምዝገባ ምስክር ወረቀት | Official government certificate authorizing VAT collection. | `vat_cert_number` | `vatCertNumber` | VAT Certificate Number |
| **Withholding Tax** | ተቀናሽ ታክስ | Tax withheld at the source of payment (typically 2% or 3% per rules). | `withholding_tax` | `withholdingTax` | Withholding Tax (WHT) |
| **VAT Refund Due** | ተመላሽ የሚሆን የቫት ሂሳብ | Excess Input VAT over Output VAT carrying forward or refunded by authority. | `vat_refund_due` | `vatRefundDue` | Net VAT Refund Due |
| **VAT Payable** | የሚከፈል የቫት ሂሳብ | Net liability when Output VAT exceeds allowable Input VAT for the tax period. | `vat_payable` | `vatPayable` | Net VAT Payable |

---

## 3. Frontend Architecture: Modular UI/UX Logic

The frontend utilizes a strict atomic configuration to keep components decoupled from business logic yet tethered to the Ubiquitous Language.

### Form Validation Pattern: Contract Sharing (`@ovds/shared/types-contracts`)
By embedding Zod validations into a shared library, the UI and API share identical constraints.

```typescript
// apps/shared/types-contracts/src/lib/vat-declaration.schema.ts
import { z } from 'zod';

export const VatDeclarationSchema = z.object({
  tin: z.string().length(10, { message: "Ethiopian TIN must be exactly 10 digits" }).regex(/^\d+$/, { message: "TIN must contain only numbers" }),
  taxPeriod: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, { message: "Format must be YYYY-MM" }),
  standardRatedSupply: z.number().min(0),
  outputVat: z.number().min(0),
  inputVat: z.number().min(0),
  vatPayable: z.number(),
  vatRefundDue: z.number(),
});

export type VatDeclarationDto = z.infer<typeof VatDeclarationSchema>;
```

### React Smart vs. Dumb Component Standard
1.  **Dumb Components (`libs/shared/ui-components`)**: Presentational, consume Tailwind classes, zero side effects.
2.  **Smart Containers (`libs/vat/feature-dashboard`)**: Manage state hook subscriptions, access React Query, feed clean data primitives down.

```tsx
// libs/vat/feature-dashboard/src/lib/VatSummaryCard.tsx
import React from 'react';
import { VatDeclarationDto } from '@ovds/shared/types-contracts';

interface VatSummaryCardProps {
  data: Pick<VatDeclarationDto, 'outputVat' | 'inputVat' | 'vatPayable' | 'vatRefundDue'>;
}

export const VatSummaryCard: React.FC<VatSummaryCardProps> = ({ data }) => {
  const isRefund = data.vatRefundDue > 0;
  
  return (
    <div className="p-6 bg-white dark:bg-slate-900 rounded-xl shadow-md border border-slate-200 dark:border-slate-800">
      <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider">Ethiopian Revenue Summary</h3>
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-slate-400">Total Output VAT</p>
          <p className="text-xl font-bold text-slate-900 dark:text-white">ETB {data.outputVat.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400">Total Input VAT</p>
          <p className="text-xl font-bold text-slate-900 dark:text-white">ETB {data.inputVat.toLocaleString()}</p>
        </div>
      </div>
      <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
        <span className="text-xs text-slate-400">{isRefund ? 'Net VAT Refund Due' : 'Net VAT Payable'}</span>
        <p className={`text-2xl font-black ${isRefund ? 'text-emerald-600' : 'text-rose-600'}`}>
          ETB {isRefund ? data.vatRefundDue.toLocaleString() : data.vatPayable.toLocaleString()}
        </p>
      </div>
    </div>
  );
};
```

---

## 4. Backend Engine: NestJS Architecture

The backend honors Clean Architecture by ensuring controllers only accept validated DTOs, delegating core domain calculations to an explicit Service domain layer.

```typescript
// apps/backend-api/src/app/vat/controllers/declaration.controller.ts
import { Controller, Post, Body, UsePipes, HttpStatus, HttpCode } from '@nestjs/common';
import { ZodValidationPipe } from '@ovds/shared/pipes';
import { VatDeclarationSchema, VatDeclarationDto } from '@ovds/shared/types-contracts';
import { VatCalculationService } from '../services/calculation.service';

@Controller('vat/declarations')
export class DeclarationController {
  constructor(private readonly calculationService: VatCalculationService) {}

  @Post('calculate')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(VatDeclarationSchema))
  async calculateDeclaration(@Body() dto: VatDeclarationDto): Promise<VatDeclarationDto> {
    return this.calculationService.processEthiopianTaxRules(dto);
  }
}
```

```typescript
// apps/backend-api/src/app/vat/services/calculation.service.ts
import { Injectable } from '@nestjs/common';
import { VatDeclarationDto } from '@ovds/shared/types-contracts';

@Injectable()
export class VatCalculationService {
  /**
   * Evaluates VAT parameters according to AABE and Ethiopian Proclamation principles.
   * Compares Output VAT against allowable Input VAT.
   */
  processEthiopianTaxRules(data: VatDeclarationDto): VatDeclarationDto {
    const calculatedPayable = data.outputVat - data.inputVat;
    
    return {
      ...data,
      vatPayable: calculatedPayable > 0 ? calculatedPayable : 0,
      vatRefundDue: calculatedPayable < 0 ? Math.abs(calculatedPayable) : 0,
    };
  }
}
```

---

## 5. Database Schema: Prisma Data Modeling

The Prisma relational setup reflects strict field matching constraints. Implicit snake_case definitions match transactional tables while preserving camelCase access on JavaScript structures.

```prisma
// apps/backend-api/prisma/schema.prisma

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum TaxPeriodStatus {
  DRAFT
  AUDITED_AABE
  FILED_PORTAL
  REJECTED
}

model VatDeclaration {
  id                   String          @id @default(uuid()) @db.Uuid
  tin                  String          @db.VarChar(10)
  taxPeriod            String          @map("tax_period") @db.VarChar(7) // Format: YYYY-MM
  standardRatedSupply  Decimal         @map("standard_rated_supply") @db.Decimal(18, 2)
  zeroRatedSupply      Decimal         @map("zero_rated_supply") @db.Decimal(18, 2)
  exemptSupply         Decimal         @map("exempt_supply") @db.Decimal(18, 2)
  outputVat            Decimal         @map("output_vat") @db.Decimal(18, 2)
  inputVat             Decimal         @map("input_vat") @db.Decimal(18, 2)
  vatPayable           Decimal         @map("vat_payable") @db.Decimal(18, 2)
  vatRefundDue         Decimal         @map("vat_refund_due") @db.Decimal(18, 2)
  status               TaxPeriodStatus @default(DRAFT)
  createdAt            DateTime        @default(now()) @map("created_at")
  updatedAt            DateTime        @updatedAt @map("updated_at")

  @@unique([tin, taxPeriod], name: "idx_tin_tax_period")
  @@index([status])
  @@map("vat_declarations")
}
```

---

## 6. Financial Reporting & Ledger Reconciliation Matrix

To fulfill reporting guidelines regulated by the **AABE**, data lineages from ERP systems (e.g., SAP, Oracle, Odoo) must seamlessly map through the standard terminology.

```
┌─────────────────────────────────┐
│     ERP Sub-Ledgers (Source)    │
│  - AR Invoices / General Ledger │
│  - AP Vouchers / Expense Logs   │
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│    OVDS Ubiquitous Ingestion    │
│  - standard_rated_supply        │
│  - input_vat / output_vat       │
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│    Compliance Outputs (AABE)    │
│  - ERCA / FIRA Official Ledger  │
│  - Electronic Form 21008        │
└─────────────────────────────────┘
```

### Reconciliation Assertion Rules
1.  **Rule 1 (Output Audit):** `standard_rated_supply` * 0.15 MUST equal `output_vat` within a variance toll of ±0.05 ETB (to accommodate fractional rounding allowed by AABE).
2.  **Rule 2 (Net Settlement Logic):** If `output_vat` > `input_vat`, then `vat_payable` = `output_vat` - `input_vat` AND `vat_refund_due` = 0.
3.  **Rule 3 (Credit Carryforward Logic):** If `input_vat` > `output_vat`, then `vat_refund_due` = `input_vat` - `output_vat` AND `vat_payable` = 0.

---

## 7. Automated Government Tax Portal Integration E-Filing Contract

The final compliance layer transmits payloads directly to the Ministry of Revenues e-filing platform. 

```json
{
  "$schema": "https://ovds.gov.et/schemas/v1/vat-filing.json",
  "metadata": {
    "systemOrigin": "Enterprise ERP Connector",
    "complianceStandard": "AABE-IFRS-2026"
  },
  "taxpayerDetails": {
    "tin": "0043928104",
    "vatCertNumber": "VAT-99281-2026",
    "legalName": "Ethiopia Commercial Trading PLC"
  },
  "reportingPeriod": {
    "taxPeriod": "2026-08",
    "filingDate": "2026-08-22T14:30:00Z"
  },
  "financialSummary": {
    "standardRatedSupply": 1250000.00,
    "zeroRatedSupply": 340000.00,
    "exemptSupply": 120000.00,
    "outputVat": 187500.00,
    "inputVat": 142000.00,
    "vatPayable": 45500.00,
    "vatRefundDue": 0.00
  }
}
```

---

## 8. Governance, Versioning, and Team Rules

### Monorepo Boundary Enforcement Rules (`nx.json`)
```json
{
  "npmScope": "ovds",
  "targetDefaults": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["{projectRoot}/dist"]
    }
  },
  "tagConstraints": [
    {
      "sourceTag": "scope:vat",
      "onlyDependOnLibsWithTags": ["scope:shared", "scope:vat"]
    },
    {
      "sourceTag": "type:app",
      "onlyDependOnLibsWithTags": ["type:lib", "scope:shared", "scope:vat"]
    }
  ]
}
```

### Modification Workflow
1.  **Propose Change:** Submit a Tax Rule RFC if Ethiopian regulatory bodies adjust standard VAT rates or reporting thresholds.
2.  **Schema Amendment:** Modify `@ovds/shared/types-contracts` validation boundaries.
3.  **Database Migration:** Generate Prisma migration files (`prisma migrate dev`).
4.  **UI Alignment:** Sync corresponding dynamic UI inputs inside frontends to maintain an absolute single source of truth.
