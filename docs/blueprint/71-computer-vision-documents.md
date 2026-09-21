# 71 — Computer Vision and Document Processing

## 1. Computer Vision Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│              Computer Vision and Document Processing              │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │   OCR       │  │   Document  │  │   Vision Models          │ │
│  │   Engine    │  │   Pipeline  │  │                         │ │
│  │             │  │             │  │ - Layout Detection      │ │
│  │ - Tesseract │  │ - Pre-proc  │  │ - Table Extraction      │ │
│  │ - Google    │  │ - Classify  │  │ - Form Recognition      │ │
│  │   Vision    │  │ - Extract   │  │ - Signature Detection   │ │
│  │ - AWS       │  │ - Validate  │  │ - QR/Barcode            │ │
│  │   Textract  │  │             │  │                         │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
│         │                │                    │                  │
│         └────────────────┼────────────────────┘                  │
│                          ▼                                       │
│                   ┌─────────────────────┐                        │
│                   │   Document Store    │                        │
│                   │   (Indexed + Search)│                        │
│                   └─────────────────────┘                        │
└─────────────────────────────────────────────────────────────────┘
```

## 2. OCR Service

```typescript
// vision/ocr/ocr.service.ts
@Injectable()
export class OCRService {
  async extractText(document: Buffer, options: OCROptions): Promise<OCRResult> {
    let result: OCRResult;

    switch (options.provider) {
      case 'tesseract':
        result = await this.extractWithTesseract(document, options);
        break;
      case 'google':
        result = await this.extractWithGoogleVision(document, options);
        break;
      case 'aws':
        result = await this.extractWithTextract(document, options);
        break;
    }

    return result;
  }

  private async extractWithGoogleVision(document: Buffer, options: OCROptions): Promise<OCRResult> {
    const imageAnnotator = new ImageAnnotatorClient();

    const [response] = await imageAnnotator.documentTextDetection({
      image: { content: document.toString('base64') },
    });

    const pages = response.fullTextAnnotation?.pages || [];

    return {
      text: response.fullTextAnnotation?.text || '',
      pages: pages.map((page) => ({
        pageNumber: page.page,
        text: page.blocks.map((b) => b.paragraphs.map((p) => p.words.map((w) => w.symbols.map((s) => s.text).join('')).join('')).join('\n')).join('\n'),
        blocks: page.blocks.map((b) => ({
          text: b.blocks.map((p) => p.paragraphs.map((w) => w.words.map((s) => s.symbols.map((x) => x.text).join('')).join('')).join('')).join(''),
          boundingBox: b.boundingBox,
          confidence: b.confidence,
        })),
      })),
      confidence: pages[0]?.blocks[0]?.confidence || 0,
    };
  }
}
```

## 3. Document Classification

```typescript
// vision/classification/document-classifier.service.ts
@Injectable()
export class DocumentClassifierService {
  async classify(document: Document): Promise<ClassificationResult> {
    const features = await this.extractFeatures(document);

    const classification = await this.classifier.predict(features);

    return {
      documentType: classification.label,
      confidence: classification.confidence,
      features: features,
    };
  }

  private async extractFeatures(document: Document): Promise<DocumentFeatures> {
    const text = await this.ocrService.extractText(document.content, { provider: 'google' });
    const layout = await this.detectLayout(document.content);

    return {
      textLength: text.text.length,
      hasTable: layout.hasTable,
      hasSignature: layout.hasSignature,
      hasQRCode: layout.hasQRCode,
      pageCount: text.pages.length,
      textDensity: this.computeTextDensity(text.pages),
      language: await this.detectLanguage(text.text),
    };
  }
}
```

## 4. Layout Detection

```typescript
// vision/layout/layout-detector.service.ts
@Injectable()
export class LayoutDetectorService {
  async detectLayout(document: Buffer): Promise<DocumentLayout> {
    const model = await this.loadLayoutModel();

    const result = await model.detect(document);

    return {
      hasHeader: result.header.confidence > 0.8,
      hasFooter: result.footer.confidence > 0.8,
      hasTable: result.table.confidence > 0.8,
      hasSignature: result.signature.confidence > 0.7,
      hasQRCode: result.qrCode.confidence > 0.8,
      hasBarcode: result.barcode.confidence > 0.8,
      regions: result.regions.map((r) => ({
        type: r.label,
        boundingBox: r.boundingBox,
        confidence: r.confidence,
      })),
    };
  }
}
```

## 5. Table Extraction

```typescript
// vision/tables/table-extractor.service.ts
@Injectable()
export class TableExtractorService {
  async extractTables(document: Buffer): Promise<Table[]> {
    const layout = await this.layoutDetector.detectLayout(document);
    const tables: Table[] = [];

    for (const region of layout.regions.filter((r) => r.type === 'table')) {
      const table = await this.extractTable(document, region.boundingBox);
      tables.push(table);
    }

    return tables;
  }

