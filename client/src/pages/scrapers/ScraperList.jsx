import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../components/ui/alert-dialog';
import { Settings, Edit, Trash2, Download, Trash, Play, Pause, RefreshCw, Upload, ChevronDown, ChevronRight } from 'lucide-react';
import { Checkbox } from '../../components/ui/checkbox';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import PythonScraperUpload from '../../components/scrapers/PythonScraperUpload';
import ScraperProductsInline from '../../components/scrapers/ScraperProductsInline';
import { io } from 'socket.io-client';


const ScraperList = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [scrapers, setScrapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [deletingScraperId, setDeletingScraperId] = useState(null);
  const [selectedScrapers, setSelectedScrapers] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [filters, setFilters] = useState({
    name: '',
    status: '',
    website: '',
    date: ''
  });

  const itemsPerPage = 10;

  const [scraperRuns, setScraperRuns] = useState({});
  const [runningScrapers, setRunningScrapers] = useState(new Set());
  const [showPythonUpload, setShowPythonUpload] = useState(false);
  const [scraperData, setScraperData] = useState({});
  const [expandedRows, setExpandedRows] = useState(new Set());
  const socketRef = useRef(null);

  const handlePythonUploadSuccess = (newScraper) => {
    toast.success('Python scraper başarıyla yüklendi!');
    fetchScrapers(); // Refresh the list
  };

  
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5009/api/v1';
  const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL || 'http://localhost:5009';

  useEffect(() => {
    console.log('ScraperList useEffect triggered');
    console.log('Token from useAuth:', token);
    console.log('Token from localStorage:', localStorage.getItem('token'));
    
    // Temporary: Set a valid token for testing
    const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4YzYxZTQ3YTYxOGU1NGQ5M2U2YWQwYiIsImlhdCI6MTc1Nzg3NDYzOCwiZXhwIjoxNzU3OTYxMDM4fQ.WMvB2hOfMRpmpaQ6bB5GskatA0iFzeM6wkoMqXnKLGg';
    if (!token && !localStorage.getItem('token')) {
      console.log('Setting test token for debugging');
      localStorage.setItem('token', testToken);
    }
    
    const currentToken = token || localStorage.getItem('token');
    if (currentToken) {
      fetchScrapers(currentPage);
    } else {
      console.log('No token available, cannot fetch scrapers');
      setLoading(false);
    }
  }, [currentPage, searchTerm, filters, token]);

  // WebSocket connection setup
  useEffect(() => {
    const currentToken = token || localStorage.getItem('token');
    if (!currentToken) return;

    // Initialize WebSocket connection
    socketRef.current = io(WS_BASE_URL, {
      auth: {
        token: currentToken
      },
      transports: ['websocket', 'polling']
    });

    const socket = socketRef.current;

    // Connection events
    socket.on('connect', () => {
      console.log('WebSocket connected to:', WS_BASE_URL);
      console.log('Socket ID:', socket.id);
    });

    socket.on('connected', (data) => {
      console.log('WebSocket authenticated:', data);
    });

    // Scraper status updates
    socket.on('scraper_status', (data) => {
      console.log('🔄 Scraper status update received:', data);
      console.log('🔄 Current scrapers before update:', scrapers.map(s => ({id: s._id, status: s.status})));
      const { scraperId, status, message } = data;
      
      console.log(`📊 Updating scraper ${scraperId} status to: ${status}`);
      setScrapers(prev => {
        const updated = prev.map(scraper => 
          scraper._id === scraperId ? { ...scraper, status } : scraper
        );
        console.log('📋 Updated scrapers list:', updated.find(s => s._id === scraperId));
        console.log('📋 All scrapers after update:', updated.map(s => ({id: s._id, status: s.status})));
        return updated;
      });
      
      // Show toast message based on status
      if (status === 'running' && message) {
        toast.info(message);
      } else if (status === 'completed' && message) {
        toast.success(message);
      }
      
      // Remove from running scrapers if completed
      if (status !== 'running') {
        console.log(`✅ Scraper ${scraperId} completed, removing from running list`);
        setRunningScrapers(prev => {
          const newSet = new Set(prev);
          newSet.delete(scraperId);
          console.log('🏃 Updated running scrapers:', Array.from(newSet));
          return newSet;
        });
        
        // Refresh scraper data and runs immediately
        console.log(`🔄 Refreshing data for scraper ${scraperId}`);
        setTimeout(() => {
          fetchScraperRuns(scraperId);
          fetchScraperData(scraperId);
        }, 1000); // Wait 1 second for file to be written
      }
    });

    // Scraper progress updates
    socket.on('scraper_progress', (data) => {
      console.log('Scraper progress:', data);
      // You can add progress indicators here if needed
    });

    // Scraper error updates
    socket.on('scraper_error', (data) => {
      console.log('Scraper error:', data);
      const { scraperId, error } = data;
      
      setScrapers(prev => prev.map(scraper => 
        scraper._id === scraperId ? { ...scraper, status: 'error' } : scraper
      ));
      
      setRunningScrapers(prev => {
        const newSet = new Set(prev);
        newSet.delete(scraperId);
        return newSet;
      });
      
      toast.error(`Scraper xətası: ${error.message}`);
    });

    socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

    // Join scraper rooms for all scrapers
    if (scrapers.length > 0) {
      console.log('Joining scraper rooms for scrapers:', scrapers.map(s => s._id));
      scrapers.forEach(scraper => {
        console.log('Joining room for scraper:', scraper._id);
        socket.emit('join_scraper_room', scraper._id);
      });
    }

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [token, scrapers]);

  const fetchScrapers = async (page) => {
    setLoading(true);
    const currentToken = token || localStorage.getItem('token');
    console.log('Fetching scrapers with token:', currentToken);
    console.log('API_BASE_URL:', API_BASE_URL);
    console.log('Request URL:', `${API_BASE_URL}/scrapers?page=${page}&limit=${itemsPerPage}&search=${searchTerm}`);
    try {
      const currentToken = token || localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/scrapers?page=${page}&limit=${itemsPerPage}&search=${searchTerm}`, {
        headers: {
          'Authorization': `Bearer ${currentToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        throw new Error('Failed to fetch scrapers');
      }
      
      const data = await response.json();
      console.log('Scrapers data:', data);
      setScrapers(data.data || []);
      setPagination(data.pagination || {});
      
      // Fetch latest runs and scraper data for each scraper
      for (const scraper of data.data || []) {
        fetchScraperRuns(scraper._id);
        fetchScraperData(scraper._id);
      }
      
    } catch (error) {
      console.error('Error fetching scrapers:', error);
      toast.error('Scraperlər yüklənərkən xəta baş verdi');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchScraperRuns = async (scraperId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/scrapers/${scraperId}/runs?limit=1`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.data && data.data.length > 0) {
          setScraperRuns(prev => ({
            ...prev,
            [scraperId]: data.data[0]
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching scraper runs:', error);
    }
  };

  const fetchScraperData = async (scraperId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/scrapers/${scraperId}/data`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setScraperData(prev => ({
            ...prev,
            [scraperId]: data.data
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching scraper data:', error);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedScrapers([]);
    } else {
      setSelectedScrapers(scrapers.map(scraper => scraper._id));
    }
    setSelectAll(!selectAll);
  };

  const handleSelectScraper = (scraperId) => {
    setSelectedScrapers(prev => {
      if (prev.includes(scraperId)) {
        return prev.filter(id => id !== scraperId);
      } else {
        return [...prev, scraperId];
      }
    });
  };

  const toggleRowExpansion = (scraperId) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(scraperId)) {
        newSet.delete(scraperId);
      } else {
        newSet.add(scraperId);
      }
      return newSet;
    });
  };

  const exportData = (format) => {
    const selectedScraperData = scrapers.filter(scraper => selectedScrapers.includes(scraper._id));
    
    if (format === 'json') {
      const dataStr = JSON.stringify(selectedScraperData, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      const exportFileDefaultName = `scrapers_${new Date().toISOString().split('T')[0]}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    } else if (format === 'xml') {
      let xmlStr = '<?xml version="1.0" encoding="UTF-8"?>\n<scrapers>\n';
      selectedScraperData.forEach(scraper => {
        xmlStr += '  <scraper>\n';
        xmlStr += `    <id>${scraper._id}</id>\n`;
        xmlStr += `    <name>${scraper.name}</name>\n`;
        xmlStr += `    <website>${scraper.website}</website>\n`;
        xmlStr += `    <status>${scraper.status}</status>\n`;
        xmlStr += `    <productsScraped>${scraper.productsScraped}</productsScraped>\n`;
        xmlStr += `    <createdAt>${scraper.createdAt}</createdAt>\n`;
        xmlStr += '  </scraper>\n';
      });
      xmlStr += '</scrapers>';
      
      const dataUri = 'data:application/xml;charset=utf-8,'+ encodeURIComponent(xmlStr);
      const exportFileDefaultName = `scrapers_${new Date().toISOString().split('T')[0]}.xml`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    } else if (format === 'excel') {
      let csvContent = 'ID,Ad,Veb sayt,Status,Son işləmə,Toplanan məhsullar,Yaradılma tarixi\n';
      selectedScraperData.forEach(scraper => {
        csvContent += `"${scraper._id}","${scraper.name}","${scraper.website}","${scraper.status}","${new Date(scraper.lastRun).toLocaleDateString()}","${scraper.productsScraped}","${new Date(scraper.createdAt).toLocaleDateString()}"\n`;
      });
      
      const dataUri = 'data:text/csv;charset=utf-8,'+ encodeURIComponent(csvContent);
      const exportFileDefaultName = `scrapers_${new Date().toISOString().split('T')[0]}.csv`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    }
    
    toast.success(`${selectedScraperData.length} scraper ${format.toUpperCase()} formatında ixrac edildi`);
  };

  const confirmDeleteScraper = async () => {
    if (!deletingScraperId) return;

    try {
      if (deletingScraperId === 'bulk') {
        // Bulk delete
        const deletePromises = selectedScrapers.map(scraperId => 
          fetch(`${API_BASE_URL}/scrapers/${scraperId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })
        );
        
        await Promise.all(deletePromises);
        setScrapers(prevScrapers => prevScrapers.filter(scraper => !selectedScrapers.includes(scraper._id)));
        toast.success(`${selectedScrapers.length} scraper uğurla silindi`);
        setSelectedScrapers([]);
        setSelectAll(false);
      } else {
        // Single delete
        const response = await fetch(`${API_BASE_URL}/scrapers/${deletingScraperId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to delete scraper');
        }
        
        setScrapers(prevScrapers => prevScrapers.filter(scraper => scraper._id !== deletingScraperId));
        toast.success('Scraper uğurla silindi');
      }
    } catch (error) {
      console.error('Error deleting scraper:', error);
      toast.error('Scraper silinərkən xəta baş verdi');
    } finally {
      setDeletingScraperId(null);
    }
  };

  const handleScraperAction = async (scraperId, action) => {
    const scraper = scrapers.find(s => s._id === scraperId);
    if (!scraper) return;

    try {
      switch (action) {
        case 'start':
          setRunningScrapers(prev => new Set([...prev, scraperId]));
          
          // Join scraper room for real-time updates
          if (socketRef.current) {
            socketRef.current.emit('join_scraper_room', scraperId);
          }
          
          const startResponse = await fetch(`${API_BASE_URL}/scrapers/${scraperId}/start`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ triggeredBy: 'manual' })
          });
          
          if (!startResponse.ok) {
            throw new Error('Failed to start scraper');
          }
          
          setScrapers(prev => prev.map(s => 
            s._id === scraperId ? { ...s, status: 'running' } : s
          ));
          break;
          
        case 'stop':
          const stopResponse = await fetch(`${API_BASE_URL}/scrapers/${scraperId}/stop`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (!stopResponse.ok) {
            throw new Error('Failed to stop scraper');
          }
          
          setScrapers(prev => prev.map(s => 
            s._id === scraperId ? { ...s, status: 'active' } : s
          ));
          toast.success(`${scraper.name} dayandırıldı`);
          break;
          
        case 'refresh':
          await fetchScraperRuns(scraperId);
          toast.success(`${scraper.name} yeniləndi`);
          break;
          
        default:
          break;
      }
    } catch (error) {
      console.error(`Error ${action}ing scraper:`, error);
      toast.error(`Scraper ${action === 'start' ? 'başladılarkən' : action === 'stop' ? 'dayandırılarkən' : 'yenilənərkən'} xəta baş verdi`);
      
      if (action === 'start') {
        setRunningScrapers(prev => {
          const newSet = new Set(prev);
          newSet.delete(scraperId);
          return newSet;
        });
      }
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { label: 'Aktiv', className: 'bg-green-100 text-green-800' },
      inactive: { label: 'Qeyri-aktiv', className: 'bg-gray-100 text-gray-800' },
      running: { label: 'İşləyir', className: 'bg-blue-100 text-blue-800' },
      completed: { label: 'Tamamlandı', className: 'bg-green-100 text-green-800' },
      error: { label: 'Xəta', className: 'bg-red-100 text-red-800' }
    };

    const config = statusConfig[status] || statusConfig.inactive;
    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const totalPages = pagination.totalPages || 1;

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Yüklənir...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl font-bold">Scraper Siyahısı</CardTitle>
              <CardDescription>
                Bütün scraperləri idarə edin
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => navigate('/scrapers/create')}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Settings className="h-4 w-4 mr-2" />
                Yeni Scraper
              </Button>
              {selectedScrapers.length > 0 && (
                <>
                  <Button
                    variant="destructive"
                    onClick={() => setDeletingScraperId('bulk')}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <Trash className="h-4 w-4 mr-2" />
                    Seçilənləri Sil ({selectedScrapers.length})
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => exportData('json')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    JSON
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => exportData('xml')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    XML
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => exportData('excel')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Excel
                  </Button>
                </>
              )}
              <Button onClick={() => navigate('/scrapers/new')} className="bg-blue-600 hover:bg-blue-700">
                + Yeni Scraper
              </Button>
              <Button 
                onClick={() => setShowPythonUpload(true)} 
                className="bg-green-600 hover:bg-green-700"
              >
                <Upload className="h-4 w-4 mr-2" />
                Python Scraper Yüklə
              </Button>

            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Scraper adı və ya veb sayt axtarın..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-4">
                    <Checkbox
                      checked={selectAll}
                      onCheckedChange={handleSelectAll}
                      aria-label="Hamısını seç"
                    />
                  </th>
                  <th className="text-left p-4 font-semibold">№</th>
                  <th className="text-left p-4 font-semibold">
                    <div className="flex flex-col gap-1">
                      <span>Ad</span>
                      <Input
                        placeholder="Filtr"
                        value={filters.name || ''}
                        onChange={(e) => handleFilterChange('name', e.target.value)}
                        className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </th>
                  <th className="text-left p-4 font-semibold">
                    <div className="flex flex-col gap-1">
                      <span>Veb sayt</span>
                      <Input
                        placeholder="Filtr"
                        value={filters.website || ''}
                        onChange={(e) => handleFilterChange('website', e.target.value)}
                        className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </th>
                  <th className="text-left p-4 font-semibold">
                    <div className="flex flex-col gap-1">
                      <span>Status</span>
                      <select
                        value={filters.status || ''}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                        className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="">Hamısı</option>
                        <option value="active">Aktiv</option>
                        <option value="inactive">Qeyri-aktiv</option>
                        <option value="running">İşləyir</option>
                        <option value="error">Xəta</option>
                      </select>
                    </div>
                  </th>
                  <th className="text-left p-4 font-semibold">Son işləmə</th>
                  <th className="text-left p-4 font-semibold">Toplanan məhsullar</th>
                  <th className="text-left p-4 font-semibold">Əməliyyatlar</th>
                </tr>
              </thead>
              <tbody>
                {scrapers.length > 0 ? (
                  scrapers.map((scraper, index) => (
                    <React.Fragment key={scraper._id}>
                      <tr className="border-b hover:bg-gray-50 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleRowExpansion(scraper._id)}
                              className="p-1 h-6 w-6"
                            >
                              {expandedRows.has(scraper._id) ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </Button>
                            <Checkbox
                              checked={selectedScrapers.includes(scraper._id)}
                              onCheckedChange={() => handleSelectScraper(scraper._id)}
                              aria-label={`${scraper.name} seç`}
                            />
                          </div>
                        </td>
                        <td className="p-4">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                      <td className="p-4">
                        <div>
                          <div className="font-medium">{scraper.name}</div>
                          <div className="text-sm text-gray-500">{scraper.description}</div>
                        </div>
                      </td>
                      <td className="p-4">
                        <a href={`https://${scraper.website}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          {scraper.website}
                        </a>
                      </td>
                      <td className="p-4">
                        {(() => {
                          const scraperDataInfo = scraperData[scraper._id];
                          const latestRun = scraperRuns[scraper._id];
                          
                          // If scraper data exists and has recent data, show completed status
                          if (scraperDataInfo && scraperDataInfo.scraping_date) {
                            const scrapingDate = new Date(scraperDataInfo.scraping_date);
                            const now = new Date();
                            const timeDiff = now - scrapingDate;
                            const hoursDiff = timeDiff / (1000 * 60 * 60);
                            
                            // If scraped within last 24 hours and not currently running
                            if (hoursDiff < 24 && !runningScrapers.has(scraper._id)) {
                              return getStatusBadge('completed');
                            }
                          }
                          
                          // If currently running
                          if (runningScrapers.has(scraper._id)) {
                            return getStatusBadge('running');
                          }
                          
                          // Default to scraper status from database
                          return getStatusBadge(scraper.status);
                        })()} 
                      </td>
                      <td className="p-4">
                        {(() => {
                          const scraperDataInfo = scraperData[scraper._id];
                          const latestRun = scraperRuns[scraper._id];
                          
                          if (scraperDataInfo && scraperDataInfo.scraping_date) {
                            return (
                              <div>
                                <div className="text-sm">
                                  {new Date(scraperDataInfo.scraping_date).toLocaleString('az-AZ')}
                                </div>
                                <div className="text-xs text-green-600">
                                  JSON məlumatı mövcuddur
                                </div>
                              </div>
                            );
                          } else if (latestRun) {
                            return (
                              <div>
                                <div className="text-sm">
                                  {new Date(latestRun.createdAt).toLocaleString('az-AZ')}
                                </div>
                                <div className="text-xs text-gray-500">
                                  Status: <span className={latestRun.status === 'success' ? 'text-green-600' : latestRun.status === 'failed' ? 'text-red-600' : 'text-yellow-600'}>
                                    {latestRun.status === 'success' ? 'Uğurlu' : latestRun.status === 'failed' ? 'Uğursuz' : 'İşləyir'}
                                  </span>
                                </div>
                              </div>
                            );
                          }
                          return 'Heç vaxt';
                        })()} 
                      </td>
                      <td className="p-4">
                        {(() => {
                          const scraperDataInfo = scraperData[scraper._id];
                          const latestRun = scraperRuns[scraper._id];
                          
                          if (scraperDataInfo && scraperDataInfo.total_brands) {
                            return (
                              <div>
                                <div className="font-medium text-blue-600">
                                  {scraperDataInfo.total_brands.toLocaleString()}
                                </div>
                                <div className="text-xs text-gray-500">
                                  Brendlər
                                </div>
                              </div>
                            );
                          } else if (latestRun && latestRun.results) {
                            return (
                              <div>
                                <div className="font-medium">
                                  {latestRun.results.productsScraped?.toLocaleString() || 0}
                                </div>
                                {latestRun.results.errorsCount > 0 && (
                                  <div className="text-xs text-red-500">
                                    {latestRun.results.errorsCount} xəta
                                  </div>
                                )}
                              </div>
                            );
                          }
                          return <span className="font-medium">0</span>;
                        })()} 
                      </td>
                      <td className="p-4">
                        <div className="flex gap-1">
                          {(() => {
                            const scraperDataInfo = scraperData[scraper._id];
                            const isRunning = runningScrapers.has(scraper._id);
                            const hasRecentData = scraperDataInfo && scraperDataInfo.scraping_date;
                            
                            // Məhsul spesifik scraper'lar üçün çalıştırma düyməsini göstərmə
                            if (scraper.purpose === 'product_specific') {
                              return null;
                            }
                            
                            if (isRunning) {
                              return (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-blue-600 hover:text-blue-700 p-2"
                                  disabled
                                  title="İşləyir..."
                                >
                                  <RefreshCw className="h-4 w-4 animate-spin" />
                                </Button>
                              );
                            } else {
                              return (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-green-600 hover:text-green-700 p-2"
                                  onClick={() => handleScraperAction(scraper._id, 'start')}
                                  title="Başlat"
                                >
                                  <Play className="h-4 w-4" />
                                </Button>
                              );
                            }
                          })()}
                        
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-gray-600 hover:text-gray-700 p-2"
                            onClick={() => navigate(`/scrapers/edit/${scraper._id}`)}
                            title="Redaktə et"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700 p-2"
                            onClick={() => setDeletingScraperId(scraper._id)}
                            title="Sil"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                    {expandedRows.has(scraper._id) && (
                      <tr className="bg-gray-50">
                        <td colSpan="8" className="p-0">
                          <div className="p-6 border-t">
                            {/* Toplanan Məlumatlar */}
                            <div className="bg-white p-4 rounded-lg shadow-sm border">
                              <h4 className="font-semibold text-gray-800 mb-3">Toplanan Məlumatlar</h4>
                              <div className="space-y-2 text-sm">
                                {(() => {
                                  const scraperDataInfo = scraperData[scraper._id];
                                  if (scraperDataInfo) {
                                    return (
                                      <>
                                        <div><span className="font-medium">Toplam brendlər:</span> {scraperDataInfo.total_brands?.toLocaleString() || 0}</div>
                                        <div><span className="font-medium">Son toplama:</span> {new Date(scraperDataInfo.scraping_date).toLocaleString('az-AZ')}</div>
                                        <div className="text-green-600 font-medium">JSON məlumatı mövcuddur</div>
                                        
                                        {/* Məhsulları burada göstər */}
                                        <ScraperProductsInline scraperId={scraper._id} />
                                      </>
                                    );
                                  }
                                  return <div className="text-gray-500">Hələ məlumat toplanmayıb</div>;
                                })()} 
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                    </React.Fragment>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="p-8 text-center text-gray-500">
                      {searchTerm ? 'Axtarış nəticəsi tapılmadı' : 'Hələ heç bir scraper əlavə edilməyib'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Əvvəlki
              </Button>
              
              {[...Array(totalPages)].map((_, index) => {
                const pageNumber = index + 1;
                return (
                  <Button
                    key={pageNumber}
                    variant={currentPage === pageNumber ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(pageNumber)}
                    className={currentPage === pageNumber ? "bg-blue-600 hover:bg-blue-700" : ""}
                  >
                    {pageNumber}
                  </Button>
                );
              })}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Növbəti
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingScraperId} onOpenChange={() => setDeletingScraperId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deletingScraperId === 'bulk' ? 'Seçilən scraperləri sil' : 'Scraperi sil'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deletingScraperId === 'bulk' 
                ? `Bu əməliyyat geri qaytarıla bilməz. ${selectedScrapers.length} scraper məlumatları tamamilə silinəcək.`
                : 'Bu əməliyyat geri qaytarıla bilməz. Scraper məlumatları tamamilə silinəcək.'
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Ləğv et</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteScraper}
              className="bg-red-600 hover:bg-red-700"
            >
              {deletingScraperId === 'bulk' ? `${selectedScrapers.length} scraperi sil` : 'Sil'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Python Scraper Upload Modal */}
      <PythonScraperUpload
        visible={showPythonUpload}
        onClose={() => setShowPythonUpload(false)}
        onSuccess={handlePythonUploadSuccess}
      />

    </div>
  );
};

export default ScraperList;