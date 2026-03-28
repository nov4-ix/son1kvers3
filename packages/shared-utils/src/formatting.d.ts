/**
 * Formatting utilities for Super-Son1k-2.0
 */
/**
 * Format file size in human readable format
 */
export declare function formatFileSize(bytes: number): string;
/**
 * Format duration in human readable format
 */
export declare function formatDuration(seconds: number): string;
/**
 * Format date in human readable format
 */
export declare function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string;
/**
 * Format relative time (e.g., "2 hours ago")
 */
export declare function formatRelativeTime(date: Date | string): string;
/**
 * Format number with commas
 */
export declare function formatNumber(num: number): string;
/**
 * Format percentage
 */
export declare function formatPercentage(value: number, decimals?: number): string;
/**
 * Format currency
 */
export declare function formatCurrency(amount: number, currency?: string): string;
/**
 * Format username with @ symbol
 */
export declare function formatUsername(username: string): string;
/**
 * Format tier name with proper casing
 */
export declare function formatTierName(tier: string): string;
/**
 * Format generation status
 */
export declare function formatGenerationStatus(status: string): string;
/**
 * Format quality level
 */
export declare function formatQuality(quality: string): string;
/**
 * Format musical key
 */
export declare function formatMusicalKey(key: string): string;
/**
 * Format musical tempo
 */
export declare function formatTempo(tempo: number): string;
/**
 * Format musical duration
 */
export declare function formatMusicalDuration(seconds: number): string;
/**
 * Format file extension
 */
export declare function formatFileExtension(filename: string): string;
/**
 * Format file type
 */
export declare function formatFileType(filename: string): string;
/**
 * Format API response
 */
export declare function formatAPIResponse<T>(data: T, message?: string): {
    success: true;
    data: T;
    message?: string;
    timestamp: string;
};
/**
 * Format pagination info
 */
export declare function formatPagination(page: number, limit: number, total: number): {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
};
/**
 * Format error message
 */
export declare function formatErrorMessage(error: any): string;
/**
 * Format success message
 */
export declare function formatSuccessMessage(message: string, data?: any): string;
/**
 * Format validation errors
 */
export declare function formatValidationErrors(errors: any[]): string[];
/**
 * Format search query
 */
export declare function formatSearchQuery(query: string): string;
/**
 * Format hashtag
 */
export declare function formatHashtag(tag: string): string;
/**
 * Format mention
 */
export declare function formatMention(username: string): string;
//# sourceMappingURL=formatting.d.ts.map