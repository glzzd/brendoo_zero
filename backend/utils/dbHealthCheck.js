const mongoose = require('mongoose');

/**
 * Database health check utility
 * Monitors connection status and provides diagnostics
 */
class DatabaseHealthCheck {
  static async checkConnectionHealth() {
    try {
      const state = mongoose.connection.readyState;
      const stateNames = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting'
      };

      console.log(`📊 Database Connection Status: ${stateNames[state]}`);
      
      if (state === 1) {
        // Test actual database operation
        const startTime = Date.now();
        await mongoose.connection.db.admin().ping();
        const responseTime = Date.now() - startTime;
        
        console.log(`✅ Database ping successful: ${responseTime}ms`);
        
        // Check connection pool stats
        const poolStats = {
          maxPoolSize: mongoose.connection.options?.maxPoolSize || 'default',
          currentConnections: mongoose.connection.db?.serverConfig?.connections?.length || 'unknown'
        };
        
        console.log(`🏊 Connection Pool Stats:`, poolStats);
        
        return {
          status: 'healthy',
          responseTime,
          poolStats
        };
      } else {
        console.log(`⚠️ Database not connected. Current state: ${stateNames[state]}`);
        return {
          status: 'unhealthy',
          state: stateNames[state]
        };
      }
    } catch (error) {
      console.error('❌ Database health check failed:', error.message);
      return {
        status: 'error',
        error: error.message
      };
    }
  }

  static async monitorConnectionPool() {
    setInterval(async () => {
      const health = await this.checkConnectionHealth();
      if (health.status !== 'healthy') {
        console.warn('🚨 Database connection issue detected:', health);
      }
    }, 30000); // Check every 30 seconds
  }

  static setupConnectionEventListeners() {
    mongoose.connection.on('connected', () => {
      console.log('🔗 MongoDB connected successfully');
    });

    mongoose.connection.on('error', (error) => {
      console.error('❌ MongoDB connection error:', error);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('🔌 MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconnected');
    });

    mongoose.connection.on('close', () => {
      console.log('🚪 MongoDB connection closed');
    });
  }
}

module.exports = DatabaseHealthCheck;