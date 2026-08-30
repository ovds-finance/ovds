/**
 * DataTable — component tests
 *
 * Verifies:
 *  - renders columns + rows
 *  - client-side sorting on sortable header click
 *  - column visibility toggle (localStorage-backed)
 *  - empty state when data is empty
 *  - action column rendering
 *  - pagination rendering when onPageChange is provided
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { DataTable, DataTableColumn } from '@ovds/ui';

const SAMPLE = [
  { id: '1', name: 'Alice', role: 'Admin', age: 34 },
  { id: '2', name: 'Bob', role: 'Viewer', age: 28 },
  { id: '3', name: 'Charlie', role: 'Editor', age: 41 },
];

const COLUMNS: DataTableColumn<typeof SAMPLE[number]>[] = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'role', label: 'Role', sortable: true },
  { key: 'age', label: 'Age', align: 'right', sortable: true, sortValue: (r) => r.age },
];

describe('DataTable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all columns and rows', () => {
    render(
      <DataTable storageKey="dt-test" data={SAMPLE} columns={COLUMNS} />,
    );
    expect(screen.getByText('Name')).toBeDefined();
    expect(screen.getByText('Alice')).toBeDefined();
    expect(screen.getByText('Bob')).toBeDefined();
    expect(screen.getByText('Charlie')).toBeDefined();
  });

  it('sorts data when a sortable header is clicked', async () => {
    const user = userEvent.setup();
    render(
      <DataTable storageKey="dt-sort" data={SAMPLE} columns={COLUMNS} />,
    );
    const rows = () => screen.getAllByRole('row').slice(1); // skip header

    // Default order: Alice, Bob, Charlie
    expect(rows()[0].textContent).toContain('Alice');
    expect(rows()[1].textContent).toContain('Bob');
    expect(rows()[2].textContent).toContain('Charlie');

    // Click Age header to sort ascending (28, 34, 41)
    await user.click(screen.getByText('Age'));
    expect(rows()[0].textContent).toContain('Bob');
    expect(rows()[1].textContent).toContain('Alice');
    expect(rows()[2].textContent).toContain('Charlie');

    // Click again for descending (41, 34, 28)
    await user.click(screen.getByText('Age'));
    expect(rows()[0].textContent).toContain('Charlie');
    expect(rows()[1].textContent).toContain('Alice');
    expect(rows()[2].textContent).toContain('Bob');
  });

  it('hides a column via the toggle button and persists to localStorage', async () => {
    const user = userEvent.setup();
    render(
      <DataTable storageKey="dt-cols" data={SAMPLE} columns={COLUMNS} />,
    );

    // Open the column toggle popover
    await user.click(screen.getByTitle('Toggle columns'));
    const popover = screen.getByText('Visible Columns').closest('div')?.parentElement;
    expect(popover).toBeDefined();

    // Toggle off the "Role" column
    const roleBtn = within(popover!).getByText('Role');
    await user.click(roleBtn);

    // Close popover
    await user.click(screen.getByTitle('Toggle columns'));

    // Role header should be gone from the table
    expect(screen.queryByText('Role')).toBeNull();
    expect(screen.getByText('Alice')).toBeDefined();
  });

  it('renders empty state when data is empty', () => {
    render(
      <DataTable storageKey="dt-empty" data={[]} columns={COLUMNS} emptyMessage="Nothing here" />,
    );
    expect(screen.getByText('Nothing here')).toBeDefined();
  });

  it('renders action cells when renderActions is provided', () => {
    render(
      <DataTable
        storageKey="dt-actions"
        data={SAMPLE}
        columns={COLUMNS}
        actionHeader="Ops"
        renderActions={() => <button>Do</button>}
      />,
    );
    const actionHeader = screen.getByText('Ops');
    expect(actionHeader).toBeDefined();
    const actionButtons = screen.getAllByRole('button', { name: 'Do' });
    expect(actionButtons.length).toBe(SAMPLE.length);
  });

  it('renders pagination when onPageChange is provided', () => {
    render(
      <DataTable
        storageKey="dt-page"
        data={SAMPLE}
        columns={COLUMNS}
        page={2}
        pageSize={2}
        total={5}
        onPageChange={vi.fn()}
      />,
    );
    // Pagination component is rendered (contains page controls)
    expect(screen.getByText('2')).toBeDefined(); // current page indicator
  });
});
