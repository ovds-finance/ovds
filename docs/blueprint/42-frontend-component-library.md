# 42 — Frontend Component Library Translation

## 1. Blade to React Component Mapping

The Laravel Blade component system maps to a React component library built with Radix UI and Tailwind CSS.

### 1.1 Layout Components

| Blade Component | React Component | Purpose |
|----------------|-----------------|---------|
| `layouts/app.blade.php` | `AppShell` | Main layout wrapper |
| `layouts/sidebar.blade.php` | `Sidebar` | Navigation sidebar |
| `layouts/header.blade.php` | `Header` | Top navigation bar |
| `layouts/content.blade.php` | `PageContent` | Main content area |
| `partials/menu.blade.php` | `NavigationMenu` | Menu rendering |
| `partials/breadcrumb.blade.php` | `Breadcrumb` | Breadcrumb navigation |

### 1.2 Form Components

| Blade Component | React Component | Purpose |
|----------------|-----------------|---------|
| `form/input.blade.php` | `FormInput` | Text input wrapper |
| `form/select.blade.php` | `FormSelect` | Select dropdown |
| `form/checkbox.blade.php` | `FormCheckbox` | Checkbox input |
| `form/textarea.blade.php` | `FormTextarea` | Textarea input |
| `form/date-picker.blade.php` | `DatePicker` | Date selection |
| `form/currency-input.blade.php` | `CurrencyInput` | Currency formatted input |
| `form/file-upload.blade.php` | `FileUpload` | File upload with drag-drop |
| `form/rich-text.blade.php` | `RichTextEditor` | WYSIWYG editor |

### 1.3 Document Components

| Blade Component | React Component | Purpose |
|----------------|-----------------|---------|
| `documents/table.blade.php` | `DocumentTable` | Document list |
| `documents/form.blade.php` | `DocumentForm` | Document create/edit |
| `documents/show.blade.php` | `DocumentShow` | Document detail view |
| `documents/item-row.blade.php` | `DocumentItemRow` | Line item in document |
| `documents/totals.blade.php` | `DocumentTotals` | Totals calculation display |
| `documents/status.blade.php` | `DocumentStatus` | Status badge |
| `documents/actions.blade.php` | `DocumentActions` | Action buttons |

### 1.4 Transaction Components

| Blade Component | React Component | Purpose |
|----------------|-----------------|---------|
| `transactions/table.blade.php` | `TransactionTable` | Transaction list |
| `transactions/form.blade.php` | `TransactionForm` | Transaction create/edit |
| `transactions/show.blade.php` | `TransactionShow` | Transaction detail |
| `transactions/import.blade.php` | `TransactionImport` | Import wizard |
| `transactions/reconcile.blade.php` | `ReconciliationWizard` | Reconciliation flow |

## 2. Component Architecture

### 2.1 Component Hierarchy

```
libs/ui/src/lib/components/
├── ui/                          # Base UI primitives (Radix)
│   ├── button/
│   ├── input/
│   ├── label/
│   ├── card/
│   ├── badge/
│   ├── alert/
│   ├── skeleton/
│   ├── dropdown-menu/
│   ├── dialog/
│   ├── toast/
│   └── ...
├── layout/                      # Layout components
│   ├── app-shell/
│   ├── sidebar/
│   ├── header/
│   ├── page-header/
│   ├── breadcrumb/
│   └── empty-state/
├── vat/                         # VAT-specific components
│   ├── vat-rate-input/
│   ├── jurisdiction-select/
│   ├── vat-period-picker/
│   ├── return-summary-card/
│   ├── return-status-badge/
│   └── transaction-line-item/
├── forms/                       # Form components
│   ├── form-field/
│   ├── currency-input/
│   ├── date-range-picker/
│   ├── file-upload/
│   ├── autocomplete/
│   └── rich-text-editor/
├── tables/                      # Table components
│   ├── data-table/
│   ├── table/
│   ├── table-body/
│   ├── table-row/
│   └── table-cell/
└── charts/                      # Chart components
    ├── bar-chart/
    ├── line-chart/
    ├── pie-chart/
    └── area-chart/
```

