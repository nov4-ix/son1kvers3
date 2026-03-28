/**
 * Formatting utilities for Super-Son1k-2.0
 */

/**
 * Format file size in human readable format
 */
export function formatFileSize(bytes: number): string {
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 Bytes';
  
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Format duration in human readable format
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format date in human readable format
 */
export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  
  return dateObj.toLocaleDateString('en-US', { ...defaultOptions, ...options });
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'just now';
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  }
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`;
  }
  
  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears} year${diffInYears > 1 ? 's' : ''} ago`;
}

/**
 * Format number with commas
 */
export function formatNumber(num: number): string {
  return num.toLocaleString();
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Format currency
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(amount);
}

/**
 * Format username with @ symbol
 */
export function formatUsername(username: string): string {
  return username.startsWith('@') ? username : `@${username}`;
}

/**
 * Format tier name with proper casing
 */
export function formatTierName(tier: string): string {
  return tier.charAt(0).toUpperCase() + tier.slice(1).toLowerCase();
}

/**
 * Format generation status
 */
export function formatGenerationStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'pending': 'Pending',
    'processing': 'Processing',
    'completed': 'Completed',
    'failed': 'Failed',
    'cancelled': 'Cancelled'
  };
  
  return statusMap[status.toLowerCase()] || status;
}

/**
 * Format quality level
 */
export function formatQuality(quality: string): string {
  const qualityMap: Record<string, string> = {
    'standard': 'Standard',
    'high': 'High',
    'premium': 'Premium',
    'enterprise': 'Enterprise'
  };
  
  return qualityMap[quality.toLowerCase()] || quality;
}

/**
 * Format musical key
 */
export function formatMusicalKey(key: string): string {
  return key.toUpperCase();
}

/**
 * Format musical tempo
 */
export function formatTempo(tempo: number): string {
  return `${tempo} BPM`;
}

/**
 * Format musical duration
 */
export function formatMusicalDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes > 0) {
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  
  return `${remainingSeconds}s`;
}

/**
 * Format file extension
 */
export function formatFileExtension(filename: string): string {
  const extension = filename.split('.').pop();
  return extension ? extension.toUpperCase() : '';
}

/**
 * Format file type
 */
export function formatFileType(filename: string): string {
  const extension = formatFileExtension(filename).toLowerCase();
  
  const typeMap: Record<string, string> = {
    'mp3': 'Audio',
    'wav': 'Audio',
    'flac': 'Audio',
    'aac': 'Audio',
    'jpg': 'Image',
    'jpeg': 'Image',
    'png': 'Image',
    'gif': 'Image',
    'webp': 'Image',
    'svg': 'Image',
    'mp4': 'Video',
    'avi': 'Video',
    'mov': 'Video',
    'wmv': 'Video',
    'pdf': 'Document',
    'doc': 'Document',
    'docx': 'Document',
    'txt': 'Document'
  };
  
  return typeMap[extension] || 'File';
}

/**
 * Format API response
 */
export function formatAPIResponse<T>(data: T, message?: string): {
  success: true;
  data: T;
  message?: string;
  timestamp: string;
} {
  return {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString()
  };
}

/**
 * Format pagination info
 */
export function formatPagination(page: number, limit: number, total: number): {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
} {
  const pages = Math.ceil(total / limit);
  
  return {
    page,
    limit,
    total,
    pages,
    hasNext: page < pages,
    hasPrev: page > 1
  };
}

/**
 * Format error message
 */
export function formatErrorMessage(error: any): string {
  if (typeof error === 'string') {
    return error;
  }
  
  if (error?.message) {
    return error.message;
  }
  
  if (error?.error?.message) {
    return error.error.message;
  }
  
  return 'An unknown error occurred';
}

/**
 * Format success message
 */
export function formatSuccessMessage(message: string, data?: any): string {
  if (data) {
    return `${message}: ${JSON.stringify(data)}`;
  }
  
  return message;
}

/**
 * Format validation errors
 */
export function formatValidationErrors(errors: any[]): string[] {
  return errors.map(error => {
    if (typeof error === 'string') {
      return error;
    }
    
    if (error?.message) {
      return error.message;
    }
    
    if (error?.path && error?.message) {
      return `${error.path.join('.')}: ${error.message}`;
    }
    
    return 'Validation error';
  });
}

/**
 * Format search query
 */
export function formatSearchQuery(query: string): string {
  return query.trim().toLowerCase().replace(/[^\w\s]/g, '');
}

/**
 * Format hashtag
 */
export function formatHashtag(tag: string): string {
  const cleaned = tag.replace(/[^\w]/g, '');
  return cleaned.startsWith('#') ? cleaned : `#${cleaned}`;
}

/**
 * Format mention
 */
export function formatMention(username: string): string {
  const cleaned = username.replace(/[^\w]/g, '');
  return cleaned.startsWith('@') ? cleaned : `@${cleaned}`;
}
