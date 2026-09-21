import { ReleaseType } from './types';
export { ReleaseType };
export interface CreateReleaseDto {
    version: string;
    changelog?: string;
    isMandatory?: boolean;
    type?: ReleaseType;
}
export interface ApplyReleaseDto {
    releaseId: string;
}
export interface CreateFeatureFlagDto {
    name: string;
    description?: string;
}
export interface ToggleFeatureFlagDto {
    companyId: string;
    flagId: string;
    isEnabled: boolean;
}
//# sourceMappingURL=release.d.ts.map