### 2.2 Base Component Pattern

```typescript
// libs/ui/src/lib/components/ui/button/button.tsx
import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
```

## 3. VAT-Specific Components

### 3.1 VAT Rate Input

```typescript
// libs/ui/src/lib/components/vat/vat-rate-input/vat-rate-input.tsx
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

interface VatRate {
  code: string;
  name: string;
  rate: number;
  type: 'standard' | 'reduced' | 'zero' | 'exempt';
}

interface VatRateInputProps {
  value?: string;
  onValueChange: (value: string) => void;
  rates: VatRate[];
  disabled?: boolean;
}

export function VatRateInput({ value, onValueChange, rates, disabled }: VatRateInputProps) {
  const selectedRate = rates.find((r) => r.code === value);

  return (
    <div className="flex gap-2">
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Select VAT rate" />
        </SelectTrigger>
        <SelectContent>
          {rates.map((rate) => (
            <SelectItem key={rate.code} value={rate.code}>
              <div className="flex items-center justify-between w-full">
                <span>{rate.name}</span>
                <span className="text-muted-foreground">{rate.rate}%</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {selectedRate && (
        <Input
          type="number"
          value={selectedRate.rate}
          disabled
          className="w-24"
        />
      )}
    </div>
  );
}
```

### 3.2 Jurisdiction Select

```typescript
// libs/ui/src/lib/components/vat/jurisdiction-select/jurisdiction-select.tsx
interface Jurisdiction {
  id: string;
  name: string;
  countryCode: string;
  regionCode?: string;
}

interface JurisdictionSelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  jurisdictions: Jurisdiction[];
  disabled?: boolean;
}

export function JurisdictionSelect({ value, onValueChange, jurisdictions, disabled }: JurisdictionSelectProps) {
  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger>
        <SelectValue placeholder="Select jurisdiction" />
      </SelectTrigger>
      <SelectContent>
        {jurisdictions.map((jurisdiction) => (
          <SelectItem key={jurisdiction.id} value={jurisdiction.id}>
            <div className="flex items-center gap-2">
              <span className="text-lg">{getCountryFlag(jurisdiction.countryCode)}</span>
              <span>{jurisdiction.name}</span>
              {jurisdiction.regionCode && (
                <span className="text-muted-foreground">({jurisdiction.regionCode})</span>
              )}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
```

### 3.3 Return Status Badge

```typescript
// libs/ui/src/lib/components/vat/return-status-badge/return-status-badge.tsx
const statusVariants: Record<VatReturnStatus, VariantProps<typeof badgeVariants>['variant']> = {
  draft: 'secondary',
  pending_review: 'outline',
  submitted: 'default',
  accepted: 'success',
  rejected: 'destructive',
  paid: 'success',
};

interface ReturnStatusBadgeProps {
  status: VatReturnStatus;
}

export function ReturnStatusBadge({ status }: ReturnStatusBadgeProps) {
  return (
    <Badge variant={statusVariants[status]}>
      {formatStatus(status)}
    </Badge>
  );
}
```

## 4. Form Components

### 4.1 Form Field Wrapper

```typescript
// libs/ui/src/lib/components/forms/form-field/form-field.tsx
import { useFormContext } from 'react-hook-form';
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

interface FormFieldProps {
  name: string;
  label: string;
  description?: string;
  render: (props: any) => React.ReactNode;
}

export function FormFieldWrapper({ name, label, description, render }: FormFieldProps) {
  const control = useFormContext().control;

  return (
    <FormField
      control={control}
      name={name}
      render={({ field, fieldState: { error } }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            {render({ field, error })}
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
```

## 5. Table Components

### 5.1 Data Table

```typescript
// libs/ui/src/lib/components/tables/data-table/data-table.tsx
import { useReactTable, getCoreRowModel, getPaginationRowModel, getSortedRowModel, getFilteredRowModel, flexRender } from '@tanstack/react-table';

interface DataTableProps<TData> {
  data: TData[];
  columns: ColumnDef<TData>[];
  pageSize?: number;
  onRowClick?: (row: TData) => void;
}

export function DataTable<TData>({ data, columns, pageSize = 20, onRowClick }: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize });

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    state: { sorting, columnFilters, pagination },
    initialState: { pagination: { pageSize } },
  });

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} onClick={() => onRowClick?.(row.original)}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} />
    </div>
  );
}
```

