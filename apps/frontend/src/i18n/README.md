# OVDS i18n System

## Overview

OVDS supports three languages:
- **English (en)** — Base language, all keys defined
- **Amharic (am)** — Ethiopian national language
- **Tigrinya (ti)** — Ethiopian regional language

## Architecture

### File Structure

```
frontend/src/
├── i18n.ts                    # i18n initialization + deep merge logic
├── assets/
│   └── i18n.json              # Legacy monolithic translations (being phased out)
└── i18n/
    ├── README.md              # This file
    ├── toasts.json            # Toast notifications (success, error, warning)
    ├── ovds.json           # ovds domain (invoices, bills, items)
    ├── tax.json               # Tax domain (VAT, DRRF, BIT, compliance)
    ├── nav.json               # Navigation (sidebar domains, items, groups, items_ext)
    ├── hr.json                # HR domain (employees, departments, attendance)
    ├── ifrs.json              # IFRS domain (standards, disclosures)
    ├── common.json            # Common UI elements (buttons, labels, layout)
    └── _generated_i18n_error_keys_schema.json  # Auto-generated error key schema
```

### Translation File Format

Each domain file follows this structure:

```json
{
  "key": "English value",
  "nested": {
    "key": "English nested value"
  },
  "am": {
    "key": "Amharic value",
    "nested": {
      "key": "Amharic nested value"
    }
  },
  "ti": {
    "key": "Tigrinya value",
    "nested": {
      "key": "Tigrinya nested value"
    }
  }
}
```

**Important:** English keys are at the root level. Amharic and Tigrinya translations are nested under `am` and `ti` keys respectively.

---

## Navigation i18n (TMS-Ready)

The nav i18n system is structured for **AI-assisted static localization** managed via a Translation Management System (TMS). All nav labels are decoupled from source code through `i18nKey` references.

### Key namespaces in `nav.json`

| Namespace | Usage | Example key |
|-----------|-------|-------------|
| `nav.groups.*` | Sidebar group headers and section labels | `nav.groups.sales` → "Sales" |
| `nav.items_ext.*` | Individual nav item labels inside groups | `nav.items_ext.invoices` → "Invoices" |
| `nav.items.*` | Legacy flat nav item keys (search/spotlight) | `nav.items.employees` |
| `nav.domains.*` | Domain category labels | `nav.domains.ovds` |
| `nav.sections.*` | Sub-section labels | `nav.sections.sa_access` |
| `mobile_nav.*` | Mobile bottom nav labels | `mobile_nav.home` |

### How i18nKey wiring works

Every `NavGroup` and `NavItem` carries an `i18nKey` field that maps to the translation namespace:

```typescript
// navGroups.ts — group with i18nKey
{
  key: 'sales',
  label: 'Sales',           // fallback if key missing
  i18nKey: 'nav.groups.sales',
  icon: 'INVOICE',
  items: [
    {
      to: '/invoices',
      label: 'Invoices',    // fallback if key missing
      i18nKey: 'nav.items_ext.invoices',
      icon: 'INVOICE',
    }
  ]
}
```

```tsx
// sidebar.tsx — t() with defaultValue fallback
const groupLabel = group.i18nKey
  ? t(group.i18nKey, { defaultValue: group.label })
  : group.label;
```

The `defaultValue: group.label` pattern ensures **zero visual regression** — if a translation key is missing or the TMS hasn't delivered it yet, the English `label` string is shown instead.

### TMS Integration Pattern

For external TMS tools (Phrase, Lokalise, Crowdin, Weblate):

1. **Export**: Extract all keys from `nav.json` → push to TMS
2. **AI-assist**: Use TMS AI translation for `am` and `ti` under `groups` and `items_ext`
3. **Review**: Native speakers review/approve in the TMS
4. **Import**: Pull translated JSON back into `nav.json` under the `am` and `ti` sections
5. **No code changes needed** — `i18nKey` references stay stable

### Adding a new nav item

```typescript
// 1. Add to navGroups.ts with i18nKey
{ to: '/new-page', label: 'New Page', i18nKey: 'nav.items_ext.new_page', icon: 'ICON' }

// 2. Add to nav.json root (English)
"items_ext": {
  "new_page": "New Page"
}

// 3. Add under am and ti sections in nav.json
"am": {
  "items_ext": {
    "new_page": "አዲስ ገጽ"
  }
},
"ti": {
  "items_ext": {
    "new_page": "ሓድሽ ገጽ"
  }
}
```

---

Each domain file follows this structure:

```json
{
  "key": "English value",
  "nested": {
    "key": "English nested value"
  },
  "am": {
    "key": "Amharic value",
    "nested": {
      "key": "Amharic nested value"
    }
  },
  "ti": {
    "key": "Tigrinya value",
    "nested": {
      "key": "Tigrinya nested value"
    }
  }
}
```

