const webSocketService = require('./WebSocket.service');
const ScraperRun = require('../models/ScraperRun.model');
const Scraper = require('../models/Scraper.model');

class ErrorHandlerService {
    constructor() {
        this.retryStrategies = {
            network_error: { maxRetries: 3, delay: 5000, backoff: 'exponential' },
            timeout_error: { maxRetries: 2, delay: 10000, backoff: 'linear' },
            selector_error: { maxRetries: 1, delay: 2000, backoff: 'none' },
            navigation_error: { maxRetries: 3, delay: 3000, backoff: 'exponential' },
            memory_error: { maxRetries: 1, delay: 15000, backoff: 'none' },
            // rate_limit_error: { maxRetries: 5, delay: 30000, backoff: 'exponential' },
            captcha_error: { maxRetries: 0, delay: 0, backoff: 'none' },
            authentication_error: { maxRetries: 1, delay: 5000, backoff: 'none' },
            default: { maxRetries: 2, delay: 5000, backoff: 'linear' }
        };

        this.errorPatterns = {
            network_error: [
                /net::ERR_/,
                /ECONNREFUSED/,
                /ENOTFOUND/,
                /ETIMEDOUT/,
                /socket hang up/,
                /connect ECONNREFUSED/
            ],
            timeout_error: [
                /Navigation timeout/,
                /Timeout/,
                /waiting for selector/,
                /waiting for function/
            ],
            selector_error: [
                /No node found for selector/,
                /failed to find element/,
                /Element not found/,
                /querySelector.*null/
            ],
            navigation_error: [
                /Navigation failed/,
                /Cannot navigate to invalid URL/,
                /ERR_ABORTED/,
                /ERR_FAILED/
            ],
            memory_error: [
                /out of memory/,
                /Maximum call stack/,
                /FATAL ERROR.*Reached heap limit/
            ],
            rate_limit_error: [
                /429/,
                /Too Many Requests/,
                /Rate limit/,
                /blocked/i
            ],
            captcha_error: [
                /captcha/i,
                /recaptcha/i,
                /cloudflare/i,
                /access denied/i
            ],
            authentication_error: [
                /401/,
                /403/,
                /Unauthorized/,
                /Forbidden/,
                /Access denied/
            ]
        };
    }

    /**
     * Classify error type based on error message
     */
    classifyError(error) {
        const errorMessage = error.message || error.toString();
        
        for (const [errorType, patterns] of Object.entries(this.errorPatterns)) {
            for (const pattern of patterns) {
                if (pattern.test(errorMessage)) {
                    return errorType;
                }
            }
        }
        
        return 'default';
    }

    /**
     * Get retry strategy for error type
     */
    getRetryStrategy(errorType) {
        return this.retryStrategies[errorType] || this.retryStrategies.default;
    }

    /**
     * Calculate delay based on retry strategy
     */
    calculateDelay(strategy, attemptNumber) {
        const { delay, backoff } = strategy;
        
        switch (backoff) {
            case 'exponential':
                return delay * Math.pow(2, attemptNumber - 1);
            case 'linear':
                return delay * attemptNumber;
            case 'none':
            default:
                return delay;
        }
    }

    /**
     * Check if error should be retried
     */
    shouldRetry(error, attemptNumber, scraperId) {
        const errorType = this.classifyError(error);
        const strategy = this.getRetryStrategy(errorType);
        
        // Don't retry if max retries exceeded
        if (attemptNumber > strategy.maxRetries) {
            return false;
        }

        // Don't retry certain critical errors
        if (errorType === 'captcha_error' || errorType === 'authentication_error') {
            return false;
        }

        return true;
    }

    /**
     * Handle scraper error with retry logic
     */
    async handleScraperError(error, scraperId, scraperRunId, attemptNumber = 1) {
        try {
            const errorType = this.classifyError(error);
            const strategy = this.getRetryStrategy(errorType);
            const shouldRetry = this.shouldRetry(error, attemptNumber, scraperId);
            
            // Log error details
            const errorDetails = {
                type: errorType,
                message: error.message,
                stack: error.stack,
                attemptNumber,
                shouldRetry,
                strategy,
                timestamp: new Date().toISOString()
            };

            console.error(`Scraper ${scraperId} error (attempt ${attemptNumber}):`, errorDetails);

            // Update scraper run with error
            if (scraperRunId) {
                const scraperRun = await ScraperRun.findById(scraperRunId);
                if (scraperRun) {
                    await scraperRun.addError({
                        type: errorType,
                        message: error.message,
                        stack: error.stack,
                        attemptNumber,
                        shouldRetry,
                        timestamp: new Date()
                    });
                }
            }

            // Emit error to WebSocket clients
            webSocketService.emitScraperError(scraperId, {
                ...error,
                type: errorType,
                attemptNumber,
                shouldRetry,
                nextRetryIn: shouldRetry ? this.calculateDelay(strategy, attemptNumber) : null
            });

            // Return retry decision and delay
            return {
                shouldRetry,
                delay: shouldRetry ? this.calculateDelay(strategy, attemptNumber) : 0,
                errorType,
                strategy,
                errorDetails
            };

        } catch (handlingError) {
            console.error('Error in error handler:', handlingError);
            return {
                shouldRetry: false,
                delay: 0,
                errorType: 'handler_error',
                strategy: this.retryStrategies.default,
                errorDetails: { message: handlingError.message }
            };
        }
    }

