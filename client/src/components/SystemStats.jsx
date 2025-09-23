import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Database, 
  HardDrive, 
  Server, 
  Activity,
  BarChart3,
  Cpu,
  MemoryStick
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { API_BASE_URL } from '../const/endpoints';

const SystemStats = () => {
  const { t } = useLanguage();
  const [systemData, setSystemData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSystemStats();
  }, []);

  const fetchSystemStats = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/system/stats`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSystemData(data.data);
        setError(null);
      } else {
        throw new Error('Failed to fetch system stats');
      }
    } catch (error) {
      console.error('Error fetching system stats:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatUptime = (seconds) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/4"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-500">
            <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{t('Sistem məlumatları yüklənərkən xəta baş verdi', 'Error loading system information')}</p>
            <button 
              onClick={fetchSystemStats}
              className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              {t('Yenidən cəhd et', 'Try Again')}
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!systemData) return null;

  const { database, system, memory } = systemData;

  const stats = [
    {
      title: t('Veritabanı Ölçüsü', 'Database Size'),
      value: formatBytes(database.totalSize),
      subtitle: `${database.objects} ${t('obyekt', 'objects')}`,
      icon: Database,
      color: 'bg-blue-500',
      details: [
        { label: t('Data Ölçüsü', 'Data Size'), value: formatBytes(database.dataSize) },
        { label: t('İndeks Ölçüsü', 'Index Size'), value: formatBytes(database.indexSize) },
        { label: t('Koleksiyalar', 'Collections'), value: database.collections }
      ]
    },
    {
      title: t('Yaddaş İstifadəsi', 'Memory Usage'),
      value: `${memory.usagePercentage}%`,
      subtitle: `${formatBytes(memory.used)} / ${formatBytes(memory.total)}`,
      icon: MemoryStick,
      color: 'bg-green-500',
      details: [
        { label: t('İstifadə olunan', 'Used'), value: formatBytes(memory.used) },
        { label: t('Boş', 'Free'), value: formatBytes(memory.free) },
        { label: t('Ümumi', 'Total'), value: formatBytes(memory.total) }
      ]
    },
    {
      title: t('Sistem İnformasiyası', 'System Info'),
      value: system.platform,
      subtitle: `${system.cpus} CPU`,
      icon: Server,
      color: 'bg-purple-500',
      details: [
        { label: t('Arxitektura', 'Architecture'), value: system.arch },
        { label: t('İşləmə müddəti', 'Uptime'), value: formatUptime(system.uptime) },
        { label: t('CPU sayı', 'CPU Count'), value: system.cpus }
      ]
    },
    {
      title: t('Veritabanı Statusu', 'Database Status'),
      value: database.status,
      subtitle: database.name,
      icon: Activity,
      color: database.status === 'Connected' ? 'bg-green-500' : 'bg-red-500',
      details: [
        { label: t('Orta obyekt ölçüsü', 'Avg Object Size'), value: formatBytes(database.avgObjSize) },
        { label: t('Saxlama ölçüsü', 'Storage Size'), value: formatBytes(database.storageSize) },
        { label: t('Fayl ölçüsü', 'File Size'), value: formatBytes(database.fileSize) }
      ]
    }
  ];

  return (
    <div className="space-y-6">
      {/* Ana İstatistikler */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground mb-1">{stat.title}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.subtitle}</p>
                  </div>
                  <div className={`${stat.color} p-3 rounded-full`}>
                    <IconComponent className="h-6 w-6 text-white" />
                  </div>
                </div>
                
                {/* Detaylar */}
                <div className="space-y-2 pt-4 border-t">
                  {stat.details.map((detail, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{detail.label}:</span>
                      <span className="font-medium">{detail.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Yenileme Butonu */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{t('Sistem Monitorinqi', 'System Monitoring')}</span>
            <button
              onClick={fetchSystemStats}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              disabled={loading}
            >
              <BarChart3 className="h-4 w-4" />
              <span>{loading ? t('Yüklənir...', 'Loading...') : t('Yenilə', 'Refresh')}</span>
            </button>
          </CardTitle>
          <CardDescription>
            {t('MongoDB və sistem resurslarının real vaxt monitorinqi', 'Real-time monitoring of MongoDB and system resources')}
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
};

export default SystemStats;