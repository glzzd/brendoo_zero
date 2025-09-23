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
import EditStoreModal from "../../components/EditStoreModal";
import apiClient from "../../utils/apiClient";
import { STORE_CATEGORIES } from "../../const/categories";
import {
  Edit,
  Trash2,
  Trash,
  ChevronDown,
  ChevronUp,
  Store,
  Globe,
  Calendar,
  Tag,
  Search,
  Filter,
  SortAsc,
  SortDesc,
  Eye,
  ExternalLink,
  MoreVertical,
  Star,
  TrendingUp,
  Activity,
  Users,
  Package
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
  const [itemsPerPage] = useState(8);
  const [pagination, setPagination] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
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

  useEffect(() => {
    fetchStores(currentPage);
  }, [currentPage, searchTerm, filters, sortField, sortDirection]);

  const fetchStores = async (page = 1) => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: itemsPerPage.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(filters.category && { category: filters.category }),
        ...(filters.status && { status: filters.status }),
        ...(sortField && { sortBy: sortField }),
        ...(sortDirection && { sortOrder: sortDirection }),
      });

      const response = await fetch(`http://localhost:5001/api/v1/store?${queryParams}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const result = await response.json();
        setStores(result.data || []);
        setPagination(result.pagination || {});
      } else {
        console.error("Failed to fetch stores");
        toast.error("Mağazalar yüklənərkən xəta baş verdi");
      }
    } catch (error) {
      console.error("Error fetching stores:", error);
      toast.error("Mağazalar yüklənərkən xəta baş verdi");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("az-AZ", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getCategoryName = (categoryKey) => {
    const category = STORE_CATEGORIES.find((cat) => cat.key === categoryKey);
    return category ? category.name : categoryKey;
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleSelectStore = (storeId) => {
    setSelectedStores((prev) =>
      prev.includes(storeId)
        ? prev.filter((id) => id !== storeId)
        : [...prev, storeId]
    );
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedStores([]);
    } else {
      setSelectedStores(stores.map((store) => store._id));
    }
    setSelectAll(!selectAll);
  };

  const toggleRowExpansion = (storeId) => {
    setExpandedRows((prev) =>
      prev.includes(storeId)
        ? prev.filter((id) => id !== storeId)
        : [...prev, storeId]
    );
  };

  const handleStatusChange = async (storeId, newStatus) => {
    try {
      const response = await fetch(`http://localhost:5001/api/v1/store/${storeId}/status`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      if (response.ok) {
        setStores((prevStores) =>
          prevStores.map((store) =>
            store._id === storeId ? { ...store, status: newStatus } : store
          )
        );
        toast.success("Status uğurla yeniləndi");
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

  const openEditModal = (storeId) => {
    setEditStoreId(storeId);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditStoreId(null);
  };

  const handleStoreUpdated = (updatedStore) => {
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
        const response = await fetch("http://localhost:5001/api/v1/store/bulk-delete", {
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
        const response = await fetch(`http://localhost:5001/api/v1/store/${deletingStoreId}`, {
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

  const totalPages = pagination.totalPages || 1;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Header with Gradient and Animation */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-2xl p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                Mağazalar
              </h1>
              <p className="text-blue-100 text-lg">
                Sistemdəki bütün mağazaları idarə edin və izləyin
              </p>
              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center gap-2 bg-white/20 rounded-lg px-3 py-1">
                  <Activity className="h-4 w-4" />
                  <span className="text-sm font-medium">{stores.length} Mağaza</span>
                </div>
                <div className="flex items-center gap-2 bg-white/20 rounded-lg px-3 py-1">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    {stores.filter(store => store.status === 'active').length} Aktiv
                  </span>
                </div>
              </div>
            </div>
            <Button
              onClick={() => setIsModalOpen(true)}
              className="bg-white text-blue-600 hover:bg-blue-50 font-semibold px-8 py-4 text-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              <Store className="h-6 w-6 mr-3" />
              Yeni Mağaza Əlavə Et
            </Button>
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>
      </div>

      {/* Enhanced Stats Cards with Icons and Animations */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-green-50 to-emerald-100 border-green-200 hover:shadow-lg transition-all duration-200 group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-green-600 text-sm font-medium">Aktiv Mağazalar</p>
                <p className="text-3xl font-bold text-green-700 group-hover:scale-110 transition-transform duration-200">
                  {stores.filter(store => store.status === 'active').length}
                </p>
                <p className="text-xs text-green-500">
                  +{Math.round((stores.filter(store => store.status === 'active').length / stores.length) * 100)}% aktiv
                </p>
              </div>
              <div className="bg-green-500 p-3 rounded-full group-hover:rotate-12 transition-transform duration-200">
                <Store className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-cyan-100 border-blue-200 hover:shadow-lg transition-all duration-200 group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-blue-600 text-sm font-medium">Toplam Mağaza</p>
                <p className="text-3xl font-bold text-blue-700 group-hover:scale-110 transition-transform duration-200">
                  {stores.length}
                </p>
                <p className="text-xs text-blue-500">Bütün mağazalar</p>
              </div>
              <div className="bg-blue-500 p-3 rounded-full group-hover:rotate-12 transition-transform duration-200">
                <Package className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-violet-100 border-purple-200 hover:shadow-lg transition-all duration-200 group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-purple-600 text-sm font-medium">Kateqoriyalar</p>
                <p className="text-3xl font-bold text-purple-700 group-hover:scale-110 transition-transform duration-200">
                  {new Set(stores.map(store => store.category)).size}
                </p>
                <p className="text-xs text-purple-500">Müxtəlif sahələr</p>
              </div>
              <div className="bg-purple-500 p-3 rounded-full group-hover:rotate-12 transition-transform duration-200">
                <Tag className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-amber-100 border-orange-200 hover:shadow-lg transition-all duration-200 group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-orange-600 text-sm font-medium">Deaktiv</p>
                <p className="text-3xl font-bold text-orange-700 group-hover:scale-110 transition-transform duration-200">
                  {stores.filter(store => store.status === 'inactive').length}
                </p>
                <p className="text-xs text-orange-500">Bağlı mağazalar</p>
              </div>
              <div className="bg-orange-500 p-3 rounded-full group-hover:rotate-12 transition-transform duration-200">
                <Users className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Search and Filter Section */}
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  type="text"
                  placeholder="Mağaza adı ilə axtarın..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-3 border-2 border-gray-200 focus:border-blue-500 rounded-xl text-lg"
                />
              </div>
            </div>
            
            <div className="flex gap-3 flex-wrap">
              {/* Category Filter */}
              <div className="relative">
                <select
                  value={filters.category}
                  onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                  className="appearance-none bg-white border-2 border-gray-200 rounded-xl px-4 py-3 pr-10 focus:border-blue-500 focus:outline-none text-sm font-medium"
                >
                  <option value="">Bütün Kateqoriyalar</option>
                  {STORE_CATEGORIES.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
                <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 pointer-events-none" />
              </div>

              {/* Status Filter */}
              <div className="relative">
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="appearance-none bg-white border-2 border-gray-200 rounded-xl px-4 py-3 pr-10 focus:border-blue-500 focus:outline-none text-sm font-medium"
                >
                  <option value="">Bütün Statuslar</option>
                  <option value="active">Aktiv</option>
                  <option value="inactive">Deaktiv</option>
                </select>
                <Activity className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 pointer-events-none" />
              </div>

              {/* Sort Options */}
              <Button
                variant="outline"
                onClick={() => {
                  setSortField(sortField === 'name' ? '' : 'name');
                  setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                }}
                className="border-2 border-gray-200 hover:border-blue-500 px-4 py-3 rounded-xl"
              >
                {sortDirection === 'asc' ? <SortAsc className="h-4 w-4 mr-2" /> : <SortDesc className="h-4 w-4 mr-2" />}
                Sırala
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* Bulk Actions */}
          {selectedStores.length > 0 && (
            <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    {selectedStores.length}
                  </div>
                  <span className="text-blue-700 font-medium">
                    mağaza seçildi
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeletingStoreId("bulk")}
                  className="text-red-600 hover:text-red-700 border-red-300 hover:border-red-400 hover:bg-red-50"
                >
                  <Trash className="h-4 w-4 mr-2" />
                  Seçilənləri Sil
                </Button>
              </div>
            </div>
          )}

          {/* Enhanced Stores Grid */}
          {stores.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 p-8">
              {stores.map((store) => (
                <Card key={store._id} className="group hover:shadow-2xl transition-all duration-300 border-2 hover:border-blue-300 bg-white hover:bg-gradient-to-br hover:from-white hover:to-blue-50 transform hover:-translate-y-2">
                  <CardContent className="p-0 relative overflow-hidden">
                    {/* Store Header with Enhanced Design */}
                    <div className="relative p-6 bg-gradient-to-br from-gray-50 via-white to-gray-100">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                          <Checkbox
                            checked={selectedStores.includes(store._id)}
                            onCheckedChange={() => handleSelectStore(store._id)}
                            className="z-20 scale-110"
                          />
                          <div 
                            className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm cursor-pointer hover:scale-105 transition-transform ${
                              store.status === "active"
                                ? "bg-gradient-to-r from-green-400 to-emerald-500 text-white hover:from-green-500 hover:to-emerald-600"
                                : "bg-gradient-to-r from-red-400 to-rose-500 text-white hover:from-red-500 hover:to-rose-600"
                            }`}
                            onClick={() => handleStatusChange(store._id, store.status === "active" ? "inactive" : "active")}
                            title={`Statusu ${store.status === "active" ? "deaktiv" : "aktiv"} et`}
                          >
                            {store.status === "active" ? "✓ Aktiv" : "✗ Deaktiv"}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          {store.logo ? (
                            <div className="relative">
                              <img
                                src={store.logo}
                                alt={store.name}
                                className="w-16 h-16 rounded-2xl object-cover border-3 border-white shadow-lg group-hover:scale-110 transition-transform duration-300"
                              />
                              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            </div>
                          ) : (
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                              <Store className="h-8 w-8 text-white" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-gray-900 truncate text-lg group-hover:text-blue-600 transition-colors duration-200">
                              {store.name}
                            </h3>
                            <p className="text-sm text-gray-500 truncate font-medium">
                              {getCategoryName(store.category)}
                            </p>
                            <div className="flex items-center gap-1 mt-1">
                              <Star className="h-3 w-3 text-yellow-400 fill-current" />
                              <span className="text-xs text-gray-400">4.5</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Enhanced Store Details */}
                    <div className="p-6 space-y-4">
                      {store.description && (
                        <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">
                          {store.description}
                        </p>
                      )}
                      
                      <div className="space-y-3">
                        {store.website && (
                          <div className="flex items-center gap-3 text-sm group/link">
                            <div className="bg-blue-100 p-2 rounded-lg group-hover/link:bg-blue-200 transition-colors duration-200">
                              <Globe className="h-4 w-4 text-blue-600" />
                            </div>
                            <a
                              href={store.website.startsWith("http") ? store.website : `https://${store.website}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 truncate font-medium flex-1 group-hover/link:underline"
                            >
                              {store.website}
                            </a>
                            <ExternalLink className="h-3 w-3 text-gray-400 group-hover/link:text-blue-600" />
                          </div>
                        )}
                        
                        <div className="flex items-center gap-3 text-sm text-gray-500">
                          <div className="bg-gray-100 p-2 rounded-lg">
                            <Calendar className="h-4 w-4" />
                          </div>
                          <span className="font-medium">{formatDate(store.createdAt)}</span>
                        </div>
                      </div>

                      {/* Enhanced Action Buttons */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditStoreId(store._id);
                              setIsEditModalOpen(true);
                            }}
                            className="hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-all duration-200"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Düzəliş
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeletingStoreId(store._id)}
                            className="hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-all duration-200"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Sil
                          </Button>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Hover Effect Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="bg-gray-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                <Store className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Mağaza tapılmadı</h3>
              <p className="text-gray-500 mb-6">Axtarış kriteriyalarınıza uyğun mağaza yoxdur.</p>
              <Button
                onClick={() => {
                  setSearchTerm("");
                  setFilters({ category: "", status: "" });
                }}
                variant="outline"
                className="border-2 border-gray-300 hover:border-blue-500"
              >
                Filtri Təmizlə
              </Button>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-6 border-t bg-gray-50">
              <div className="flex justify-center items-center gap-2">
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

              <div className="mt-4 text-sm text-gray-600 text-center">
                {pagination.totalDocs || 0} mağazadan{" "}
                {(currentPage - 1) * itemsPerPage + 1}-
                {Math.min(currentPage * itemsPerPage, pagination.totalDocs || 0)}{" "}
                arası göstərilir
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <AddStoreModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onStoreAdded={(newStore) => {
          fetchStores(currentPage);
          setIsModalOpen(false);
        }}
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
    </div>
  );
};

export default StoreList;