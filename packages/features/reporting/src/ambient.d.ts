declare module '../../../context/businessContext' {
  export function useBusiness(): { selectedCompanyId?: string };
}
declare module '../../../utils/download' {
  export function downloadBlob(blob: Blob, filename: string): void;
  export function downloadCSV(csv: string, filename: string): void;
}
declare module '../../../hooks' {
  export function useLocalStorage<T>(key: string, initial: T): [T, (v: T) => void];
}
