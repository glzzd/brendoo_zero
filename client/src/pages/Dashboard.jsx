import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import SystemStats from '../components/SystemStats';
import { 
  Users, 
  BarChart3, 
  FileText, 
  TrendingUp,
  Activity,
  DollarSign,
  ShoppingCart,
  Store,
  Package,
  Tag
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import { API_BASE_URL } from '../const/endpoints';

const Dashboard = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [dashboardData, setDashboardData] = useState({
    stores: [],
    products: [],
    categories: [],
    stats: {
      totalStores: 0,
      totalProducts: 0,
      totalCategories: 0,
      activeStores: 0
    }
  });
  const [loading, setLoading] = useState(true);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch stores
        const storesResponse = await fetch(`${API_BASE_URL}/store`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const storesData = await storesResponse.json();
        
        // Fetch products stats
        const productsResponse = await fetch(`${API_BASE_URL}/products-stock/stats`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const productsData = await productsResponse.json();

        if (storesData.success) {
          const stores = storesData.data.docs || storesData.data;
          const activeStores = stores.filter(store => store.status === 'active');
          
          // Process category data from stores
          const categoryMap = new Map();
          stores.forEach(store => {
            if (store.category) {
              categoryMap.set(store.category, (categoryMap.get(store.category) || 0) + 1);
            }
          });

          setDashboardData({
            stores: stores,
            products: productsData.success ? productsData.data : [],
            categories: Array.from(categoryMap.entries()).map(([name, count]) => ({ name, count })),
            stats: {
              totalStores: stores.length,
              totalProducts: productsData.success ? (productsData.data.totalProducts || 0) : 0,
              totalCategories: categoryMap.size,
              activeStores: activeStores.length
            }
          });
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Chart colors
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  // Prepare chart data
  const storeStatusData = [
    { name: t('Aktiv', 'Active'), value: dashboardData.stats.activeStores, color: '#00C49F' },
    { name: t('Qeyri-aktiv', 'Inactive'), value: dashboardData.stats.totalStores - dashboardData.stats.activeStores, color: '#FF8042' }
  ];

  const categoryData = dashboardData.categories.slice(0, 6).map((cat, index) => ({
    name: cat.name,
    count: cat.count,
    color: COLORS[index % COLORS.length]
  }));

  const monthlyData = [
    { month: t('Yan', 'Jan'), stores: Math.floor(dashboardData.stats.totalStores * 0.6), products: Math.floor(dashboardData.stats.totalProducts * 0.4) },
    { month: t('Fev', 'Feb'), stores: Math.floor(dashboardData.stats.totalStores * 0.7), products: Math.floor(dashboardData.stats.totalProducts * 0.5) },
    { month: t('Mar', 'Mar'), stores: Math.floor(dashboardData.stats.totalStores * 0.8), products: Math.floor(dashboardData.stats.totalProducts * 0.6) },
    { month: t('Apr', 'Apr'), stores: Math.floor(dashboardData.stats.totalStores * 0.85), products: Math.floor(dashboardData.stats.totalProducts * 0.7) },
    { month: t('May', 'May'), stores: Math.floor(dashboardData.stats.totalStores * 0.9), products: Math.floor(dashboardData.stats.totalProducts * 0.8) },
    { month: t('İyun', 'Jun'), stores: dashboardData.stats.totalStores, products: dashboardData.stats.totalProducts }
  ];

  const stats = [
    {
      title: t('Ümumi Mağazalar', 'Total Stores'),
      value: dashboardData.stats.totalStores.toString(),
      change: `+${dashboardData.stats.activeStores}`,
      icon: Store,
      color: 'bg-blue-500'
    },
    {
      title: t('Ümumi Məhsullar', 'Total Products'),
      value: dashboardData.stats.totalProducts.toString(),
      change: '+12%',
      icon: Package,
      color: 'bg-green-500'
    },
    {
      title: t('Kateqoriyalar', 'Categories'),
      value: dashboardData.stats.totalCategories.toString(),
      change: '+5%',
      icon: Tag,
      color: 'bg-purple-500'
    },
    {
      title: t('Aktiv Mağazalar', 'Active Stores'),
      value: dashboardData.stats.activeStores.toString(),
      change: '+8%',
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
                    <p className="text-2xl font-bold">{loading ? '...' : stat.value}</p>
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
        {/* Store Status Pie Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{t('Mağaza Statusu', 'Store Status')}</CardTitle>
              <Button variant="outline" size="sm">
                <BarChart3 className="h-4 w-4 mr-2" />
                {t('Ətraflı', 'Details')}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={storeStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {storeStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Categories Bar Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{t('Kateqoriyalar üzrə Mağazalar', 'Stores by Category')}</CardTitle>
              <Button variant="outline" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                {t('Hamısını gör', 'View All')}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8">
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Monthly Growth Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('Aylıq Artım', 'Monthly Growth')}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-80 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="stores" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  name={t('Mağazalar', 'Stores')}
                />
                <Line 
                  type="monotone" 
                  dataKey="products" 
                  stroke="#82ca9d" 
                  strokeWidth={2}
                  name={t('Məhsullar', 'Products')}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* System Statistics - MongoDB Disk Usage */}
      <SystemStats />

      {/* Recent Activities */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('Son Fəaliyyətlər', 'Recent Activities')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dashboardData.stores.slice(0, 5).map((store, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{store.name}</p>
                  <p className="text-sm text-muted-foreground">{t('Kateqoriya', 'Category')}: {store.category || t('Təyin edilməyib', 'Not specified')}</p>
                  <p className="text-xs text-muted-foreground">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      store.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {store.status === 'active' ? t('Aktiv', 'Active') : t('Qeyri-aktiv', 'Inactive')}
                    </span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;