export declare enum ProjectActivityType {
    TASK_CREATED = "TASK_CREATED",
    TASK_UPDATED = "TASK_UPDATED",
    TIMER_STARTED = "TIMER_STARTED",
    TIMER_STOPPED = "TIMER_STOPPED",
    TIMESHEET_CREATED = "TIMESHEET_CREATED",
    COMMENT_ADDED = "COMMENT_ADDED",
    FILE_ATTACHED = "FILE_ATTACHED",
    FINANCIAL_LINKED = "FINANCIAL_LINKED",
    MILESTONE_UPDATED = "MILESTONE_UPDATED",
    STATUS_CHANGED = "STATUS_CHANGED",
    BILLING_UPDATED = "BILLING_UPDATED"
}
export declare class CreateProjectActivityDto {
    projectId: string;
    taskId?: string;
    milestoneId?: string;
    activityType: ProjectActivityType;
    title?: string;
    description?: string;
    delta?: string;
    companyId?: string;
}
export declare class UpdateProjectActivityDto {
    activityType?: ProjectActivityType;
    title?: string;
    description?: string;
    delta?: string;
}
//# sourceMappingURL=project-activity.dto.d.ts.map