**Important:** English keys are at the root level. Amharic and Tigrinya translations are nested under `am` and `ti` keys respectively.

## Usage in Components

### Basic Translation

```tsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('ovds.invoices.title')}</h1>
      <p>{t('ovds.invoices.subtitle')}</p>
    </div>
  );
}
```

### Translation with Interpolation

```tsx
const { t } = useTranslation();

// In translation file: "compute_success": "VAT computed for {{period}}"
const message = t('vat.messages.compute_success', { period: '2026-04' });
// Result: "VAT computed for 2026-04"
```

### Translation with Pluralization

```tsx
// In translation file: "n_records": "{{count}} records"
const label = t('dashboard.n_records', { count: 42 });
// Result: "42 records"
```

### Conditional Translation

```tsx
const status = invoice.status; // 'paid', 'pending', 'overdue'
const statusLabel = t(`ovds.invoices.status.${status}`);
// Looks up: ovds.invoices.status.paid, ovds.invoices.status.pending, etc.
```

### Language Switching

```tsx
import { useTranslation } from 'react-i18next';

function LanguageSwitcher() {
  const { i18n } = useTranslation();
  
  return (
    <select 
      value={i18n.language} 
      onChange={(e) => i18n.changeLanguage(e.target.value)}
    >
      <option value="en">English</option>
      <option value="am">አማርኛ (Amharic)</option>
      <option value="ti">ትግርኛ (Tigrinya)</option>
    </select>
  );
}
```

## Adding New Translations

### 1. Choose the Right Domain File

| Domain | File | When to Use |
|--------|------|-------------|
| `toasts.json` | Toast notifications | Success/error/warning messages |
| `ovds.json` | ovds | Invoices, bills, items, vendors, customers |
| `tax.json` | Tax & Compliance | VAT, DRRF, BIT, compliance checklist |
| `nav.json` | Navigation | Sidebar domains and menu items |
| `hr.json` | HR | Employees, departments, attendance, leaves |
| `payroll.json` | Payroll | Payroll tabs, columns, stats |
| `accounting.json` | Accounting | Chart of accounts, journals, banking |
| `reports.json` | Reports | All report types |
| `crm.json` | CRM | Contacts, deals, pipeline |
| `admin.json` | Administration | Users, roles, settings, audit logs |
| `common.json` | Common UI | Buttons, labels, generic messages |

### 2. Add English Keys First

```json
{
  "my_feature": {
    "title": "My Feature",
    "subtitle": "Feature description",
    "add_btn": "Add Item",
    "table": {
      "column1": "Column 1",
      "column2": "Column 2"
    }
  }
}
```

### 3. Add Amharic Translations

```json
{
  "am": {
    "my_feature": {
      "title": "የእኔ ባህሪ",
      "subtitle": "የባህሪ መግለጫ",
      "add_btn": "ንጥል ጨምር",
      "table": {
        "column1": "አምድ 1",
        "column2": "አምድ 2"
      }
    }
  }
}
```

### 4. Add Tigrinya Translations

```json
{
  "ti": {
    "my_feature": {
      "title": "ናይ ባህሪ",
      "subtitle": "ናይ ባህሪ መግለጺ",
      "add_btn": "ንጥሊ ወስኽ",
      "table": {
        "column1": "ዓምዲ 1",
        "column2": "ዓምዲ 2"
      }
    }
  }
}
```

### 5. Register the Domain in i18n.ts

If you created a new domain file, import and merge it in `frontend/src/i18n.ts`:

```typescript
import myDomainData from './i18n/my-domain.json';

// In buildEnBase():
const myDomain = myDomainData as any;
const enMyDomain: Record<string, any> = deepMerge(myDomain, myDomain.en ?? {});
base = deepMerge(base, { myDomain: enMyDomain });

// In buildLangBase():
const langMyDomain = deepMerge(enMyDomain, myDomain[langKey] ?? {});
base = deepMerge(base, { myDomain: langMyDomain });
```

## Translation Guidelines

### Key Naming Conventions

| Pattern | Example | Usage |
|---------|---------|-------|
| `module.label` | `employees.title` | Page/section title |
| `module.action_btn` | `invoices.add_btn` | Action button |
| `module.field_name` | `employees.first_name` | Form field label |
| `module.status_value` | `invoices.status_paid` | Status badge text |
| `common.save` | `common.save` | Shared across modules |
| `errors.required` | `errors.required` | Validation messages |
| `nav.items.module_name` | `nav.items.payroll` | Sidebar navigation |

### Ethiopian Language Guidelines

#### Amharic (አማርኛ)

- Use formal register for business contexts
- Avoid slang or colloquialisms
- Maintain consistency with Ethiopian government terminology (ERCA, MoR, etc.)
- Use Ethiopian numerals where appropriate (፩፪፫ for 123)
- Date format: Ethiopian calendar references where relevant

