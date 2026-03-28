/**
 * Alert Service
 * Monitors critical system state and sends alerts
 */

import { EventEmitter } from 'events';
import axios from 'axios';

export interface Alert {
  id: string;
  level: 'info' | 'warning' | 'critical';
  message: string;
  category: 'token_pool' | 'rate_limit' | 'error_rate' | 'system';
  details?: Record<string, any>;
  timestamp: Date;
  resolved?: boolean;
  resolvedAt?: Date;
}

export class AlertService extends EventEmitter {
  private alerts: Map<string, Alert> = new Map();
  private readonly SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;
  private readonly ALERT_RETENTION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

  constructor() {
    super();

    // Cleanup old alerts every hour
    setInterval(() => this.cleanupOldAlerts(), 60 * 60 * 1000);
  }

  /**
   * Create a new alert
   */
  async createAlert(
    level: Alert['level'],
    category: Alert['category'],
    message: string,
    details?: Record<string, any>
  ): Promise<Alert> {
    const alert: Alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      level,
      message,
      category,
      details,
      timestamp: new Date(),
      resolved: false,
    };

    // Store alert
    this.alerts.set(alert.id, alert);

    // Emit event
    this.emit('alert', alert);

    // Send notification for critical/warning alerts
    if (level === 'critical' || level === 'warning') {
      await this.sendNotification(alert);
    }

    // Log alert
    const logLevel = level === 'critical' ? 'error' : level === 'warning' ? 'warn' : 'info';
    console[logLevel](`🚨 [${level.toUpperCase()}] ${category}: ${message}`, details || '');

    return alert;
  }

  /**
   * Resolve an alert
   */
  async resolveAlert(alertId: string): Promise<boolean> {
    const alert = this.alerts.get(alertId);
    if (!alert) {
      return false;
    }

    alert.resolved = true;
    alert.resolvedAt = new Date();
    this.alerts.set(alertId, alert);

    this.emit('alertResolved', alert);

    console.log(`✅ Alert resolved: ${alertId} - ${alert.message}`);

    return true;
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(level?: Alert['level']): Alert[] {
    const alerts = Array.from(this.alerts.values())
      .filter((alert) => !alert.resolved);

    if (level) {
      return alerts.filter((alert) => alert.level === level);
    }

    return alerts;
  }

  /**
   * Get all alerts
   */
  getAllAlerts(limit: number = 100): Alert[] {
    return Array.from(this.alerts.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Send notification (Slack, Email, etc.)
   */
  private async sendNotification(alert: Alert): Promise<void> {
    // Send to Slack if configured
    if (this.SLACK_WEBHOOK_URL) {
      try {
        const emoji = alert.level === 'critical' ? '🚨' : alert.level === 'warning' ? '⚠️' : 'ℹ️';
        const color = alert.level === 'critical' ? '#ff0000' : alert.level === 'warning' ? '#ffaa00' : '#00aaff';

        await axios.post(this.SLACK_WEBHOOK_URL, {
          text: `${emoji} ${alert.level.toUpperCase()}: ${alert.message}`,
          attachments: [
            {
              color,
              fields: [
                {
                  title: 'Category',
                  value: alert.category,
                  short: true,
                },
                {
                  title: 'Time',
                  value: alert.timestamp.toISOString(),
                  short: true,
                },
                ...(alert.details
                  ? Object.entries(alert.details).map(([key, value]) => ({
                      title: key,
                      value: String(value),
                      short: true,
                    }))
                  : []),
              ],
            },
          ],
        });
      } catch (error) {
        console.error('Failed to send Slack notification:', error);
      }
    }

    // Future: Add email notifications, PagerDuty, etc.
  }

  /**
   * Monitor token pool health
   * DEPRECATED - Token pool system removed
   */
  async monitorTokenPool(healthyCount: number, totalCount: number): Promise<void> {
    // Token pool system removed - using Music Lab API instead
    console.log('Token pool monitoring disabled - using Music Lab API');
  }


  /**
   * Monitor error rate
   */
  async monitorErrorRate(errorRate: number, threshold: number = 0.1): Promise<void> {
    if (errorRate > threshold) {
      await this.createAlert(
        'warning',
        'error_rate',
        `High error rate detected: ${(errorRate * 100).toFixed(1)}% (threshold: ${(threshold * 100).toFixed(1)}%)`,
        { errorRate, threshold }
      );
    } else {
      // Resolve error rate alerts if we're below threshold
      const activeAlerts = this.getActiveAlerts().filter(
        (a) => a.category === 'error_rate' && a.level === 'warning'
      );
      for (const alert of activeAlerts) {
        await this.resolveAlert(alert.id);
      }
    }
  }

  /**
   * Monitor rate limit violations
   */
  async monitorRateLimitViolations(violationCount: number, timeWindow: number = 3600000): Promise<void> {
    if (violationCount > 50) {
      await this.createAlert(
        'warning',
        'rate_limit',
        `High rate limit violations: ${violationCount} in last ${timeWindow / 1000}s`,
        { violationCount, timeWindow }
      );
    }
  }

  /**
   * Cleanup old alerts
   */
  private cleanupOldAlerts(): void {
    const cutoff = new Date(Date.now() - this.ALERT_RETENTION_MS);
    let cleaned = 0;

    for (const [id, alert] of this.alerts.entries()) {
      if (alert.timestamp < cutoff && alert.resolved) {
        this.alerts.delete(id);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`Cleaned up ${cleaned} old alerts`);
    }
  }

  /**
   * Get alert statistics
   */
  getAlertStats(): {
    total: number;
    active: number;
    byLevel: Record<string, number>;
    byCategory: Record<string, number>;
  } {
    const alerts = Array.from(this.alerts.values());
    const active = alerts.filter((a) => !a.resolved);

    const byLevel: Record<string, number> = {};
    const byCategory: Record<string, number> = {};

    for (const alert of active) {
      byLevel[alert.level] = (byLevel[alert.level] || 0) + 1;
      byCategory[alert.category] = (byCategory[alert.category] || 0) + 1;
    }

    return {
      total: alerts.length,
      active: active.length,
      byLevel,
      byCategory,
    };
  }
}

// Singleton instance
let alertService: AlertService | null = null;

export function getAlertService(): AlertService {
  if (!alertService) {
    alertService = new AlertService();
  }
  return alertService;
}

