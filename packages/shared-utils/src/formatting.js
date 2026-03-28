"use strict";
/**
 * Formatting utilities for Super-Son1k-2.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatFileSize = formatFileSize;
exports.formatDuration = formatDuration;
exports.formatDate = formatDate;
exports.formatRelativeTime = formatRelativeTime;
exports.formatNumber = formatNumber;
exports.formatPercentage = formatPercentage;
exports.formatCurrency = formatCurrency;
exports.formatUsername = formatUsername;
exports.formatTierName = formatTierName;
exports.formatGenerationStatus = formatGenerationStatus;
exports.formatQuality = formatQuality;
exports.formatMusicalKey = formatMusicalKey;
exports.formatTempo = formatTempo;
exports.formatMusicalDuration = formatMusicalDuration;
exports.formatFileExtension = formatFileExtension;
exports.formatFileType = formatFileType;
exports.formatAPIResponse = formatAPIResponse;
exports.formatPagination = formatPagination;
exports.formatErrorMessage = formatErrorMessage;
exports.formatSuccessMessage = formatSuccessMessage;
exports.formatValidationErrors = formatValidationErrors;
exports.formatSearchQuery = formatSearchQuery;
exports.formatHashtag = formatHashtag;
exports.formatMention = formatMention;
/**
 * Format file size in human readable format
 */
function formatFileSize(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0)
        return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}
/**
 * Format duration in human readable format
 */
function formatDuration(seconds) {
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
function formatDate(date, options) {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const defaultOptions = {
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
function formatRelativeTime(date) {
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
function formatNumber(num) {
    return num.toLocaleString();
}
/**
 * Format percentage
 */
function formatPercentage(value, decimals = 1) {
    return `${(value * 100).toFixed(decimals)}%`;
}
/**
 * Format currency
 */
function formatCurrency(amount, currency = 'USD') {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency
    }).format(amount);
}
/**
 * Format username with @ symbol
 */
function formatUsername(username) {
    return username.startsWith('@') ? username : `@${username}`;
}
/**
 * Format tier name with proper casing
 */
function formatTierName(tier) {
    return tier.charAt(0).toUpperCase() + tier.slice(1).toLowerCase();
}
/**
 * Format generation status
 */
function formatGenerationStatus(status) {
    const statusMap = {
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
function formatQuality(quality) {
    const qualityMap = {
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
function formatMusicalKey(key) {
    return key.toUpperCase();
}
/**
 * Format musical tempo
 */
function formatTempo(tempo) {
    return `${tempo} BPM`;
}
/**
 * Format musical duration
 */
function formatMusicalDuration(seconds) {
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
function formatFileExtension(filename) {
    const extension = filename.split('.').pop();
    return extension ? extension.toUpperCase() : '';
}
/**
 * Format file type
 */
function formatFileType(filename) {
    const extension = formatFileExtension(filename).toLowerCase();
    const typeMap = {
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
function formatAPIResponse(data, message) {
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
function formatPagination(page, limit, total) {
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
function formatErrorMessage(error) {
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
function formatSuccessMessage(message, data) {
    if (data) {
        return `${message}: ${JSON.stringify(data)}`;
    }
    return message;
}
/**
 * Format validation errors
 */
function formatValidationErrors(errors) {
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
function formatSearchQuery(query) {
    return query.trim().toLowerCase().replace(/[^\w\s]/g, '');
}
/**
 * Format hashtag
 */
function formatHashtag(tag) {
    const cleaned = tag.replace(/[^\w]/g, '');
    return cleaned.startsWith('#') ? cleaned : `#${cleaned}`;
}
/**
 * Format mention
 */
function formatMention(username) {
    const cleaned = username.replace(/[^\w]/g, '');
    return cleaned.startsWith('@') ? cleaned : `@${cleaned}`;
}
//# sourceMappingURL=formatting.js.map