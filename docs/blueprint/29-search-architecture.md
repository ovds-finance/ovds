# 29 — Search Architecture

## 1. Search Requirements

The system requires search capabilities for:
- Transactions (by description, reference, counterparty)
- VAT returns (by status, period, registration number)
- Documents (by name, content)
- Contacts (by name, email, VAT number)

## 2. Search Architecture Options

| Option | Technology | Use Case |
|--------|-----------|----------|
| PostgreSQL Full-Text | `tsvector` / `tsquery` | Simple text search, low scale |
| Elasticsearch | Dedicated search cluster | Complex search, faceting, analytics |
| Meilisearch | Lightweight search | Fast typo-tolerant search, smaller scale |
| Algolia | Managed search | Zero-config, fast, typo-tolerant |

**Recommendation**: Start with PostgreSQL full-text search, migrate to Meilisearch or Elasticsearch when search complexity grows.

## 3. PostgreSQL Full-Text Search

```prisma
model Transaction {
  // ...
  searchVector String? // tsvector column for full-text search
}
```

```sql
-- Create tsvector column
ALTER TABLE transactions ADD COLUMN search_vector tsvector;

-- Update search vector on insert/update
CREATE OR REPLACE FUNCTION update_transaction_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.reference, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.counterparty_name, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER transaction_search_vector_update
  BEFORE INSERT OR UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_transaction_search_vector();
```

```typescript
// transactions/services/transaction-search.service.ts
@Injectable()
export class TransactionSearchService {
  async search(orgId: string, query: string, filters: any): Promise<PaginatedResult<Transaction>> {
    const searchQuery = query
      .split(' ')
      .map((term) => `& ${term}:*`)
      .join('');

    const results = await this.prisma.$queryRaw`
      SELECT id, organization_id, description, reference, counterparty_name,
             ts_rank(search_vector, websearch_to_tsquery('english', ${query})) AS rank
      FROM transactions
      WHERE organization_id = ${orgId}
        AND deleted_at IS NULL
        AND search_vector @@ websearch_to_tsquery('english', ${query})
      ORDER BY rank DESC
      LIMIT ${filters.limit || 20}
      OFFSET ${filters.offset || 0}
    `;

    return { data: results, meta: { total: results.length } };
  }
}
```

## 4. Meilisearch Integration

```typescript
// search/meilisearch.service.ts
@Injectable()
export class MeilisearchService {
  private readonly client: MeiliSearch;
  private readonly indexName = 'transactions';

  constructor() {
    this.client = new MeiliSearch({
      host: process.env.MEILISEARCH_HOST,
      apiKey: process.env.MEILISEARCH_API_KEY,
    });
  }

  async indexTransactions(orgId: string, transactions: Transaction[]): Promise<void> {
    const index = this.client.index(this.indexName);

    await index.addDocuments(
      transactions.map((t) => ({
        id: t.id,
        organizationId: t.organizationId,
        description: t.description,
        reference: t.reference,
        counterpartyName: t.counterpartyName,
        amount: t.grossAmount,
        date: t.transactionDate,
        type: t.type,
      })),
      { primaryKey: 'id' },
    );
  }

  async search(query: string, orgId: string, options?: SearchOptions): Promise<SearchResult> {
    const index = this.client.index(this.indexName);
    return index.search(query, {
      filter: [`organizationId = ${orgId}`],
      limit: options?.limit || 20,
      offset: options?.offset || 0,
      sort: options?.sort || ['date:desc'],
    });
  }
}
```

## 5. Search API Endpoints

