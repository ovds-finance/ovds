export declare class CreateTicketDto {
    title: string;
    description?: string;
    priority?: string;
    category?: string;
    assignedTo?: string;
    companyId?: string;
}
export declare class UpdateTicketDto {
    title?: string;
    description?: string;
    status?: string;
    priority?: string;
    category?: string;
    assignedTo?: string;
}
export declare class AddTicketReplyDto {
    content: string;
    attachmentUrl?: string;
}
export declare class BulkUpdateTicketStatusDto {
    ids: string[];
    status: string;
}
//# sourceMappingURL=helpdesk.dto.d.ts.map