    /**
     * Execute function with retry logic
     */
    async executeWithRetry(fn, scraperId, scraperRunId, maxAttempts = 3) {
        let lastError;
        
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                // Emit attempt status
                webSocketService.emitScraperLog(scraperId, {
                    level: 'info',
                    message: `Attempt ${attempt}/${maxAttempts}`,
                    timestamp: new Date().toISOString()
                });

                const result = await fn(attempt);
                
                // Success - emit success log if it wasn't the first attempt
                if (attempt > 1) {
                    webSocketService.emitScraperLog(scraperId, {
                        level: 'success',
                        message: `Operation succeeded on attempt ${attempt}`,
                        timestamp: new Date().toISOString()
                    });
                }
                
                return result;
                
            } catch (error) {
                lastError = error;
                
                const errorHandling = await this.handleScraperError(
                    error, 
                    scraperId, 
                    scraperRunId, 
                    attempt
                );

                // If this is the last attempt or shouldn't retry, throw the error
                if (attempt === maxAttempts || !errorHandling.shouldRetry) {
                    throw error;
                }

                // Wait before retry
                if (errorHandling.delay > 0) {
                    webSocketService.emitScraperLog(scraperId, {
                        level: 'warning',
                        message: `Retrying in ${errorHandling.delay}ms due to ${errorHandling.errorType}`,
                        timestamp: new Date().toISOString()
                    });
                    
                    await this.delay(errorHandling.delay);
                }
            }
        }
        
        throw lastError;
    }

    /**
     * Utility function to create delay
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Handle critical errors that require immediate attention
     */
    async handleCriticalError(error, scraperId, scraperRunId) {
        const errorType = this.classifyError(error);
        
        // Log critical error
        console.error(`CRITICAL ERROR in scraper ${scraperId}:`, {
            type: errorType,
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });

        // Update scraper status to failed
        try {
            await Scraper.findByIdAndUpdate(scraperId, {
                status: 'failed',
                lastError: {
                    type: errorType,
                    message: error.message,
                    timestamp: new Date()
                }
            });

            if (scraperRunId) {
                await ScraperRun.findByIdAndUpdate(scraperRunId, {
                    status: 'failed',
                    endTime: new Date(),
                    error: {
                        type: errorType,
                        message: error.message,
                        stack: error.stack
                    }
                });
            }
        } catch (updateError) {
            console.error('Failed to update scraper status:', updateError);
        }

        // Emit critical error notification
        webSocketService.emitScraperError(scraperId, {
            ...error,
            type: errorType,
            critical: true,
            timestamp: new Date().toISOString()
        });

        webSocketService.emitScraperStatus(scraperId, 'failed', {
            error: error.message,
            critical: true,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Get error statistics for a scraper
     */
    async getErrorStats(scraperId, timeRange = '24h') {
        try {
            const timeRangeMs = this.parseTimeRange(timeRange);
            const since = new Date(Date.now() - timeRangeMs);

            const scraperRuns = await ScraperRun.find({
                scraperId,
                createdAt: { $gte: since }
            }).select('errors status createdAt');

            const stats = {
                totalRuns: scraperRuns.length,
                failedRuns: scraperRuns.filter(run => run.status === 'failed').length,
                totalErrors: 0,
                errorsByType: {},
                mostCommonErrors: [],
                errorRate: 0
            };

            // Analyze errors
            const errorCounts = {};
            scraperRuns.forEach(run => {
                if (run.errors && run.errors.length > 0) {
                    stats.totalErrors += run.errors.length;
                    run.errors.forEach(error => {
                        const errorType = error.type || 'unknown';
                        stats.errorsByType[errorType] = (stats.errorsByType[errorType] || 0) + 1;
                        errorCounts[error.message] = (errorCounts[error.message] || 0) + 1;
                    });
                }
            });

            // Calculate error rate
            stats.errorRate = stats.totalRuns > 0 ? (stats.failedRuns / stats.totalRuns) * 100 : 0;

            // Get most common errors
            stats.mostCommonErrors = Object.entries(errorCounts)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5)
                .map(([message, count]) => ({ message, count }));

            return stats;
        } catch (error) {
            console.error('Error getting error stats:', error);
            return null;
        }
    }

    /**
     * Parse time range string to milliseconds
     */
    parseTimeRange(timeRange) {
        const units = {
            'h': 60 * 60 * 1000,
            'd': 24 * 60 * 60 * 1000,
            'w': 7 * 24 * 60 * 60 * 1000,
            'm': 30 * 24 * 60 * 60 * 1000
        };

        const match = timeRange.match(/^(\d+)([hdwm])$/);
        if (!match) return 24 * 60 * 60 * 1000; // Default to 24h

        const [, amount, unit] = match;
        return parseInt(amount) * (units[unit] || units.h);
    }
}

module.exports = new ErrorHandlerService();