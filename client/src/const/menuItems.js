import {
  Home,
  Store,
  Package
} from 'lucide-react';

export const menuItems = [
  {
    title: 'Ana səhifə',
    titleEn: 'Home',
    icon: Home,
    href: '/dashboard',
    items: []
  },
  {
    title: 'Mağazalar',
    titleEn: 'Stores',
    icon: Store,
    items: [
      { title: 'Mağaza siyahısı', titleEn: 'Store List', href: '/stores/list' },
      { title: 'Yeni mağaza', titleEn: 'New Store', href: '/stores/new' },
      { title: 'Mağaza ayarları', titleEn: 'Store Settings', href: '/stores/settings' }
    ]
  },
  {
    title: 'Scraperlər',
    titleEn: 'Scrapers',
    icon: Package,
    items: [
      { title: 'Scraper siyahısı', titleEn: 'Scraper List', href: '/scrapers/list' },
      { title: 'Yeni scraper', titleEn: 'New Scraper', href: '/scrapers/new' },
      { title: 'Scraper ayarları', titleEn: 'Scraper Settings', href: '/scrapers/settings' }
    ]
  },
  {
    title: 'Stok',
    titleEn: 'Stock',
    icon: Package,
    items: [
      { title: 'Məhsul siyahısı', titleEn: 'Product List', href: '/stock/products' },
      { title: 'Stok idarəsi', titleEn: 'Stock Management', href: '/stock/management' },
      { title: 'Inventar', titleEn: 'Inventory', href: '/stock/inventory' }
    ]
  }
];