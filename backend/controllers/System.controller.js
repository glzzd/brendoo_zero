const mongoose = require('mongoose');
const os = require('os');
const fs = require('fs');
const path = require('path');

// MongoDB disk kullanımı bilgilerini al
const getSystemStatsController = async (req, res) => {
    try {
        // MongoDB bağlantı durumu
        const dbState = mongoose.connection.readyState;
        const dbStateText = {
            0: 'Disconnected',
            1: 'Connected',
            2: 'Connecting',
            3: 'Disconnecting'
        };

        // MongoDB veritabanı istatistikleri
        const db = mongoose.connection.db;
        const dbStats = await db.stats();
        
        // Koleksiyon sayısı
        const collections = await db.listCollections().toArray();
        
        // Sistem bilgileri
        const systemInfo = {
            platform: os.platform(),
            arch: os.arch(),
            totalMemory: os.totalmem(),
            freeMemory: os.freemem(),
            uptime: os.uptime(),
            cpus: os.cpus().length
        };

        // Disk kullanımı (MongoDB data directory için)
        let diskUsage = null;
        try {
            // Windows için disk kullanımı
            if (os.platform() === 'win32') {
                const stats = fs.statSync(process.cwd());
                diskUsage = {
                    total: 'N/A',
                    used: 'N/A',
                    free: 'N/A'
                };
            }
        } catch (error) {
            console.log('Disk usage calculation error:', error.message);
        }

        const systemStats = {
            database: {
                status: dbStateText[dbState],
                name: db.databaseName,
                collections: collections.length,
                dataSize: dbStats.dataSize,
                storageSize: dbStats.storageSize,
                indexSize: dbStats.indexSize,
                totalSize: dbStats.dataSize + dbStats.indexSize,
                objects: dbStats.objects,
                avgObjSize: dbStats.avgObjSize,
                fileSize: dbStats.fileSize || 0,
                nsSizeMB: dbStats.nsSizeMB || 0
            },
            system: systemInfo,
            disk: diskUsage,
            memory: {
                total: systemInfo.totalMemory,
                free: systemInfo.freeMemory,
                used: systemInfo.totalMemory - systemInfo.freeMemory,
                usagePercentage: ((systemInfo.totalMemory - systemInfo.freeMemory) / systemInfo.totalMemory * 100).toFixed(2)
            }
        };

        res.status(200).json({
            success: true,
            message: "Sistem statistikları uğurla alındı",
            data: systemStats
        });

    } catch (error) {
        console.error("System stats error:", error);
        res.status(500).json({
            success: false,
            message: "Sistem statistikları alınarkən xəta baş verdi",
            error: error.message
        });
    }
};

// MongoDB koleksiyon detayları
const getCollectionStatsController = async (req, res) => {
    try {
        const db = mongoose.connection.db;
        const collections = await db.listCollections().toArray();
        
        const collectionStats = [];
        
        for (const collection of collections) {
            try {
                const collectionObj = db.collection(collection.name);
                const count = await collectionObj.countDocuments();
                const sampleDoc = await collectionObj.findOne();
                
                collectionStats.push({
                    name: collection.name,
                    count: count,
                    size: sampleDoc ? JSON.stringify(sampleDoc).length * count : 0,
                    storageSize: 0,
                    avgObjSize: sampleDoc ? JSON.stringify(sampleDoc).length : 0,
                    indexSizes: {}
                });
            } catch (error) {
                collectionStats.push({
                    name: collection.name,
                    count: 0,
                    size: 0,
                    storageSize: 0,
                    avgObjSize: 0,
                    indexSizes: {}
                });
            }
        }

        res.status(200).json({
            success: true,
            message: "Koleksiyon statistikları uğurla alındı",
            data: collectionStats
        });

    } catch (error) {
        console.error("Collection stats error:", error);
        res.status(500).json({
            success: false,
            message: "Koleksiyon statistikları alınarkən xəta baş verdi",
            error: error.message
        });
    }
};

module.exports = {
    getSystemStatsController,
    getCollectionStatsController
};