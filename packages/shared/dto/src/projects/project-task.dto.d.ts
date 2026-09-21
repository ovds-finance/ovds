export declare enum TaskStatus {
    TODO = "TODO",
    IN_PROGRESS = "IN_PROGRESS",
    REVIEW = "REVIEW",
    DONE = "DONE",
    CANCELLED = "CANCELLED"
}
export declare enum TaskPriority {
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH",
    URGENT = "URGENT"
}
export declare enum BillingStyle {
    FIXED_PER_HOUR = "FIXED_PER_HOUR",
    FIXED_PRICE = "FIXED_PRICE",
    FIXED_PER_TASK = "FIXED_PER_TASK"
}
export declare class CreateProjectTaskDto {
    projectId: string;
    milestoneId?: string;
    title: string;
    description?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    assignedTo?: string;
    dueDate?: string;
    estimatedHours?: number;
    billingStyle?: BillingStyle;
    fixedRate?: number;
    profitMargin?: number;
    companyId?: string;
}
export declare class UpdateProjectTaskDto {
    title?: string;
    description?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    assignedTo?: string;
    dueDate?: string;
    estimatedHours?: number;
    actualHours?: number;
    milestoneId?: string;
    billingStyle?: BillingStyle;
    fixedRate?: number;
    profitMargin?: number;
}
export declare class CreateProjectMilestoneDto {
    projectId: string;
    name: string;
    description?: string;
    dueDate?: string;
    status?: string;
    progress?: number;
    budget?: number;
    spent?: number;
    companyId?: string;
}
export declare class UpdateProjectMilestoneDto {
    name?: string;
    description?: string;
    dueDate?: string;
    status?: string;
    progress?: number;
    budget?: number;
    spent?: number;
}
export declare class CreateProjectTimesheetDto {
    projectId: string;
    taskId?: string;
    employeeName?: string;
    date: string;
    hours: number;
    description?: string;
    billable?: boolean;
    hourlyRate?: number;
    companyId?: string;
}
export declare class UpdateProjectTimesheetDto {
    taskId?: string;
    employeeName?: string;
    date?: string;
    hours?: number;
    description?: string;
    billable?: boolean;
    hourlyRate?: number;
}
//# sourceMappingURL=project-task.dto.d.ts.map