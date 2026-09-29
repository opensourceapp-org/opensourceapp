import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Column<T> = {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
};

type DataTableProps<T> = {
  columns: Column<T>[];
  rows: T[];
  emptyMessage?: string;
  className?: string;
  getRowKey: (row: T) => string;
};

export function DataTable<T>({
  columns,
  rows,
  emptyMessage = "No rows",
  className,
  getRowKey,
}: DataTableProps<T>) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">{emptyMessage}</p>
    );
  }

  return (
    <div className={cn("overflow-x-auto rounded-lg border border-border", className)}>
      <table className="w-full min-w-[640px] text-sm">
        <thead className="border-b border-border bg-surface-muted text-left text-muted-foreground">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn("px-3 py-2 font-medium", col.className)}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border bg-surface">
          {rows.map((row) => (
            <tr key={getRowKey(row)} className="hover:bg-muted/40">
              {columns.map((col) => (
                <td key={col.key} className={cn("px-3 py-2.5 align-top", col.className)}>
                  {col.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