#### Tigrinya (ትግርኛ)

- Use formal register
- Maintain consistency with Amharic translations where concepts overlap
- Use Tigrinya-specific terminology for regional contexts
- Avoid direct Amharic transliteration — use proper Tigrinya equivalents

### Common Pitfalls

❌ **Don't:**
- Mix English and local language in the same string
- Use machine translation without review
- Hardcode text in components
- Duplicate keys across domain files

✅ **Do:**
- Keep keys consistent across all three languages
- Use interpolation for dynamic values
- Group related translations under nested objects
- Test translations in all three languages before committing

## Testing Translations

### Manual Testing

1. Switch language in the UI (Header → Language Switcher)
2. Navigate to the feature you translated
3. Verify all labels, buttons, and messages appear correctly
4. Check for:
   - Missing translations (shows English fallback)
   - Truncated text (layout issues)
   - Incorrect context (wrong translation for the use case)

### Automated Testing

```typescript
// Check if a key exists in all languages
import i18n from '../i18n';

describe('i18n completeness', () => {
  it('should have all keys in all languages', () => {
    const enKeys = Object.keys(i18n.getResourceBundle('en', 'translation'));
    const amKeys = Object.keys(i18n.getResourceBundle('am', 'translation'));
    const tiKeys = Object.keys(i18n.getResourceBundle('ti', 'translation'));
    
    expect(amKeys).toEqual(enKeys);
    expect(tiKeys).toEqual(enKeys);
  });
});
```

## Migration from Monolithic i18n.json

The legacy `assets/i18n.json` file is being phased out. To migrate a section:

1. Identify the domain (e.g., HR, ovds, Tax)
2. Extract relevant keys from `i18n.json`
3. Create or update the domain file in `i18n/`
4. Add English, Amharic, and Tigrinya translations
5. Update `i18n.ts` to import and merge the new domain
6. Test thoroughly
7. Remove migrated keys from `i18n.json`

**Migration Progress:**
- ✅ Toasts — `toasts.json`
- ✅ ovds (partial) — `ovds.json`
- ✅ Tax — `tax.json`
- ✅ Navigation — `nav.json` (groups, items_ext, items, domains, mobile_nav — all wired via `i18nKey`)
- ✅ HR — `hr.json`
- ✅ IFRS — `ifrs.json`
- ✅ Common — `common.json`
- ⏳ Payroll — `payroll.json` (TODO)
- ⏳ Accounting — `accounting.json` (TODO)
- ⏳ Reports — `reports.json` (TODO)
- ⏳ CRM — `crm.json` (TODO)
- ⏳ Admin — `admin.json` (TODO)

## Troubleshooting

### Translation Not Showing

**Problem:** Component shows English even after adding translation.

**Solutions:**
1. Check the key path is correct: `t('domain.section.key')`
2. Verify the domain file is imported in `i18n.ts`
3. Clear browser cache and reload
4. Check browser console for i18n errors

### Fallback to English

**Problem:** Some keys show English in am/ti languages.

**Cause:** Missing translation in the language-specific section.

**Solution:** Add the missing key under `am` or `ti` in the domain file.

### Layout Breaking

**Problem:** Translated text breaks the UI layout.

**Cause:** Amharic/Tigrinya text is longer than English.

**Solutions:**
1. Use shorter synonyms if available
2. Adjust CSS to accommodate longer text (`text-overflow: ellipsis`, `line-clamp`)
3. Use tooltips for full text on hover

### Mixed Languages

**Problem:** Some parts show English, others show Amharic/Tigrinya.

**Cause:** Incomplete translation coverage.

**Solution:** Run a completeness audit and fill in missing keys.

## Resources

- [react-i18next Documentation](https://react.i18next.com/)
- [i18next Documentation](https://www.i18next.com/)
- [Ethiopian Government Terminology](https://www.erca.gov.et/)
- [Amharic Unicode Chart](https://unicode.org/charts/PDF/U1200.pdf)
- [Tigrinya Unicode Chart](https://unicode.org/charts/PDF/U1200.pdf)

## Contributing

When adding new features:

1. **Always add translations** — Don't hardcode English text
2. **Use existing patterns** — Follow the key naming conventions
3. **Test in all languages** — Switch languages and verify
4. **Document new domains** — Update this README if you create a new domain file
5. **Get translations reviewed** — Have a native speaker review am/ti translations

## Contact

For translation questions or to request new translations:
- **Technical:** Open an issue in the repository
- **Linguistic:** Contact the Ethiopian localization team
- **Urgent:** Reach out to the OVDS maintainers

---

**Last Updated:** 2026-07-05
**Version:** 3.0.0
**Maintainer:** OVDS Development Team
