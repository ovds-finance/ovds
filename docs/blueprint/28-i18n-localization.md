# 28 — Internationalization and Localization

## 1. Locale Architecture

The system supports multiple locales with per-organization and per-user preferences.

```prisma
model Organization {
  // ...
  locale String @default("en") // e.g., "en", "de", "fr", "nl"
}

model User {
  // ...
  locale String @default("en")
}
```

## 2. Translation Files

```
libs/shared/src/i18n/
├── en/
│   ├── common.json
│   ├── auth.json
│   ├── vat-returns.json
│   ├── transactions.json
│   ├── reports.json
│   └── errors.json
├── de/
│   ├── common.json
│   ├── auth.json
│   └── ...
├── fr/
│   └── ...
└── index.ts
```

## 3. Translation Keys

```json
// libs/shared/src/i18n/en/vat-returns.json
{
  "title": "VAT Returns",
  "create": "Create VAT Return",
  "edit": "Edit VAT Return",
  "delete": "Delete VAT Return",
  "submit": "Submit Return",
  "cancel": "Cancel Return",
  "status": {
    "draft": "Draft",
    "submitted": "Submitted",
    "accepted": "Accepted",
    "rejected": "Rejected",
    "paid": "Paid"
  },
  "period": {
    "start": "Period Start",
    "end": "Period End",
    "due": "Due Date"
  },
  "items": {
    "sales": "Sales",
    "purchases": "Purchases",
    "adjustments": "Adjustments",
    "net_amount": "Net Amount",
    "vat_rate": "VAT Rate",
    "vat_amount": "VAT Amount",
    "gross_amount": "Gross Amount"
  }
}
```

## 4. i18n Configuration

```typescript
// libs/shared/src/i18n/index.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    resources: {
      en: { translation: await import('./en/common.json') },
      de: { translation: await import('./de/common.json') },
      fr: { translation: await import('./fr/common.json') },
    },
  });

export default i18n;
```

## 5. Backend Translations

```typescript
// NestJS i18n
import { I18n, I18nContext } from 'nestjs-i18n';

@Controller('vat-returns')
export class VatReturnsController {
  @Get(':id')
  async findOne(@I18n() i18n: I18nContext, @Param('id') id: string) {
    const vatReturn = await this.vatReturnsService.findById(id);
    if (!vatReturn) {
      throw new NotFoundException(i18n.t('vat-returns.not_found'));
    }
    return { data: vatReturn };
  }
}
```

## 6. Number and Currency Formatting

```typescript
// libs/shared/src/utils/format.ts
export function formatCurrency(amount: number, currencyCode: string, locale = 'en'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
  }).format(amount);
}

export function formatPercentage(value: number, locale = 'en'): string {
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value / 100);
}

export function formatDate(date: Date, locale = 'en'): string {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

export function formatPeriod(start: Date, end: Date, locale = 'en'): string {
  const startStr = formatDate(start, locale);
  const endStr = formatDate(end, locale);
  return `${startStr} - ${endStr}`;
}
```

## 7. Date and Time Localization

```typescript
// libs/shared/src/utils/date.ts
export function toLocalDate(date: Date, timezone: string): Date {
  // Convert UTC date to local timezone
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(date);
  return new Date(
    parseInt(parts.find(p => p.type === 'year')!.value),
    parseInt(parts.find(p => p.type === 'month')!.value) - 1,
    parseInt(parts.find(p => p.type === 'day')!.value),
  );
}

export function getTimezoneOffset(timezone: string): number {
  const now = new Date();
  const utcDate = new Date(now.getTime() + now.getTimezoneOffset() * 60000);
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
  });
  // Calculate offset
  return 0;
}
```

## 8. RTL Support

```css
/* styles/rtl.css */
[dir='rtl'] {
  .sidebar {
    right: 0;
    left: auto;
  }

  .breadcrumb {
    flex-direction: row-reverse;
  }

  .dropdown-menu {
    right: 0;
    left: auto;
  }
}
```

```typescript
// libs/shared/src/utils/rtl.ts
export function isRTL(locale: string): boolean {
  const rtlLocales = ['ar', 'he', 'fa', 'ur'];
  return rtlLocales.includes(locale);
}

export function getTextDirection(locale: string): 'ltr' | 'rtl' {
  return isRTL(locale) ? 'rtl' : 'ltr';
}
```

## 9. Locale Detection

```typescript
// libs/shared/src/i18n/locale-detector.ts
export class LocaleDetector {
  detect(request: Request): string {
    // 1. Query parameter
    const queryLocale = request.query.locale;
    if (queryLocale && this.isSupported(queryLocale)) {
      return queryLocale;
    }

    // 2. Header
    const acceptLanguage = request.headers['accept-language'];
    if (acceptLanguage) {
      const locales = acceptLanguage.split(',').map(l => l.split(';')[0]);
      for (const locale of locales) {
        if (this.isSupported(locale)) {
          return locale;
        }
      }
    }

    // 3. Organization default
    const orgLocale = request.organization?.locale;
    if (orgLocale && this.isSupported(orgLocale)) {
      return orgLocale;
    }

    // 4. Fallback
    return 'en';
  }

  private isSupported(locale: string): boolean {
    return ['en', 'de', 'fr', 'nl', 'es', 'it'].includes(locale);
  }
}
```

## 10. Translation Management

```typescript
// libs/shared/src/i18n/translation.service.ts
@Injectable()
export class TranslationService {
  async getMissingTranslations(locale: string): Promise<string[]> {
    const baseTranslations = await import(`../i18n/en/common.json`);
    const localeTranslations = await import(`../i18n/${locale}/common.json`);

    const missing: string[] = [];

    const traverse = (base: any, locale: any, prefix = ''): void => {
      for (const key in base) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        if (!(key in locale)) {
          missing.push(fullKey);
        } else if (typeof base[key] === 'object') {
          traverse(base[key], locale[key], fullKey);
        }
      }
    };

    traverse(baseTranslations, localeTranslations);
    return missing;
  }
}
```
