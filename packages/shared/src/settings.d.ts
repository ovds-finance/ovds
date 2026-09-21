export interface CreateWebhookDto {
    /** max 500 chars */
    url: string;
    /** max 50 items */
    events?: string[];
    /** max 200 chars */
    secret?: string;
}
export interface UpdateWebhookDto {
    url?: string;
    events?: string[];
    secret?: string;
    isActive?: boolean;
}
//# sourceMappingURL=settings.d.ts.map