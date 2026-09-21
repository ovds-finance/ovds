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
export declare class DataMappingRegistry {
    private readonly mappings;
    private getKey;
    register<TInput, TOutput>(source: string, target: string, mapper: MapperFunction<TInput, TOutput>): this;
    getMapper<TInput, TOutput>(source: string, target: string): MapperFunction<TInput, TOutput> | undefined;
    getMappers(source: string, target: string): MappingEntry[];
    map<TInput, TOutput>(source: string, target: string, data: TInput): TOutput;
    hasMapping(source: string, target: string): boolean;
    listMappings(): {
        source: string;
        target: string;
        count: number;
    }[];
}
export declare const globalDataMappingRegistry: DataMappingRegistry;
//# sourceMappingURL=data-mapping-registry.d.ts.map