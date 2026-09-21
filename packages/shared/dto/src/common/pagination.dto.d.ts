export declare class PaginationQueryDto {
    page?: number;
    take?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    companyId?: string;
    status?: string;
    date?: string;
    type?: string;
    employeeId?: string;
    departmentId?: string;
    startDate?: string;
    endDate?: string;
    category?: string;
    vendorId?: string;
    customerId?: string;
    year?: number;
    month?: number;
    subsidiary?: string;
}
export declare class AuditLogQueryDto extends PaginationQueryDto {
}
//# sourceMappingURL=pagination.dto.d.ts.map