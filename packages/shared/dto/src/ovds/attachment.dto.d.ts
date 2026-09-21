export declare class CreateAttachmentDto {
    filename: string;
    mimeType: string;
    fileSize: number;
    fileData?: string;
    attachableId: string;
    attachableType: 'TaxRate' | 'Invoice' | 'Bill' | 'JournalEntry';
    description?: string;
}
//# sourceMappingURL=attachment.dto.d.ts.map