## 6. Livewire to React Translation

### 6.1 Livewire Component

```blade
{{-- Laravel: resources/views/livewire/notifications.blade.php --}}
<div>
  <div class="bell-icon">
    @if ($unreadCount > 0)
      <span class="badge">{{ $unreadCount }}</span>
    @endif
  </div>
  <div class="dropdown">
    @foreach ($notifications as $notification)
      <a href="{{ $notification['path'] }}">
        {{ $notification['title'] }}
      </a>
    @endforeach
  </div>
</div>
```

### 6.2 React Translation

```typescript
// React: features/notifications/components/notifications-dropdown.tsx
export function NotificationsDropdown() {
  const { data: notifications } = useNotifications();
  const unreadCount = notifications?.filter((n) => !n.readAt).length || 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[380px]">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications?.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">No notifications</div>
        ) : (
          notifications?.map((notification) => (
            <DropdownMenuItem key={notification.id} asChild>
              <Link href={notification.path} className="block">
                <div className="font-medium">{notification.title}</div>
                <div className="text-sm text-muted-foreground">{notification.message}</div>
              </Link>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

## 7. Tailwind CSS Classes

### 7.1 Class Organization

```
apps/web/src/styles/
├── global.css                  # Base styles
├── variables.css               # CSS custom properties
├── tailwind.css                # Tailwind directives
└── themes/
    ├── light.css               # Light theme variables
    └── dark.css                # Dark theme variables
```

### 7.2 Design Tokens

```css
/* styles/variables.css */
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
  --primary-foreground: 210 40% 98%;
  --muted: 210 40% 96.1%;
  --muted-foreground: 215.4 16.3% 46.9%;
  --border: 214.3 31.8% 91.4%;
  --destructive: 0 84.2% 60.2%;
  --success: 142.1 76.2% 36.3%;
  --warning: 38 92% 50%;
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  --primary: 210 40% 98%;
  --primary-foreground: 222.2 47.4% 11.2%;
  --muted: 217.2 32.6% 17.5%;
  --muted-foreground: 215 20.2% 65.1%;
  --border: 217.2 32.6% 17.5%;
}
```

## 8. Component Testing

```typescript
// libs/ui/src/lib/components/vat/vat-rate-input/vat-rate-input.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { VatRateInput } from './vat-rate-input';

const mockRates = [
  { code: 'STD', name: 'Standard', rate: 20, type: 'standard' },
  { code: 'RED', name: 'Reduced', rate: 10, type: 'reduced' },
];

describe('VatRateInput', () => {
  it('renders options', () => {
    render(<VatRateInput rates={mockRates} onValueChange={() => {}} />);
    expect(screen.getByText('Standard')).toBeInTheDocument();
    expect(screen.getByText('Reduced')).toBeInTheDocument();
  });

  it('calls onValueChange when selected', () => {
    const onValueChange = jest.fn();
    render(<VatRateInput rates={mockRates} onValueChange={onValueChange} />);

    fireEvent.click(screen.getByText('Standard'));
    expect(onValueChange).toHaveBeenCalledWith('STD');
  });
});
```

## 9. Storybook Documentation

```typescript
// libs/ui/src/lib/components/vat/vat-rate-input/vat-rate-input.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { VatRateInput } from './vat-rate-input';

const meta: Meta<typeof VatRateInput> = {
  title: 'VAT/VatRateInput',
  component: VatRateInput,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof VatRateInput>;

export const Default: Story = {
  args: {
    rates: [
      { code: 'STD', name: 'Standard', rate: 20, type: 'standard' },
      { code: 'RED', name: 'Reduced', rate: 10, type: 'reduced' },
    ],
    onValueChange: () => {},
  },
};

export const Disabled: Story = {
  args: {
    rates: [],
    onValueChange: () => {},
    disabled: true,
  },
};
```
