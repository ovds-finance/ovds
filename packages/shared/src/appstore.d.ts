export interface AppDto {
    name: string;
    slug?: string;
    version: string;
    developer: string;
    description?: string;
    iconUrl?: string;
    downloadUrl: string;
}
export interface ReviewDto {
    appId: string;
    userId?: string;
    /** integer 1–5 */
    rating: number;
    comment?: string;
}
//# sourceMappingURL=appstore.d.ts.map