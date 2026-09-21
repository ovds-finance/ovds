import { ProjectStatus } from '@ovds/shared/types';
export declare class CreateProjectDto {
    name: string;
    description?: string;
    status?: ProjectStatus;
    budget?: number;
    spent?: number;
    progress?: number;
    startDate?: string;
    endDate?: string;
    manager?: string;
    teamSize?: number;
    companyId?: string;
    customFields?: Record<string, string | null>;
}
export declare class UpdateProjectDto {
    name?: string;
    description?: string;
    status?: ProjectStatus;
    budget?: number;
    spent?: number;
    progress?: number;
    startDate?: string;
    endDate?: string;
    manager?: string;
    teamSize?: number;
    customFields?: Record<string, string | null>;
}
//# sourceMappingURL=project.dto.d.ts.map