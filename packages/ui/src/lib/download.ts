/**
 * @ovds/ui — browser download utilities
 * Browser-only helpers for triggering file downloads.
 */

/**
 * Trigger a browser file download from a Blob.
 * Automatically revokes the object URL after the click.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

/**
 * Trigger a browser file download from a CSV string.
 * Adds a UTF-8 BOM so Excel opens it correctly.
 */
export function downloadCSV(csv: string, filename: string): void {
  downloadBlob(
    new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' }),
    filename,
  );
}

/**
 * Trigger a browser file download from a JSON string.
 */
export function downloadJSON(json: string, filename: string): void {
  downloadBlob(new Blob([json], { type: 'application/json' }), filename);
}
