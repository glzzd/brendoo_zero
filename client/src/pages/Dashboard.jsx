import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, 
  BarChart3, 
  FileText, 
  TrendingUp,
  Activity,
  DollarSign,
  ShoppingCart
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const { t } = useLanguage();

  const stats = [
    {
      title: t('Ümumi İstifadəçilər', 'Total Users'),
      value: '2,543',
      change: '+12%',
      icon: Users,
      color: 'bg-blue-500'
    },
    {
      title: t('Aylıq Gəlir', 'Monthly Revenue'),
      value: '₼45,231',
      change: '+8%',
      icon: DollarSign,
      color: 'bg-green-500'
    },
    {
      title: t('Sifarişlər', 'Orders'),
      value: '1,234',
      change: '+23%',
      icon: ShoppingCart,
      color: 'bg-purple-500'
    },
    {
      title: t('Aktivlik', 'Activity'),
      value: '89%',
      change: '+5%',
      icon: Activity,
      color: 'bg-orange-500'
    }
  ];

  const recentActivities = [
    { id: 1, action: t('Yeni istifadəçi qeydiyyatı', 'New user registration'), user: 'Əli Məmmədov', time: t('5 dəqiqə əvvəl', '5 minutes ago') },
    { id: 2, action: t('Sifariş tamamlandı', 'Order completed'), user: 'Ayşə Həsənova', time: t('15 dəqiqə əvvəl', '15 minutes ago') },
    { id: 3, action: t('Hesabat yaradıldı', 'Report created'), user: t('Sistem', 'System'), time: t('1 saat əvvəl', '1 hour ago') },
    { id: 4, action: t('Yeni məhsul əlavə edildi', 'New product added'), user: 'Rəşad Quliyev', time: t('2 saat əvvəl', '2 hours ago') }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">
            {t('Xoş gəlmisiniz', 'Welcome')}, {user?.email?.split('@')[0] || t('İstifadəçi', 'User')}!
          </CardTitle>
          <CardDescription className="text-base">
            {t('Bu gün sizin dashboard\'unuzda nələr baş verir.', 'Here\'s what\'s happening in your dashboard today.')}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-sm text-green-600 font-medium">{stat.change}</p>
                  </div>
                  <div className={`${stat.color} p-3 rounded-full`}>
                    <IconComponent className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart Placeholder */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{t('Aylıq Statistika', 'Monthly Statistics')}</CardTitle>
              <Button variant="outline" size="sm">
                <BarChart3 className="h-4 w-4 mr-2" />
                {t('Ətraflı', 'Details')}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
              <div className="text-center">
                <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">{t('Qrafik burada göstəriləcək', 'Chart will be displayed here')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{t('Son Fəaliyyətlər', 'Recent Activities')}</CardTitle>
              <Button variant="outline" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                {t('Hamısını gör', 'View All')}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{activity.action}</p>
                    <p className="text-sm text-muted-foreground">{activity.user}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('Sürətli Əməliyyatlar', 'Quick Actions')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button className="h-20 flex flex-col items-center justify-center space-y-2">
              <Users className="h-6 w-6" />
              <span>{t('Yeni İstifadəçi', 'New User')}</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
              <FileText className="h-6 w-6" />
              <span>{t('Hesabat Yarat', 'Create Report')}</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
              <BarChart3 className="h-6 w-6" />
              <span>{t('Analitik', 'Analytics')}</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;