/**
 * DataMappingRegistry — maps OVDS internal data models to external formats.
 *
 * Primary use case: OVDS → MoR EIMS (Ethiopian Ministry of Revenues)
 * payload transformation for invoice registration, receipts, and summary reports.
 *
 * Framework-agnostic; no NestJS imports.
 */

export type MapperFunction<TInput, TOutput> = (input: TInput) => TOutput;

export interface MappingEntry<TInput = unknown, TOutput = unknown> {
  source: string;
  target: string;
  mapper: MapperFunction<TInput, TOutput>;
}

export class DataMappingRegistry {
  private readonly mappings = new Map<string, MappingEntry[]>();

  private getKey(source: string, target: string): string {
    return `${source}->${target}`;
  }

  register<TInput, TOutput>(source: string, target: string, mapper: MapperFunction<TInput, TOutput>): this {
    const key = this.getKey(source, target);
    const existing = this.mappings.get(key) ?? [];
    existing.push({ source, target, mapper: mapper as MapperFunction<unknown, unknown> });
    this.mappings.set(key, existing);
    return this;
  }

  getMapper<TInput, TOutput>(source: string, target: string): MapperFunction<TInput, TOutput> | undefined {
    const entries = this.mappings.get(this.getKey(source, target));
    if (!entries || entries.length === 0) return undefined;
    return entries[0].mapper as MapperFunction<TInput, TOutput>;
  }

  getMappers(source: string, target: string): MappingEntry[] {
    return this.mappings.get(this.getKey(source, target)) ?? [];
  }

  map<TInput, TOutput>(source: string, target: string, data: TInput): TOutput {
    const mapper = this.getMapper<TInput, TOutput>(source, target);
    if (!mapper) {
      throw new Error(`No mapper registered for ${source} -> ${target}`);
    }
    return mapper(data);
  }

  hasMapping(source: string, target: string): boolean {
    return this.mappings.has(this.getKey(source, target));
  }

  listMappings(): { source: string; target: string; count: number }[] {
    const result: { source: string; target: string; count: number }[] = [];
    for (const [key, entries] of this.mappings.entries()) {
      const [source, target] = key.split('->');
      result.push({ source, target, count: entries.length });
    }
    return result;
  }
}

export const globalDataMappingRegistry = new DataMappingRegistry();
