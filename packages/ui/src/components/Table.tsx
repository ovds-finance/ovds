import React from 'react';
import { clsx } from 'clsx';

interface Column<T> {
  key: string;
  header: string;
  render?: (row: T, index: number) => React.ReactNode;
  className?: string;
}

interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (row: T) => string;
  striped?: boolean;
  hoverable?: boolean;
  emptyMessage?: string;
  className?: string;
}

export function Table<T>({ 
  data, 
  columns, 
  keyExtractor, 
  striped = true, 
  hoverable = true, 
  emptyMessage = 'No data available',
  className 
}: TableProps<T>) {
  return (
    <div className={clsx('overflow-x-auto rounded-lg border border-gray-200', className)}>
      <table className="w-full text-sm text-left">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={clsx('px-4 py-3 font-medium text-gray-500 uppercase tracking-wider', column.className)}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-gray-500">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr
                key={keyExtractor(row)}
                className={clsx(
                  hoverable && 'hover:bg-gray-50',
                  striped && rowIndex % 2 === 1 && 'bg-gray-50'
                )}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={clsx('px-4 py-3 text-gray-900', column.className)}
                  >
                    {column.render 
                      ? column.render(row, rowIndex) 
                      : (row as any)[column.key]
                    }
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}