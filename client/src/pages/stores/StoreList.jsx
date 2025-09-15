import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { useAuth } from '../../contexts/AuthContext';
import AddStoreModal from '../../components/AddStoreModal';
import AddEndpointModal from '../../components/AddEndpointModal';
import EditStoreModal from '../../components/EditStoreModal';
import apiClient from '../../utils/apiClient';
import { STORE_CATEGORIES } from '../../const/categories';
import { Settings, Edit, Trash2, Download, Trash } from 'lucide-react';
import { Checkbox } from '../../components/ui/checkbox';
import { toast } from 'sonner';
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

const StoreList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = useAuth();
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [pagination, setPagination] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEndpointModalOpen, setIsEndpointModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedStore, setSelectedStore] = useState(null);
  const [editStoreId, setEditStoreId] = useState(null);
  const [deletingStoreId, setDeletingStoreId] = useState(null);
  const [selectedStores, setSelectedStores] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [sortField, setSortField] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');
  const [filters, setFilters] = useState({
    category: '',
    status: ''
  });

  useEffect(() => {
    fetchStores(currentPage);
  }, [location.state, currentPage, sortField, sortDirection, filters]);

  useEffect(() => {
    if (sortField || filters.category || filters.status || filters.name || filters.date) {
      fetchStores(1);
    }
  }, [sortField, sortDirection, filters]);

  const fetchStores = async (page = 1) => {
    try {
      console.log('Token:', token);
      
      // Build query parameters
      const params = new URLSearchParams({
        page: page.toString(),
        limit: itemsPerPage.toString()
      });
      
      if (filters.category) params.append('category', filters.category);
      if (filters.status) params.append('status', filters.status);
      if (filters.name) params.append('name', filters.name);
      if (filters.date) params.append('date', filters.date);
      if (sortField) {
        params.append('sort', sortDirection === 'desc' ? `-${sortField}` : sortField);
      }
      
      const response = await apiClient.get(`/api/v1/store/?${params.toString()}`);

      if (response.ok) {
        const result = await response.json();
        console.log('API Response:', result);
        setStores(Array.isArray(result.data) ? result.data : []);
        setPagination(result.pagination || {});
        setCurrentPage(page);
      } else {
        console.error('Failed to fetch stores. Status:', response.status);
        const errorText = await response.text();
        console.error('Error response:', errorText);
        setStores([]);
      }
    } catch (error) {
      console.error('Error fetching stores:', error);
      setStores([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
    setCurrentPage(1);
  };

  const getSortIcon = (field) => {
    if (sortField !== field) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return sortDirection === 'asc' ? (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  const updateStoreStatus = async (storeId, newStatus) => {
    try {
      const response = await apiClient.put(`/api/v1/store/${storeId}/status`, {
        status: newStatus
      });

      if (response.ok) {
        // Update the store in the local state
        setStores(prevStores => 
          prevStores.map(store => 
            store._id === storeId 
              ? { ...store, status: newStatus }
              : store
          )
        );
        console.log('Store status updated successfully');
      } else {
        console.error('Failed to update store status');
        toast.error('Status yenilənərkən xəta baş verdi');
      }
    } catch (error) {
      console.error('Error updating store status:', error);
      toast.error('Status yenilənərkən xəta baş verdi');
    }
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const openEndpointModal = (store) => {
    setSelectedStore(store);
    setIsEndpointModalOpen(true);
  };

  const closeEndpointModal = () => {
    setIsEndpointModalOpen(false);
    setSelectedStore(null);
  };

  const handleEndpointAdded = () => {
    // Refresh stores list after endpoint is added
    fetchStores(currentPage);
  };

  const openEditModal = (storeId) => {
    setEditStoreId(storeId);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditStoreId(null);
  };

  const handleStoreUpdated = (updatedStore) => {
    // Update the store in the local state
    setStores(prevStores => 
      prevStores.map(store => 
        store._id === updatedStore._id 
          ? updatedStore
          : store
      )
    );
  };

  const confirmDeleteStore = async () => {
    if (!deletingStoreId) return;

    try {
      if (deletingStoreId === 'bulk') {
        // Bulk delete
        const response = await fetch('/api/v1/store/bulk-delete', {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ storeIds: selectedStores })
        });

        if (response.ok) {
          setStores(prevStores => prevStores.filter(store => !selectedStores.includes(store._id)));
          toast.success(`${selectedStores.length} mağaza uğurla silindi`);
          setSelectedStores([]);
          setSelectAll(false);
          fetchStores(currentPage);
        } else {
          const error = await response.json();
          toast.error(error.message || 'Mağazalar silinərkən xəta baş verdi');
        }
      } else {
        // Single delete
        const response = await fetch(`/api/v1/store/${deletingStoreId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          setStores(prevStores => prevStores.filter(store => store._id !== deletingStoreId));
          toast.success('Mağaza uğurla silindi');
          fetchStores(currentPage);
        } else {
          const error = await response.json();
          toast.error(error.message || 'Mağaza silinərkən xəta baş verdi');
        }
      }
    } catch (error) {
      console.error('Error deleting store:', error);
      toast.error('Mağaza silinərkən xəta baş verdi');
    } finally {
      setDeletingStoreId(null);
    }
  };

  // Checkbox selection functions
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedStores([]);
      setSelectAll(false);
    } else {
      setSelectedStores(stores.map(store => store._id));
      setSelectAll(true);
    }
  };

  const handleSelectStore = (storeId) => {
    setSelectedStores(prev => {
      if (prev.includes(storeId)) {
        const newSelected = prev.filter(id => id !== storeId);
        setSelectAll(false);
        return newSelected;
      } else {
        const newSelected = [...prev, storeId];
        if (newSelected.length === stores.length) {
          setSelectAll(true);
        }
        return newSelected;
      }
    });
  };

  const exportData = (format) => {
    const selectedStoreData = stores.filter(store => selectedStores.includes(store._id));
    
    if (format === 'json') {
      const dataStr = JSON.stringify(selectedStoreData, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      const exportFileDefaultName = `stores_${new Date().toISOString().split('T')[0]}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    } else if (format === 'xml') {
      let xmlStr = '<?xml version="1.0" encoding="UTF-8"?>\n<stores>\n';
      selectedStoreData.forEach(store => {
        xmlStr += '  <store>\n';
        xmlStr += `    <id>${store._id}</id>\n`;
        xmlStr += `    <name>${store.name}</name>\n`;
        xmlStr += `    <address>${store.address}</address>\n`;
        xmlStr += `    <phone>${store.phone}</phone>\n`;
        xmlStr += `    <email>${store.email}</email>\n`;
        xmlStr += `    <createdAt>${store.createdAt}</createdAt>\n`;
        xmlStr += '  </store>\n';
      });
      xmlStr += '</stores>';
      
      const dataUri = 'data:application/xml;charset=utf-8,'+ encodeURIComponent(xmlStr);
      const exportFileDefaultName = `stores_${new Date().toISOString().split('T')[0]}.xml`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    } else if (format === 'excel') {
      // Simple CSV format for Excel compatibility
      let csvContent = 'ID,Ad,Ünvan,Telefon,Email,Yaradılma Tarixi\n';
      selectedStoreData.forEach(store => {
        csvContent += `"${store._id}","${store.name}","${store.address}","${store.phone}","${store.email}","${new Date(store.createdAt).toLocaleDateString()}"\n`;
      });
      
      const dataUri = 'data:text/csv;charset=utf-8,'+ encodeURIComponent(csvContent);
      const exportFileDefaultName = `stores_${new Date().toISOString().split('T')[0]}.csv`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    }
    
    toast.success(`${selectedStoreData.length} mağaza ${format.toUpperCase()} formatında ixrac edildi`);
  };

  const totalPages = pagination.totalPages || 1;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}.${month}.${year} ${hours}:${minutes}`;
  };

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
              <CardTitle className="text-2xl font-bold">Mağaza Siyahısı</CardTitle>
              <CardDescription>
                Bütün mağazaları idarə edin
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {selectedStores.length > 0 && (
                <>
                  <Button
                    variant="destructive"
                    onClick={() => setDeletingStoreId('bulk')}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <Trash className="h-4 w-4 mr-2" />
                    Seçilənləri Sil ({selectedStores.length})
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
              <Button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                + Yeni Mağaza
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
         

          {/* Data Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-4 font-semibold">
                    <Checkbox
                      checked={selectAll}
                      onCheckedChange={handleSelectAll}
                      aria-label="Hamısını seç"
                    />
                  </th>
                  <th className="text-left p-4 font-semibold">#</th>
                  <th className="text-left p-4 font-semibold w-[80px]">Logo</th>
                  <th className="text-left p-4 font-semibold">
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => handleSort('name')}
                        className="flex items-center gap-2 hover:text-blue-600 transition-colors"
                      >
                        Mağaza adı
                        {getSortIcon('name')}
                      </button>
                      <input
                        type="text"
                        placeholder="Axtar..."
                        value={filters.name || ''}
                        onChange={(e) => handleFilterChange('name', e.target.value)}
                        className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </th>
                  <th className="text-left p-4 font-semibold">
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => handleSort('category')}
                        className="flex items-center gap-2 hover:text-blue-600 transition-colors"
                      >
                        Kateqoriyası
                        {getSortIcon('category')}
                      </button>
                      <select
                         value={filters.category || ''}
                         onChange={(e) => handleFilterChange('category', e.target.value)}
                         className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                       >
                         <option value="">Hamısı</option>
                         {STORE_CATEGORIES.map((category) => (
                           <option key={category.value} value={category.value}>
                             {category.label}
                           </option>
                         ))}
                       </select>
                    </div>
                  </th>
                  <th className="text-left p-4 font-semibold">
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => handleSort('status')}
                        className="flex items-center gap-2 hover:text-blue-600 transition-colors"
                      >
                        Statusu
                        {getSortIcon('status')}
                      </button>
                      <select
                        value={filters.status || ''}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                        className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="">Hamısı</option>
                        <option value="active">Aktiv</option>
                        <option value="inactive">Deaktiv</option>
                      </select>
                    </div>
                  </th>
                  <th className="text-left p-4 font-semibold">Veb sayt</th>
                  <th className="text-left p-4 font-semibold">
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => handleSort('createdAt')}
                        className="flex items-center gap-2 hover:text-blue-600 transition-colors"
                      >
                        Tarixi
                        {getSortIcon('createdAt')}
                      </button>
                      <input
                        type="date"
                        value={filters.date || ''}
                        onChange={(e) => handleFilterChange('date', e.target.value)}
                        className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </th>
                  <th className="text-left p-4 font-semibold">Əməliyyatlar</th>
                </tr>
              </thead>
              <tbody>
                {stores.length > 0 ? (
                  stores.map((store, index) => (
                    <tr key={store._id} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="p-4">
                        <Checkbox
                          checked={selectedStores.includes(store._id)}
                          onCheckedChange={() => handleSelectStore(store._id)}
                          aria-label={`${store.name} seç`}
                        />
                      </td>
                      <td className="p-4">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                      <td className="p-4">
                        {store.logo ? (
                          <img 
                            src={store.logo} 
                            alt={`${store.name} logo`}
                            className="w-12 h-12 object-cover rounded-full border"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                            <span className="text-gray-500 text-xs">Logo</span>
                          </div>
                        )}
                      </td>
                      <td className="p-4 font-medium">{store.name}</td>
                      <td className="p-4">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                          {store.category}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="relative inline-block w-full max-w-[120px]">
                           <select
                             value={store.status}
                             onChange={(e) => updateStoreStatus(store._id, e.target.value)}
                             className={`appearance-none w-full px-3 py-1.5 pr-8 rounded-lg text-sm font-medium cursor-pointer border transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                               store.status === 'active' 
                                 ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' 
                                 : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                             }`}
                             style={{
                               colorScheme: 'light'
                             }}
                           >
                             <option value="active" style={{ backgroundColor: 'white', color: 'black' }}>Aktiv</option>
                             <option value="inactive" style={{ backgroundColor: 'white', color: 'black' }}>Deaktiv</option>
                           </select>
                           <div className="absolute inset-y-0 right-1 flex items-center pointer-events-none">
                             <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                             </svg>
                           </div>
                         </div>
                      </td>
                      <td className="p-4">
                        {store.website ? (
                          <a 
                            href={store.website.startsWith('http') ? store.website : `https://${store.website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline"
                          >
                            {store.website}
                          </a>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="p-4 text-gray-600">{formatDate(store.createdAt)}</td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEndpointModal(store)}
                            className="text-blue-600 hover:text-blue-700 p-2"
                            title="Endpoint əlavə et"
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditModal(store._id)}
                            className="p-2"
                            title="Redaktə et"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700 p-2"
                            onClick={() => setDeletingStoreId(store._id)}
                            title="Sil"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="p-8 text-center text-gray-500">
                      {searchTerm ? 'Axtarış nəticəsi tapılmadı' : 'Hələ heç bir mağaza əlavə edilməyib'}
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

          {/* Results Info */}
          <div className="mt-4 text-sm text-gray-600 text-center">
            {pagination.totalDocs || 0} mağazadan {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, pagination.totalDocs || 0)} arası göstərilir
          </div>
        </CardContent>
      </Card>

      <AddStoreModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onStoreAdded={(newStore) => {
          fetchStores(currentPage);
          setIsModalOpen(false);
        }}
      />

      <AddEndpointModal
        isOpen={isEndpointModalOpen}
        onClose={closeEndpointModal}
        storeId={selectedStore?._id}
        storeName={selectedStore?.name}
        onEndpointAdded={handleEndpointAdded}
      />

      <EditStoreModal
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        storeId={editStoreId}
        onStoreUpdated={handleStoreUpdated}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingStoreId} onOpenChange={() => setDeletingStoreId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deletingStoreId === 'bulk' ? 'Seçilən mağazaları sil' : 'Mağazanı sil'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deletingStoreId === 'bulk' 
                ? `Bu əməliyyat geri qaytarıla bilməz. ${selectedStores.length} mağaza məlumatları tamamilə silinəcək.`
                : 'Bu əməliyyat geri qaytarıla bilməz. Mağaza məlumatları tamamilə silinəcək.'
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Ləğv et</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteStore}
              className="bg-red-600 hover:bg-red-700"
            >
              {deletingStoreId === 'bulk' ? `${selectedStores.length} mağazanı sil` : 'Sil'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default StoreList;