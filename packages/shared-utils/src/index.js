"use strict";
/**
 * Shared Utilities for Super-Son1k-2.0
 * Common utilities used across the application
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationError = void 0;
// Security utilities
__exportStar(require("./security"), exports);
// Validation utilities
__exportStar(require("./validation"), exports);
// Error handling utilities
__exportStar(require("./errors"), exports);
// Re-export ValidationError from validation (overrides the one from errors)
var validation_1 = require("./validation");
Object.defineProperty(exports, "ValidationError", { enumerable: true, get: function () { return validation_1.ValidationError; } });
// Formatting utilities
__exportStar(require("./formatting"), exports);
// Audio utilities
__exportStar(require("./audio"), exports);
// Constants
__exportStar(require("./constants"), exports);
//# sourceMappingURL=index.js.map