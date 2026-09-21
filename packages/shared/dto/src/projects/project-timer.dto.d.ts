export declare class StartProjectTimerDto {
    projectId: string;
    taskId: string;
    employeeName?: string;
    notes?: string;
}
export declare class StopProjectTimerDto {
    notes?: string;
    hours?: number;
}
export declare class CreateProjectTimerDto {
    projectId: string;
    taskId: string;
    employeeName?: string;
    notes?: string;
    hours?: number;
}
export declare class UpdateProjectTimerDto {
    employeeName?: string;
    notes?: string;
    hours?: number;
}
//# sourceMappingURL=project-timer.dto.d.ts.map