import React, { useState, useEffect, Fragment } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { useAuth } from "../../contexts/AuthContext";
import AddStoreModal from "../../components/AddStoreModal";
import AddEndpointModal from "../../components/AddEndpointModal";
import EditStoreModal from "../../components/EditStoreModal";
import apiClient from "../../utils/apiClient";
import { STORE_CATEGORIES } from "../../const/categories";
import {
  Settings,
  Edit,
  Trash2,
  Download,
  Trash,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";
import { Checkbox } from "../../components/ui/checkbox";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../components/ui/alert-dialog";

const StoreList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = useAuth();
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
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
  const [sortField, setSortField] = useState("");
  const [sortDirection, setSortDirection] = useState("asc");
  const [filters, setFilters] = useState({
    category: "",
    status: "",
  });
  const [expandedRows, setExpandedRows] = useState([]);
  const [loadingEndpoints, setLoadingEndpoints] = useState({});
  const [endpointData, setEndpointData] = useState({});
  const [categoryProducts, setCategoryProducts] = useState([]);
  const [showCategoryProducts, setShowCategoryProducts] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [loadingCategory, setLoadingCategory] = useState(false);
  const [currentStore, setCurrentStore] = useState(null);
  const [addingCategories, setAddingCategories] = useState(false);
  const [syncingProducts, setSyncingProducts] = useState(false);
  const [storeCategories, setStoreCategories] = useState({});
  const [loadingStoreCategories, setLoadingStoreCategories] = useState({});
  

  // Handle product click to get category products
  const handleProductClick = async (item, store) => {
    const productName = item.category || item.name || item.title;
    if (!productName) {
      toast.error("Məhsul adı tapılmadı");
      return;
    }

    // Check if store has endpoints[1]
    if (!store.endpoints || store.endpoints.length < 2) {
      toast.error("Mağazada ikinci endpoint tapılmadı");
      return;
    }

    setLoadingCategory(true);
    setSelectedCategory(productName);
    setShowCategoryProducts(true);
    setCategoryProducts([]);
    setCurrentStore(store); // Store bilgisini sakla

    try {
      // Use endpoints[1].url and append product name
      const secondEndpoint = store.endpoints[1];
      let apiUrl = secondEndpoint.url;
      
      // Format URL properly
      if (!apiUrl.startsWith("http")) {
        apiUrl = `http://192.168.0.101:7258${apiUrl}`;
      }
      
      // Append product name to the URL
      const fullUrl = `${apiUrl}${productName}`;
      
      console.log('Ürün tıklandı - Sorgu gönderilen URL:', fullUrl);
      console.log('Method:', secondEndpoint.method || 'GET');
      console.log('Ürün adı:', productName);

      // Timeout kontrolü için AbortController
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      try {
        // Make HTTP request to the store's second endpoint
        const response = await fetch(fullUrl, {
          method: secondEndpoint.method || 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();

          // Add store info to each product
          const productsWithStoreInfo = (
            data.products ||
            data.data ||
            data ||
            []
          ).map((product) => ({
            ...product,
            storeName: store.name,
            storeId: store._id,
            storeLogo: store.logo,
            storeWebsite: store.website,
            endpointUrl: fullUrl,
          }));

          setCategoryProducts(productsWithStoreInfo);
          toast.success(
            `${productName} üçün ${productsWithStoreInfo.length} məhsul tapıldı`
          );
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (fetchError) {
        clearTimeout(timeoutId);
        let errorMessage = fetchError.message;
        if (fetchError.name === 'AbortError') {
          errorMessage = 'İstek vaxt bitdi (30 saniyə)';
        }
        console.error(`Error fetching from ${store.name}:`, errorMessage);
        toast.error(`${store.name} mağazasından məlumat gətirilərkən xəta: ${errorMessage}`);
      }
    } catch (error) {
      console.error("Product click error:", error);
      toast.error("Məhsullar gətirilərkən xəta baş verdi");
    } finally {
      setLoadingCategory(false);
    }
  };

  // Handle product synchronization
  const handleSyncProducts = async () => {
    if (!currentStore || !categoryProducts || categoryProducts.length === 0) {
      toast.error("Senkronizasiya ediləcək məhsul tapılmadı");
      return;
    }

    setSyncingProducts(true);

    try {
      // Transform products to match the required format
      const transformedProducts = categoryProducts.map(product => ({
        name: product.name || "",
        brand: product.brand || "",
        price: product.price || 0,
        description: product.description || "",
        discountedPrice: product.discountedPrice || null,
        imageUrl: product.imageUrl || [],
        colors: product.colors || [],
        sizes: product.sizes || [],
        storeId: currentStore._id,
        categoryName: selectedCategory
      }));

      const response = await apiClient.post("http://localhost:5001/api/v1/products/bulk", {
        products: transformedProducts,
        storeId: currentStore._id,
        categoryName: selectedCategory
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("API Error:", errorData);
        toast.error(errorData.message || "Məhsullar senkronizasiya edilərkən xəta baş verdi");
        return;
      }

      const responseData = await response.json();
      
      if (responseData?.success) {
        const { success: addedCount, duplicates: duplicateCount, errors: errorCount } = responseData.results;
        
        if (addedCount > 0) {
          toast.success(`${addedCount} məhsul uğurla stok-a əlavə edildi`);
        }
        if (duplicateCount > 0) {
          toast.warning(`${duplicateCount} məhsul artıq stokda mövcud idi`);
        }
        if (errorCount > 0) {
          toast.error(`${errorCount} məhsul əlavə edilərkən xəta baş verdi`);
        }
        
        if (addedCount === 0 && duplicateCount > 0 && errorCount === 0) {
          toast.info("Bütün məhsullar artıq stokda mövcuddur");
        }
      } else {
        toast.error("Məhsullar senkronizasiya edilərkən xəta baş verdi");
      }
    } catch (error) {
      console.error("Error syncing products:", error);
      toast.error("Məhsullar senkronizasiya edilərkən xəta baş verdi");
    } finally {
      setSyncingProducts(false);
    }
  };

  // Handle adding category to stock
  const handleAddCategoryToStock = async () => {
    if (!selectedCategory || !currentStore) {
      toast.error("Kategori və ya mağaza məlumatı tapılmadı");
      return;
    }

    try {
      const response = await apiClient.post("/api/v1/category-stock", {
        categoryName: selectedCategory,
        storeId: currentStore._id,
        storeName: currentStore.name
      });

      if (response.data.success) {
        toast.success("Kategori uğurla stok-a əlavə edildi");
      } else {
        toast.error(response.data.message || "Kategori əlavə edilərkən xəta baş verdi");
      }
    } catch (error) {
      console.error("Error adding category to stock:", error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Kategori əlavə edilərkən xəta baş verdi");
      }
    }
  };

  // Handle adding all categories to stock
  const handleAddAllCategoriesToStock = async (store, categories) => {
    if (!store || !categories || !Array.isArray(categories)) {
      toast.error("Mağaza və ya kategori məlumatları tapılmadı");
      return;
    }

    setAddingCategories(true);

    // Extract unique category names
    const uniqueCategories = [...new Set(
      categories
        .map(item => item.category || item.name || item.title)
        .filter(Boolean)
        .map(cat => cat.trim()) // Trim whitespace
    )];

    if (uniqueCategories.length === 0) {
      toast.error("Əlavə ediləcək kategori tapılmadı");
      setAddingCategories(false);
      return;
    }

    const totalCategories = categories.length;
    const duplicateCount = totalCategories - uniqueCategories.length;
    
    if (duplicateCount > 0) {
      toast.info(`${totalCategories} kategoridən ${duplicateCount} təkrar kategori filtreləndi. ${uniqueCategories.length} unikal kategori əlavə ediləcək.`);
    }

    try {
      let successCount = 0;
      let errorCount = 0;
      let duplicateErrorCount = 0;

      for (const categoryName of uniqueCategories) {
        try {
          const response = await apiClient.post("http://localhost:5001/api/v1/category-stock", {
            categoryName,
            storeId: store._id,
            storeName: store.name
          });

          // Check if response is ok and has data
          if (!response.ok) {
            const errorData = await response.json();
            console.error(`API Error for category ${categoryName}:`, errorData);
            
            if (response.status === 409 || errorData?.isDuplicate) {
              duplicateErrorCount++;
            } else {
              errorCount++;
            }
            continue;
          }

          const responseData = await response.json();
          
          if (responseData?.success) {
            successCount++;
          } else {
            if (responseData?.isDuplicate) {
              duplicateErrorCount++;
            } else {
              errorCount++;
            }
          }
        } catch (error) {
          console.error(`Network/Parse Error for category ${categoryName}:`, error);
          
          if (error.response?.status === 409 || error.response?.data?.isDuplicate) {
            duplicateErrorCount++;
          } else {
            errorCount++;
          }
        }
      }

      // Show detailed success/error messages
      if (successCount > 0) {
        toast.success(`${successCount} kategori uğurla stok-a əlavə edildi`);
      }
      if (duplicateErrorCount > 0) {
        toast.warning(`${duplicateErrorCount} kategori artıq stokda mövcud idi`);
      }
      if (errorCount > 0) {
        toast.error(`${errorCount} kategori əlavə edilərkən xəta baş verdi`);
      }
      
      // Summary message
      if (successCount === 0 && duplicateErrorCount > 0 && errorCount === 0) {
        toast.info("Bütün kategorilər artıq stokda mövcuddur");
      }
    } catch (error) {
      console.error("Error adding categories to stock:", error);
      toast.error("Kategorilər əlavə edilərkən xəta baş verdi");
    } finally {
      setAddingCategories(false);
    }
  };

  useEffect(() => {
    fetchStores(currentPage);
  }, [location.state, currentPage, sortField, sortDirection, filters]);

  useEffect(() => {
    if (
      sortField ||
      filters.category ||
      filters.status ||
      filters.name ||
      filters.date
    ) {
      fetchStores(1);
    }
  }, [sortField, sortDirection, filters]);

  const fetchStores = async (page = 1) => {
    try {
      console.log("Token:", token);

      // Build query parameters
      const params = new URLSearchParams({
        page: page.toString(),
        limit: itemsPerPage.toString(),
      });

      if (filters.category) params.append("category", filters.category);
      if (filters.status) params.append("status", filters.status);
      if (filters.name) params.append("name", filters.name);
      if (filters.date) params.append("date", filters.date);
      if (sortField) {
        params.append(
          "sort",
          sortDirection === "desc" ? `-${sortField}` : sortField
        );
      }

      const response = await apiClient.get(
        `/api/v1/store/?${params.toString()}`
      );

      if (response.ok) {
        const result = await response.json();
        console.log("API Response:", result);
        setStores(Array.isArray(result.data) ? result.data : []);
        setPagination(result.pagination || {});
        setCurrentPage(page);
      } else {
        console.error("Failed to fetch stores. Status:", response.status);
        const errorText = await response.text();
        console.error("Error response:", errorText);
        setStores([]);
      }
    } catch (error) {
      console.error("Error fetching stores:", error);
      setStores([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleFilterChange = (filterType, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterType]: value,
    }));
    setCurrentPage(1);
  };

  const getSortIcon = (field) => {
    if (sortField !== field) {
      return (
        <svg
          className="w-4 h-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
          />
        </svg>
      );
    }
    return sortDirection === "asc" ? (
      <svg
        className="w-4 h-4 text-blue-600"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 15l7-7 7 7"
        />
      </svg>
    ) : (
      <svg
        className="w-4 h-4 text-blue-600"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 9l-7 7-7-7"
        />
      </svg>
    );
  };

  const updateStoreStatus = async (storeId, newStatus) => {
    try {
      const response = await apiClient.put(`/api/v1/store/${storeId}/status`, {
        status: newStatus,
      });

      if (response.ok) {
        // Update the store in the local state
        setStores((prevStores) =>
          prevStores.map((store) =>
            store._id === storeId ? { ...store, status: newStatus } : store
          )
        );
        console.log("Store status updated successfully");
      } else {
        console.error("Failed to update store status");
        toast.error("Status yenilənərkən xəta baş verdi");
      }
    } catch (error) {
      console.error("Error updating store status:", error);
      toast.error("Status yenilənərkən xəta baş verdi");
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
    setStores((prevStores) =>
      prevStores.map((store) =>
        store._id === updatedStore._id ? updatedStore : store
      )
    );
  };

  const confirmDeleteStore = async () => {
    if (!deletingStoreId) return;

    try {
      if (deletingStoreId === "bulk") {
        // Bulk delete
        const response = await fetch("/api/v1/store/bulk-delete", {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ storeIds: selectedStores }),
        });

        if (response.ok) {
          setStores((prevStores) =>
            prevStores.filter((store) => !selectedStores.includes(store._id))
          );
          toast.success(`${selectedStores.length} mağaza uğurla silindi`);
          setSelectedStores([]);
          setSelectAll(false);
          fetchStores(currentPage);
        } else {
          const error = await response.json();
          toast.error(error.message || "Mağazalar silinərkən xəta baş verdi");
        }
      } else {
        // Single delete
        const response = await fetch(`/api/v1/store/${deletingStoreId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          setStores((prevStores) =>
            prevStores.filter((store) => store._id !== deletingStoreId)
          );
          toast.success("Mağaza uğurla silindi");
          fetchStores(currentPage);
        } else {
          const error = await response.json();
          toast.error(error.message || "Mağaza silinərkən xəta baş verdi");
        }
      }
    } catch (error) {
      console.error("Error deleting store:", error);
      toast.error("Mağaza silinərkən xəta baş verdi");
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
      setSelectedStores(stores.map((store) => store._id));
      setSelectAll(true);
    }
  };

  const handleSelectStore = (storeId) => {
    setSelectedStores((prev) => {
      if (prev.includes(storeId)) {
        const newSelected = prev.filter((id) => id !== storeId);
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

  const toggleRowExpansion = async (storeId) => {
    const isCurrentlyExpanded = expandedRows.includes(storeId);
    
    setExpandedRows(
      (prev) =>
        prev.includes(storeId)
          ? [] // Eğer zaten açıksa kapat
          : [storeId] // Sadece bu store'u aç, diğerlerini kapat
    );

    // Eğer row açılıyorsa ve henüz kategoriler yüklenmemişse, kategorileri yükle
    if (!isCurrentlyExpanded) {
      const store = stores.find(s => s._id === storeId);
      if (store && !storeCategories[storeId]) {
        await fetchStoreCategories(store.name, storeId);
      }
    }
  };

  // Mağaza kategorilerini getir
  const fetchStoreCategories = async (storeName, storeId) => {
    try {
      setLoadingStoreCategories(prev => ({ ...prev, [storeId]: true }));
      
      const response = await fetch(`/api/v1/category-stock/store/${storeName.toLowerCase()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        setStoreCategories(prev => ({
          ...prev,
          [storeId]: result.data || []
        }));
      } else {
        console.error('Kategoriler yüklenirken hata:', response.statusText);
      }
    } catch (error) {
      console.error('Kategoriler yüklenirken hata:', error);
    } finally {
      setLoadingStoreCategories(prev => ({ ...prev, [storeId]: false }));
    }
  };

  const exportData = (format) => {
    const selectedStoreData = stores.filter((store) =>
      selectedStores.includes(store._id)
    );

    if (format === "json") {
      const dataStr = JSON.stringify(selectedStoreData, null, 2);
      const dataUri =
        "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
      const exportFileDefaultName = `stores_${
        new Date().toISOString().split("T")[0]
      }.json`;

      const linkElement = document.createElement("a");
      linkElement.setAttribute("href", dataUri);
      linkElement.setAttribute("download", exportFileDefaultName);
      linkElement.click();
    } else if (format === "xml") {
      let xmlStr = '<?xml version="1.0" encoding="UTF-8"?>\n<stores>\n';
      selectedStoreData.forEach((store) => {
        xmlStr += "  <store>\n";
        xmlStr += `    <id>${store._id}</id>\n`;
        xmlStr += `    <name>${store.name}</name>\n`;
        xmlStr += `    <address>${store.address}</address>\n`;
        xmlStr += `    <phone>${store.phone}</phone>\n`;
        xmlStr += `    <email>${store.email}</email>\n`;
        xmlStr += `    <createdAt>${store.createdAt}</createdAt>\n`;
        xmlStr += "  </store>\n";
      });
      xmlStr += "</stores>";

      const dataUri =
        "data:application/xml;charset=utf-8," + encodeURIComponent(xmlStr);
      const exportFileDefaultName = `stores_${
        new Date().toISOString().split("T")[0]
      }.xml`;

      const linkElement = document.createElement("a");
      linkElement.setAttribute("href", dataUri);
      linkElement.setAttribute("download", exportFileDefaultName);
      linkElement.click();
    } else if (format === "excel") {
      // Simple CSV format for Excel compatibility
      let csvContent = "ID,Ad,Ünvan,Telefon,Email,Yaradılma Tarixi\n";
      selectedStoreData.forEach((store) => {
        csvContent += `"${store._id}","${store.name}","${store.address}","${
          store.phone
        }","${store.email}","${new Date(
          store.createdAt
        ).toLocaleDateString()}"\n`;
      });

      const dataUri =
        "data:text/csv;charset=utf-8," + encodeURIComponent(csvContent);
      const exportFileDefaultName = `stores_${
        new Date().toISOString().split("T")[0]
      }.csv`;

      const linkElement = document.createElement("a");
      linkElement.setAttribute("href", dataUri);
      linkElement.setAttribute("download", exportFileDefaultName);
      linkElement.click();
    }

    toast.success(
      `${
        selectedStoreData.length
      } mağaza ${format.toUpperCase()} formatında ixrac edildi`
    );
  };

  const totalPages = pagination.totalPages || 1;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
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
              <CardTitle className="text-2xl font-bold">
                Mağaza Siyahısı
              </CardTitle>
              <CardDescription>Bütün mağazaları idarə edin</CardDescription>
            </div>
            <div className="flex gap-2">
              {selectedStores.length > 0 && (
                <>
                  <Button
                    variant="destructive"
                    onClick={() => setDeletingStoreId("bulk")}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <Trash className="h-4 w-4 mr-2" />
                    Seçilənləri Sil ({selectedStores.length})
                  </Button>
                  <Button variant="outline" onClick={() => exportData("json")}>
                    <Download className="h-4 w-4 mr-2" />
                    JSON
                  </Button>
                  <Button variant="outline" onClick={() => exportData("xml")}>
                    <Download className="h-4 w-4 mr-2" />
                    XML
                  </Button>
                  <Button variant="outline" onClick={() => exportData("excel")}>
                    <Download className="h-4 w-4 mr-2" />
                    Excel
                  </Button>
                </>
              )}
              <Button
                onClick={() => setIsModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
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
                        onClick={() => handleSort("name")}
                        className="flex items-center gap-2 hover:text-blue-600 transition-colors"
                      >
                        Mağaza adı
                        {getSortIcon("name")}
                      </button>
                      <input
                        type="text"
                        placeholder="Axtar..."
                        value={filters.name || ""}
                        onChange={(e) =>
                          handleFilterChange("name", e.target.value)
                        }
                        className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </th>
                  <th className="text-left p-4 font-semibold">
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => handleSort("category")}
                        className="flex items-center gap-2 hover:text-blue-600 transition-colors"
                      >
                        Kateqoriyası
                        {getSortIcon("category")}
                      </button>
                      <select
                        value={filters.category || ""}
                        onChange={(e) =>
                          handleFilterChange("category", e.target.value)
                        }
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
                        onClick={() => handleSort("status")}
                        className="flex items-center gap-2 hover:text-blue-600 transition-colors"
                      >
                        Statusu
                        {getSortIcon("status")}
                      </button>
                      <select
                        value={filters.status || ""}
                        onChange={(e) =>
                          handleFilterChange("status", e.target.value)
                        }
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
                        onClick={() => handleSort("createdAt")}
                        className="flex items-center gap-2 hover:text-blue-600 transition-colors"
                      >
                        Tarixi
                        {getSortIcon("createdAt")}
                      </button>
                      <input
                        type="date"
                        value={filters.date || ""}
                        onChange={(e) =>
                          handleFilterChange("date", e.target.value)
                        }
                        className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </th>
                  <th className="text-left p-4 font-semibold">Əməliyyatlar</th>
                </tr>
              </thead>
              <tbody>
                {stores.length > 0 ? (
                  <>
                    {stores.map((store, index) => (
                      <Fragment key={store._id}>
                        <tr className="border-b hover:bg-gray-50 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleRowExpansion(store._id)}
                                className="p-1 h-6 w-6"
                                title="Ətraflı məlumat"
                              >
                                {expandedRows.includes(store._id) ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </Button>
                              <Checkbox
                                checked={selectedStores.includes(store._id)}
                                onCheckedChange={() =>
                                  handleSelectStore(store._id)
                                }
                                aria-label={`${store.name} seç`}
                              />
                            </div>
                          </td>
                          <td className="p-4">
                            {(currentPage - 1) * itemsPerPage + index + 1}
                          </td>
                          <td className="p-4">
                            {store.logo ? (
                              <img
                                src={store.logo}
                                alt={`${store.name} logo`}
                                className="w-5 h-5 object-cover rounded-full border"
                              />
                            ) : (
                              <div className="w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center">
                                <span className="text-gray-500 text-xs">
                                  Logo
                                </span>
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
                                onChange={(e) =>
                                  updateStoreStatus(store._id, e.target.value)
                                }
                                className={`appearance-none w-full px-3 py-1.5 pr-8 rounded-lg text-sm font-medium cursor-pointer border transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                  store.status === "active"
                                    ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                                    : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                                }`}
                                style={{
                                  colorScheme: "light",
                                }}
                              >
                                <option
                                  value="active"
                                  style={{
                                    backgroundColor: "white",
                                    color: "black",
                                  }}
                                >
                                  Aktiv
                                </option>
                                <option
                                  value="inactive"
                                  style={{
                                    backgroundColor: "white",
                                    color: "black",
                                  }}
                                >
                                  Deaktiv
                                </option>
                              </select>
                              <div className="absolute inset-y-0 right-1 flex items-center pointer-events-none">
                                <svg
                                  className="w-4 h-4 text-gray-400"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 9l-7 7-7-7"
                                  />
                                </svg>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            {store.website ? (
                              <a
                                href={
                                  store.website.startsWith("http")
                                    ? store.website
                                    : `https://${store.website}`
                                }
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
                          <td className="p-4 text-gray-600">
                            {formatDate(store.createdAt)}
                          </td>
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
                        {expandedRows.includes(store._id) && (
                          <tr className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-400">
                            <td colSpan={9} className="p-6">
                              <div className="bg-white rounded-lg shadow-sm border p-6 space-y-6">
                                {store.endpoints &&
                                  store.endpoints.length > 0 && (
                                    <div className="space-y-4">
                                      <div className="flex items-center justify-between">
                                        <h5 className="font-semibold text-lg text-gray-700 flex items-center gap-2">
                                          <Settings className="h-5 w-5 text-blue-500" />
                                          API Endpointləri (1)
                                        </h5>
                                      </div>
                                      <div className="grid gap-4">
                                        {store.endpoints
                                          .slice(0, 1)
                                          .map((endpoint, idx) => (
                                            <div
                                              key={idx}
                                              className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                                            >
                                              <div className="flex items-center justify-between mb-3">
                                                <h6 className="font-medium text-gray-800">
                                                  {endpoint.name ===
                                                  "getAllCategories"
                                                    ? "Bütün Kateqoriyalar/Brendlər"
                                                    : ""}
                                                </h6>

                                                <span
                                                  className={`px-2 py-1 rounded text-xs font-medium ${
                                                    endpoint.method === "GET"
                                                      ? "bg-green-100 text-green-700"
                                                      : endpoint.method ===
                                                        "POST"
                                                      ? "bg-blue-100 text-blue-700"
                                                      : endpoint.method ===
                                                        "PUT"
                                                      ? "bg-yellow-100 text-yellow-700"
                                                      : endpoint.method ===
                                                        "DELETE"
                                                      ? "bg-red-100 text-red-700"
                                                      : "bg-gray-100 text-gray-700"
                                                  }`}
                                                >
                                                  {endpoint.method}
                                                </span>
                                              </div>
                                              <div className="flex items-center gap-2 mb-3">
                                                <code className="bg-white px-3 py-1 rounded border text-sm font-mono text-gray-700 flex-1">
                                                  {endpoint.url}
                                                </code>
                                                <Button
                                                  size="sm"
                                                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-1 text-xs flex items-center gap-2 disabled:opacity-50"
                                                  disabled={
                                                    loadingEndpoints[
                                                      `${store._id}-${store.endpoints[0]?.url}`
                                                    ]
                                                  }
                                                  onClick={async () => {
                                                    // Her zaman ilk endpoint'i kullan
                                                    const firstEndpoint =
                                                      store.endpoints[0];
                                                    const endpointKey = `${store._id}-${firstEndpoint.url}`;
                                                    try {
                                                      setLoadingEndpoints(
                                                        (prev) => ({
                                                          ...prev,
                                                          [endpointKey]: true,
                                                        })
                                                      );

                                                      // URL-i düzgün formalaşdır
                                                      let apiUrl =
                                                        firstEndpoint.url;
                                                      if (
                                                        !apiUrl.startsWith(
                                                          "http"
                                                        )
                                                      ) {
                                                        apiUrl = `http://192.168.0.101:7258${apiUrl}`;
                                                      }

                                                      console.log('Sorgu gönderilen URL:', apiUrl);
                                                      console.log('Method:', firstEndpoint.method || 'GET');

                                                      // Timeout kontrolü için AbortController
                                                      const controller = new AbortController();
                                                      

                                                      const response =
                                                        await fetch(
                                                          apiUrl,
                                                          {
                                                            method:
                                                              firstEndpoint.method ||
                                                              "GET",
                                                            headers: {
                                                              "Content-Type":
                                                                "application/json",
                                                            },
                                                            signal: controller.signal,
                                                          }
                                                        );

                                                      if (!response.ok) {
                                                        throw new Error(
                                                          `HTTP ${response.status}: ${response.statusText}`
                                                        );
                                                      }

                                                      const data =
                                                        await response.json();
                                                      console.log(
                                                        "Endpoint response:",
                                                        data
                                                      );
                                                      setEndpointData(
                                                        (prev) => ({
                                                          ...prev,
                                                          [endpointKey]: data,
                                                        })
                                                      );
                                                      toast.success(
                                                        `${
                                                          firstEndpoint.name ||
                                                          "Endpoint"
                                                        } uğurla işlədi!`
                                                      );
                                                    } catch (error) {
                                                      console.error(
                                                        "Endpoint error:",
                                                        error
                                                      );
                                                      
                                                      let errorMessage = error.message;
                                                      if (error.name === 'AbortError') {
                                                        errorMessage = 'İstek zaman aşımına uğradı (30 saniye)';
                                                      } else if (error.message.includes('timeout')) {
                                                        errorMessage = 'İstek zaman aşımına uğradı';
                                                      }
                                                      
                                                      toast.error(
                                                        `Endpoint xətası: ${errorMessage}`
                                                      );
                                                    } finally {
                                                      setLoadingEndpoints(
                                                        (prev) => ({
                                                          ...prev,
                                                          [endpointKey]: false,
                                                        })
                                                      );
                                                    }
                                                  }}
                                                >
                                                  {loadingEndpoints[
                                                    `${store._id}-${store.endpoints[0]?.url}`
                                                  ] ? (
                                                    <>
                                                      <Loader2 className="w-4 h-4 animate-spin" />
                                                      Yüklənir...
                                                    </>
                                                  ) : (
                                                    "Başlat"
                                                  )}
                                                </Button>
                                              </div>
                                              {endpoint.description && (
                                                <p className="text-sm text-gray-600 mt-2">
                                                  {endpoint.description}
                                                </p>
                                              )}
                                              {endpointData[
                                                `${store._id}-${endpoint.url}`
                                              ] && (
                                                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                                                  <div className="flex items-center justify-between mb-3">
                                                    <h4 className="font-medium text-gray-900">
                                                      Nəticələr
                                                    </h4>
                                                    <div className="flex items-center gap-3">
                                                      <span className="text-sm text-gray-500">
                                                        {Array.isArray(
                                                          endpointData[
                                                            `${store._id}-${endpoint.url}`
                                                          ]
                                                        )
                                                          ? endpointData[
                                                              `${store._id}-${endpoint.url}`
                                                            ].length
                                                          : 1}{" "}
                                                        məhsul
                                                      </span>
                                                      <Button
                                                        variant="default"
                                                        size="sm"
                                                        onClick={() => handleAddAllCategoriesToStock(store, endpointData[`${store._id}-${endpoint.url}`])}
                                                        className="bg-green-600 hover:bg-green-700 text-white"
                                                        disabled={addingCategories}
                                                      >
                                                        {addingCategories ? (
                                                          <>
                                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                            Əlavə edilir...
                                                          </>
                                                        ) : (
                                                          "Kategorileri stok-a ekle"
                                                        )}
                                                      </Button>
                                                    </div>
                                                  </div>
                                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                                                    {(Array.isArray(
                                                      endpointData[
                                                        `${store._id}-${endpoint.url}`
                                                      ]
                                                    )
                                                      ? endpointData[
                                                          `${store._id}-${endpoint.url}`
                                                        ]
                                                      : [
                                                          endpointData[
                                                            `${store._id}-${endpoint.url}`
                                                          ],
                                                        ]
                                                    ).map((item, itemIndex) => (
                                                      <div
                                                        key={itemIndex}
                                                        className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl hover:scale-105 transition-all duration-300 hover:border-blue-200 cursor-pointer"
                                                        onClick={() =>
                                                          handleProductClick(
                                                            item,
                                                            store
                                                          )
                                                        }
                                                      >
                                                        {(item.image ||
                                                          item.logo ||
                                                          item.img) && (
                                                          <div className="mb-6 flex justify-center">
                                                            <div className="w-24 h-24 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl shadow-md border-2 border-white p-4 flex items-center justify-center overflow-hidden hover:shadow-lg transition-shadow duration-300">
                                                              <img
                                                                src={(() => {
                                                                  const imgSrc =
                                                                    item.image ||
                                                                    item.logo ||
                                                                    item.img;
                                                                  if (!imgSrc)
                                                                    return "";

                                                                  // Əgər artıq data: ilə başlayırsa, olduğu kimi qaytar
                                                                  if (
                                                                    imgSrc.startsWith(
                                                                      "data:"
                                                                    )
                                                                  )
                                                                    return imgSrc;

                                                                  // Əgər http ilə başlayırsa, olduğu kimi qaytar
                                                                  if (
                                                                    imgSrc.startsWith(
                                                                      "http"
                                                                    )
                                                                  )
                                                                    return imgSrc;

                                                                  // Base64 string-ləri yoxla və düzgün format et
                                                                  if (
                                                                    imgSrc.startsWith(
                                                                      "/9j/"
                                                                    ) ||
                                                                    imgSrc.startsWith(
                                                                      "iVBOR"
                                                                    ) ||
                                                                    imgSrc.startsWith(
                                                                      "R0lGOD"
                                                                    ) ||
                                                                    imgSrc.startsWith(
                                                                      "UklGR"
                                                                    ) ||
                                                                    imgSrc.match(
                                                                      /^[A-Za-z0-9+/=]+$/
                                                                    )
                                                                  ) {
                                                                    return `data:image/jpeg;base64,${imgSrc}`;
                                                                  }

                                                                  return imgSrc;
                                                                })()}
                                                                alt={
                                                                  item.name ||
                                                                  item.title ||
                                                                  "Logo"
                                                                }
                                                                className="max-w-full max-h-full object-contain"
                                                                onError={(
                                                                  e
                                                                ) => {
                                                                  console.log(
                                                                    "Image load error:",
                                                                    e.target.src
                                                                  );
                                                                  e.target.src =
                                                                    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjRjlGQUZCIi8+CjxwYXRoIGQ9Ik0yNCAyOEg0MFYzNkgyNFYyOFoiIGZpbGw9IiNEMUQ1REIiLz4KPHBhdGggZD0iTTI4IDMwSDM2VjM0SDI4VjMwWiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K";
                                                                  e.target.onerror =
                                                                    null;
                                                                }}
                                                              />
                                                            </div>
                                                          </div>
                                                        )}
                                                        <div className="space-y-3">
                                                          {item.name && (
                                                            <h1 className="font-bold text-gray-900 text-lg line-clamp-2 text-center leading-tight">
                                                              {item.name}
                                                            </h1>
                                                          )}
                                                          {item.title &&
                                                            !item.name && (
                                                              <h5 className="font-bold text-gray-900 text-base line-clamp-2 text-center leading-tight">
                                                                {item.title}
                                                              </h5>
                                                            )}
                                                          {item.price && (
                                                            <p className="text-emerald-600 font-bold text-xl text-center">
                                                              {item.price}
                                                            </p>
                                                          )}
                                                          <div className="flex flex-wrap justify-center gap-2 mt-4">
                                                            {item.brand && (
                                                              <span className="inline-flex items-center bg-gradient-to-r from-purple-500 to-purple-600 text-white text-xs font-medium px-3 py-1.5 rounded-full shadow-sm">
                                                                {item.brand}
                                                              </span>
                                                            )}
                                                            {item.category && (
                                                              <span className="inline-flex items-center bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs font-medium px-3 py-1.5 rounded-full shadow-sm">
                                                                {item.category}
                                                              </span>
                                                            )}
                                                          </div>
                                                          {item.url && (
                                                            <div className="mt-4">
                                                              <a
                                                                href={item.url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="inline-flex items-center justify-center w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium text-sm px-4 py-2.5 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                                                              >
                                                                <svg
                                                                  className="w-4 h-4 mr-2"
                                                                  fill="none"
                                                                  stroke="currentColor"
                                                                  viewBox="0 0 24 24"
                                                                >
                                                                  <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    strokeWidth={
                                                                      2
                                                                    }
                                                                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                                                  />
                                                                </svg>
                                                                Məhsula bax
                                                              </a>
                                                            </div>
                                                          )}
                                                          {item.description && (
                                                            <p className="text-gray-600 text-xs line-clamp-3">
                                                              {item.description}
                                                            </p>
                                                          )}
                                                        </div>
                                                      </div>
                                                    ))}
                                                  </div>
                                                </div>
                                              )}
                                            </div>
                                          ))}
                                      </div>
                                    </div>
                                  )}

                                {/* CategoryStock Kategorileri Bölümü */}
                                <div className="space-y-4 mt-6">
                                  <div className="flex items-center justify-between">
                                    <h5 className="font-semibold text-lg text-gray-700 flex items-center gap-2">
                                      <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                      </svg>
                                      Mağaza Kategorileri
                                    </h5>
                                  </div>
                                  
                                  {loadingStoreCategories[store._id] ? (
                                    <div className="flex justify-center items-center py-8">
                                      <Loader2 className="h-6 w-6 animate-spin text-green-500" />
                                      <span className="ml-2 text-gray-600">Kategoriler yüklənir...</span>
                                    </div>
                                  ) : storeCategories[store._id] && storeCategories[store._id].length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                      {storeCategories[store._id].map((category, idx) => (
                                        <div
                                          key={idx}
                                          className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 hover:shadow-md transition-all duration-300 hover:border-green-300"
                                        >
                                          <div className="flex items-center justify-between mb-3">
                                            <h6 className="font-medium text-gray-800 truncate">
                                              {category.categoryName}
                                            </h6>
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                                              category.categoryType === 'brand' 
                                                ? 'bg-blue-100 text-blue-700' 
                                                : 'bg-purple-100 text-purple-700'
                                            }`}>
                                              {category.categoryType === 'brand' ? 'Brend' : 'Kateqoriya'}
                                            </span>
                                          </div>
                                          
                                          {category.img && (
                                             <div className="mb-3 flex justify-center">
                                               <div className="w-16 h-16 bg-white rounded-lg shadow-sm border border-gray-200 p-2 flex items-center justify-center overflow-hidden">
                                                 <img
                                                   src={(() => {
                                                     const imgSrc = category.img;
                                                     if (!imgSrc) return "";
                                                     
                                                     // Eğer zaten data: ile başlıyorsa (base64), olduğu gibi döndür
                                                     if (imgSrc.startsWith('data:')) {
                                                       return imgSrc;
                                                     }
                                                     
                                                     // Eğer base64 string ise ama data: prefix'i yoksa ekle
                                                     if (imgSrc.match(/^[A-Za-z0-9+/]+=*$/)) {
                                                       return `data:image/jpeg;base64,${imgSrc}`;
                                                     }
                                                     
                                                     // Eğer HTTP URL ise olduğu gibi döndür
                                                     if (imgSrc.startsWith('http')) {
                                                       return imgSrc;
                                                     }
                                                     
                                                     // Diğer durumlarda base64 olarak varsay
                                                     return `data:image/jpeg;base64,${imgSrc}`;
                                                   })()}
                                                   alt={category.categoryName}
                                                   className="w-full h-full object-contain"
                                                   onError={(e) => {
                                                     e.target.style.display = 'none';
                                                   }}
                                                 />
                                               </div>
                                             </div>
                                           )}
                                          
                                          <div className="text-xs text-gray-500 space-y-1">
                                            <div>Mağaza: <span className="font-medium">{category.storeName}</span></div>
                                            <div>Status: <span className={`font-medium ${category.status === 'active' ? 'text-green-600' : 'text-red-600'}`}>
                                              {category.status === 'active' ? 'Aktiv' : 'Passiv'}
                                            </span></div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                                      <svg className="h-12 w-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                      </svg>
                                      <p className="text-gray-500">
                                        Bu mağaza üçün hələ heç bir kateqoriya əlavə edilməyib
                                      </p>
                                    </div>
                                  )}
                                </div>

                                {(!store.endpoints ||
                                  store.endpoints.length === 0) && (
                                  <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                                    <Settings className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                                    <p className="text-gray-500 mb-4">
                                      Hələ heç bir endpoint əlavə edilməyib
                                    </p>
                                    <Button
                                      onClick={() => openEndpointModal(store)}
                                      className="bg-blue-500 hover:bg-blue-600 text-white"
                                    >
                                      İlk Endpoint-i Əlavə Et
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    ))}
                  </>
                ) : (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-gray-500">
                      {searchTerm
                        ? "Axtarış nəticəsi tapılmadı"
                        : "Hələ heç bir mağaza əlavə edilməyib"}
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
            {pagination.totalDocs || 0} mağazadan{" "}
            {(currentPage - 1) * itemsPerPage + 1}-
            {Math.min(currentPage * itemsPerPage, pagination.totalDocs || 0)}{" "}
            arası göstərilir
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
      <AlertDialog
        open={!!deletingStoreId}
        onOpenChange={() => setDeletingStoreId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deletingStoreId === "bulk"
                ? "Seçilən mağazaları sil"
                : "Mağazanı sil"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deletingStoreId === "bulk"
                ? `Bu əməliyyat geri qaytarıla bilməz. ${selectedStores.length} mağaza məlumatları tamamilə silinəcək.`
                : "Bu əməliyyat geri qaytarıla bilməz. Mağaza məlumatları tamamilə silinəcək."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Ləğv et</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteStore}
              className="bg-red-600 hover:bg-red-700"
            >
              {deletingStoreId === "bulk"
                ? `${selectedStores.length} mağazanı sil`
                : "Sil"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Category Products Modal */}
      {showCategoryProducts && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedCategory} - Kateqoriya Məhsulları
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    ({categoryProducts.length} məhsul)
                  </span>
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="default"
                  size="sm"
                  disabled={syncingProducts || categoryProducts.length === 0}
                  onClick={handleSyncProducts}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {syncingProducts ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Senkronizasiya edilir...
                    </>
                  ) : (
                    "Ürünleri stokla senkronize et"
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowCategoryProducts(false);
                    setCategoryProducts([]);
                    setSelectedCategory("");
                    setCurrentStore(null);
                  }}
                >
                  Bağla
                </Button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {loadingCategory ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                  <span className="ml-2 text-gray-600">
                    Məhsullar yüklənir...
                  </span>
                </div>
              ) : categoryProducts.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {categoryProducts.map((product, index) => {
                    // Şəkilləri topla
                    const images = [];
                    if (product.image) images.push(product.image);
                    if (product.logo && product.logo !== product.image)
                      images.push(product.logo);
                    if (
                      product.img &&
                      product.img !== product.image &&
                      product.img !== product.logo
                    )
                      images.push(product.img);
                    if (product.images && Array.isArray(product.images)) {
                      product.images.forEach((img) => {
                        if (!images.includes(img)) images.push(img);
                      });
                    }

                    return (
                      <ProductCard
                        key={index}
                        product={product}
                        images={images}
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-lg">
                    Bu kateqoriyada məhsul tapılmadı
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Product Card Component */}
      {showCategoryProducts && <ProductCard />}
    </div>
  );
};

// Product Card Component
const ProductCard = ({ product, images }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // imageUrl arrayindən şəkilləri al
  const productImages = product?.imageUrl || images || [];

  const formatImageSrc = (imgSrc) => {
    if (!imgSrc) return "";
    // URL-dəki backtick və boşluqları təmizlə
    const cleanUrl = imgSrc
      .toString()
      .trim()
      .replace(/^["'`\s]+|["'`\s]+$/g, "");
    if (cleanUrl.startsWith("data:")) return cleanUrl;
    if (cleanUrl.startsWith("http")) return cleanUrl;
    if (
      cleanUrl.startsWith("/9j/") ||
      cleanUrl.startsWith("iVBOR") ||
      cleanUrl.startsWith("R0lGOD") ||
      cleanUrl.startsWith("UklGR") ||
      cleanUrl.match(/^[A-Za-z0-9+/=]+$/)
    ) {
      return `data:image/jpeg;base64,${cleanUrl}`;
    }
    return cleanUrl;
  };

  // Mövcud ölçüləri və bitmiş ölçüləri ayır
  const availableSizes = product?.sizes?.filter((size) => size.onStock) || [];
  const outOfStockSizes = product?.sizes?.filter((size) => !size.onStock) || [];

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col h-full">
      {/* Şəkil Carousel */}
      {productImages && productImages.length > 0 && (
        <div className="relative h-40 bg-gradient-to-br from-gray-50 to-gray-100">
          <img
            src={formatImageSrc(productImages[currentImageIndex])}
            alt={product?.name || "Məhsul"}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.src =
                "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjRjlGQUZCIi8+CjxwYXRoIGQ9Ik0yNCAyOEg0MFYzNkgyNFYyOFoiIGZpbGw9IiNEMUQ1REIiLz4KPHBhdGggZD0iTTI4IDMwSDM2VjM0SDI4VjMwWiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K";
              e.target.onerror = null;
            }}
          />

          {/* Carousel Navigation */}
          {productImages.length > 1 && (
            <>
              <button
                onClick={() =>
                  setCurrentImageIndex((prev) =>
                    prev === 0 ? productImages.length - 1 : prev - 1
                  )
                }
                className="absolute left-3 top-1/2 transform -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white rounded-full p-3 transition-all duration-200 shadow-lg"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <button
                onClick={() =>
                  setCurrentImageIndex((prev) =>
                    prev === productImages.length - 1 ? 0 : prev + 1
                  )
                }
                className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white rounded-full p-3 transition-all duration-200 shadow-lg"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>

              {/* Dots Indicator */}
              <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex space-x-2">
                {productImages.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`w-3 h-3 rounded-full transition-all duration-200 shadow-sm ${
                      idx === currentImageIndex
                        ? "bg-white scale-110"
                        : "bg-white/60 hover:bg-white/80"
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Məhsul məlumatları */}
      <div className="p-3 flex-grow flex flex-col">
        <div className="space-y-2 flex-grow">
          {/* Məhsul adı və brend */}
          <div>
            {product?.name && (
              <h3 className="text-sm font-bold text-gray-900 mb-1 line-clamp-2">
                {product.name}
              </h3>
            )}
            {product?.brand && (
              <p className="text-blue-600 font-semibold text-xs uppercase tracking-wide">
                {product.brand}
              </p>
            )}
          </div>

          {/* Qiymət */}
          {product?.price && (
            <div className="flex items-center space-x-2">
              {product?.discountedPrice ? (
                <>
                  <span className="text-lg font-bold text-red-600">
                    {product.discountedPrice.toString().endsWith('00') 
                      ? product.discountedPrice.toString().slice(0, -2) + '.' + product.discountedPrice.toString().slice(-2)
                      : (product.discountedPrice.toString().length === 3 && !product.discountedPrice.toString().endsWith('00')
                          ? product.discountedPrice + '.00'
                          : product.discountedPrice)} AZN
                  </span>
                  <span className="text-sm text-gray-400 line-through">
                    {product.price.toString().endsWith('00') 
                      ? product.price.toString().slice(0, -2) + '.' + product.price.toString().slice(-2)
                      : (product.price.toString().length === 3 && !product.price.toString().endsWith('00')
                          ? product.price + '.00'
                          : product.price)} AZN
                  </span>
                  <span className="bg-red-100 text-red-600 px-2 py-1 rounded-full text-xs font-bold">
                    -
                    {Math.round(
                      ((product.price - product.discountedPrice) /
                        product.price) *
                        100
                    )}
                    %
                  </span>
                </>
              ) : (
                <span className="text-lg font-bold text-green-600">
                  {product.price.toString().endsWith('00') 
                    ? product.price.toString().slice(0, -2) + '.' + product.price.toString().slice(-2)
                    : (product.price.toString().length === 3 && !product.price.toString().endsWith('00')
                        ? product.price + '.00'
                        : product.price)} AZN
                </span>
              )}
            </div>
          )}

          {/* Təsvir */}
          <div className="h-16 flex items-start">
            <p className="text-gray-600 text-sm leading-relaxed line-clamp-3 w-full">
              {product?.description || ''}
            </p>
          </div>

          {/* Rənglər */}
          {product?.colors && product.colors.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-700 mb-1">
                Rənglər:
              </h4>
              <div className="flex flex-wrap gap-1">
                {product.colors.map((color, colorIndex) => {
                  const hexColor = typeof color === 'object' ? color.hex : (color.startsWith('#') ? color : '#' + color);
                  return (
                    <div
                      key={colorIndex}
                      className="w-4 h-4 rounded-full border border-gray-300 shadow-sm"
                      style={{ backgroundColor: hexColor }}
                      title={typeof color === 'object' ? color.name : color}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Ölçülər */}
          {product?.sizes && product.sizes.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">
                Ölçülər:
              </h4>
              <div className="flex flex-wrap gap-2 max-h-16 overflow-y-auto">
                {availableSizes.map((size, sizeIndex) => (
                  <span
                    key={sizeIndex}
                    className="bg-green-50 text-green-700 px-3 py-1 rounded-lg text-sm font-medium border border-green-200 flex items-center"
                  >
                    {size.sizeName}
                    <svg
                      className="w-3 h-3 ml-1"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                ))}
                {outOfStockSizes.map((size, sizeIndex) => (
                  <span
                    key={sizeIndex}
                    className="bg-gray-100 text-gray-400 px-3 py-1 rounded-lg text-sm line-through border border-gray-200"
                  >
                    {size.sizeName}
                  </span>
                ))}
              </div>
              {availableSizes.length === 0 && (
                <p className="text-red-500 text-sm font-medium">
                  Bütün ölçülər bitib
                </p>
              )}
            </div>
          )}

        </div>
        
        {/* Sticky Footer - Mağaza məlumatları */}
        <div className="border-t pt-3 mt-3 bg-gray-50">
          {(product?.storeName || product?.storeInfo?.name) && (
            <div className="mb-2">
              <span className="text-sm text-gray-500">Mağaza:</span>
              <span className="ml-2 text-sm font-semibold text-gray-800">
                {product.storeName || product.storeInfo?.name}
              </span>
            </div>
          )}
          {(product?.storeAddress || product?.storeInfo?.address) && (
            <div className="mb-3">
              <span className="text-sm text-gray-500">Ünvan:</span>
              <span className="ml-2 text-sm text-gray-700">
                {product.storeAddress || product.storeInfo?.address}
              </span>
            </div>
          )}

          {/* Əlaqə düyməsi */}
          {(product?.storePhone ||
            product?.phone ||
            product?.contact ||
            product?.storeInfo?.phone) && (
            <button
              onClick={() => {
                const phone =
                  product.storePhone ||
                  product.phone ||
                  product.contact ||
                  product.storeInfo?.phone;
                if (phone) {
                  window.open(`tel:${phone}`, "_self");
                }
              }}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg text-sm"
            >
              <div className="flex items-center justify-center space-x-2">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                <span>
                  📞{" "}
                  {product.storePhone ||
                    product.phone ||
                    product.contact ||
                    product.storeInfo?.phone}
                </span>
              </div>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default StoreList;