```typescript
// search/search.controller.ts
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('transactions')
  @UseGuards(JwtAuthGuard, TenantGuard)
  @Permissions('transactions.read')
  async searchTransactions(@Query() query: SearchTransactionsDto) {
    const results = await this.searchService.searchTransactions(
      TenantContext.getOrganizationId()!,
      query.q,
      {
        type: query.type,
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
        limit: query.limit || 20,
        offset: query.offset || 0,
      },
    );
    return { data: results };
  }

  @Get('suggestions')
  @UseGuards(JwtAuthGuard, TenantGuard)
  async getSuggestions(@Query('q') q: string) {
    const suggestions = await this.searchService.getSuggestions(
      TenantContext.getOrganizationId()!,
      q,
    );
    return { data: suggestions };
  }
}
```

## 6. Search Indexing Pipeline

```typescript
// search/indexing.processor.ts
@Processor('default')
export class SearchIndexingProcessor {
  constructor(private readonly searchService: SearchService) {}

  @Process('index_transaction')
  async indexTransaction(job: Job<{ transactionId: string }>) {
    const { transactionId } = job.data;
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    if (transaction) {
      await this.searchService.indexTransaction(transaction);
    }
  }

  @Process('index_vat_return')
  async indexVatReturn(job: Job<{ vatReturnId: string }>) {
    const { vatReturnId } = job.data;
    const vatReturn = await this.prisma.vatReturn.findUnique({
      where: { id: vatReturnId },
      include: { items: true },
    });

    if (vatReturn) {
      await this.searchService.indexVatReturn(vatReturn);
    }
  }
}
```

## 7. Search Filters

```typescript
// search/dto/search.dto.ts
export const SearchTransactionsSchema = z.object({
  q: z.string().min(1),
  type: z.enum(['sale', 'purchase', 'refund', 'adjustment']).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  amountMin: z.coerce.number().optional(),
  amountMax: z.coerce.number().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
});

export type SearchTransactionsDto = z.infer<typeof SearchTransactionsSchema>;
```

## 8. Search Relevance Tuning

```typescript
// search/relevance.service.ts
@Injectable()
export class SearchRelevanceService {
  getBoosts(): Record<string, number> {
    return {
      description: 2.0,    // Exact match in description is most important
      reference: 1.5,      // Reference number is important
      counterpartyName: 1.0, // Counterparty name is useful
    };
  }

  applyBoosts(query: string): string {
    const boosts = this.getBoosts();
    let boostedQuery = query;

    for (const [field, boost] of Object.entries(boosts)) {
      const terms = query.split(' ').map((term) => `${field}:"${term}"^${boost}`);
      boostedQuery += ' ' + terms.join(' ');
    }

    return boostedQuery;
  }
}
```

## 9. Autocomplete

```typescript
// search/autocomplete.service.ts
@Injectable()
export class AutocompleteService {
  async getSuggestions(orgId: string, query: string, limit = 10): Promise<Suggestion[]> {
    if (!query || query.length < 2) return [];

    const results = await this.prisma.$queryRaw`
      SELECT id, description, reference, 'transaction' as type
      FROM transactions
      WHERE organization_id = ${orgId}
        AND deleted_at IS NULL
        AND (
          description ILIKE ${'%' + query + '%'}
          OR reference ILIKE ${'%' + query + '%'}
        )
      LIMIT ${limit}
    `;

    return results.map((r) => ({
      id: r.id,
      text: r.description || r.reference,
      type: r.type,
    }));
  }
}
```

## 10. Search Analytics

```typescript
// search/analytics.service.ts
@Injectable()
export class SearchAnalyticsService {
  async logSearch(orgId: string, query: string, resultCount: number): Promise<void> {
    await this.prisma.searchLog.create({
      data: {
        organizationId: orgId,
        query,
        resultCount,
        searchedAt: new Date(),
      },
    });
  }

  async getPopularSearches(orgId: string, days = 30): Promise<any[]> {
    return this.prisma.$queryRaw`
      SELECT query, COUNT(*) as count
      FROM search_logs
      WHERE organization_id = ${orgId}
        AND searched_at >= NOW() - INTERVAL '${days} days'
      GROUP BY query
      ORDER BY count DESC
      LIMIT 10
    `;
  }
}
```