  private async extractTable(document: Buffer, boundingBox: BoundingBox): Promise<Table> {
    const cropped = this.cropImage(document, boundingBox);
    const ocrResult = await this.ocrService.extractText(cropped);

    const rows = this.parseTableRows(ocrResult.text);

    return {
      rows,
      headers: rows[0] || [],
      data: rows.slice(1),
    };
  }

  private parseTableRows(text: string): string[][] {
    const lines = text.split('\n').filter((l) => l.trim());
    const rows: string[][] = [];

    for (const line of lines) {
      const cells = line.split(/\s{2,}/).filter((c) => c.trim());
      if (cells.length > 1) {
        rows.push(cells);
      }
    }

    return rows;
  }
}
```

## 6. Form Recognition

```typescript
// vision/forms/form-recognizer.service.ts
@Injectable()
export class FormRecognizerService {
  async recognizeForm(document: Buffer, formType: string): Promise<FormResult> {
    const model = await this.getFormModel(formType);

    const result = await model.recognize(document);

    return {
      formType,
      fields: result.fields.map((f) => ({
        name: f.name,
        value: f.value,
        confidence: f.confidence,
        boundingBox: f.boundingBox,
      })),
      tables: result.tables.map((t) => ({
        name: t.name,
        rows: t.rows,
        columns: t.columns,
      })),
    };
  }
}
```

## 7. Document Validation

```typescript
// vision/validation/document-validator.service.ts
@Injectable()
export class DocumentValidatorService {
  async validate(document: Document, schema: DocumentSchema): Promise<ValidationResult> {
    const extracted = await this.extractFields(document, schema);

    const errors: ValidationError[] = [];

    for (const field of schema.fields) {
      const value = extracted[field.name];

      // Required check
      if (field.required && !value) {
        errors.push({ field: field.name, error: 'required', message: `${field.name} is required` });
        continue;
      }

      // Type check
      if (value && !this.validateType(value, field.type)) {
        errors.push({ field: field.name, error: 'type', message: `${field.name} must be ${field.type}` });
      }

      // Format check
      if (value && field.format && !this.validateFormat(value, field.format)) {
        errors.push({ field: field.name, error: 'format', message: `${field.name} format is invalid` });
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      extracted,
    };
  }
}
```

## 8. Document Search

```typescript
// vision/search/document-search.service.ts
@Injectable()
export class DocumentSearchService {
  async search(orgId: string, query: string): Promise<DocumentSearchResult[]> {
    const embedding = await this.getEmbedding(query);

    const results = await this.vectorDb.search({
      index: 'documents',
      vector: embedding,
      filter: { organizationId: orgId },
      topK: 10,
    });

    return results.map((r) => ({
      documentId: r.id,
      score: r.score,
      snippet: this.extractSnippet(r.document.text, query),
      document: r.document,
    }));
  }
}
```

## 9. Batch Processing

```typescript
// vision/batch/batch-processor.service.ts
@Injectable()
export class BatchProcessorService {
  async processBatch(documents: Document[]): Promise<BatchResult> {
    const jobs = documents.map((doc) => this.processDocument(doc));

    const results = await Promise.allSettled(jobs);

    return {
      total: documents.length,
      succeeded: results.filter((r) => r.status === 'fulfilled').length,
      failed: results.filter((r) => r.status === 'rejected').length,
      results: results.map((r, i) => ({
        documentId: documents[i].id,
        status: r.status === 'fulfilled' ? 'completed' : 'failed',
        data: r.status === 'fulfilled' ? r.value : r.reason,
      })),
    };
  }
}
```

## 10. Document Pipeline

```typescript
// vision/pipeline/document-pipeline.service.ts
@Injectable()
export class DocumentPipelineService {
  async process(document: Document): Promise<ProcessedDocument> {
    // Step 1: Pre-process
    const preprocessed = await this.preprocess(document);

    // Step 2: Classify
    const classification = await this.classifier.classify(preprocessed);

    // Step 3: Extract
    const extracted = await this.extract(preprocessed, classification.documentType);

    // Step 4: Validate
    const validation = await this.validator.validate(extracted, this.getSchema(classification.documentType));

    // Step 5: Store
    const stored = await this.store(extracted, validation);

    return {
      document: stored,
      classification,
      extracted,
      validation,
    };
  }
}
```
