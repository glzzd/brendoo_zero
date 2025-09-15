import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../utils/apiClient';
import { toast } from 'sonner';
import { X, Plus, Trash2, ChevronDown, ChevronUp, Edit, Trash } from 'lucide-react';

// EditEndpointForm Component
const EditEndpointForm = ({ endpoint, onUpdate, onCancel }) => {
  const [formData, setFormData] = useState({
    name: endpoint.name || '',
    url: endpoint.url || '',
    method: endpoint.method || 'GET',
    description: endpoint.description || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.url || !formData.method) {
      toast.error('Ad, URL və metod tələb olunur');
      return;
    }
    onUpdate(endpoint._id, formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="edit-name">Ad</Label>
        <Input
          id="edit-name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Endpoint adı"
          required
        />
      </div>
      
      <div>
        <Label htmlFor="edit-url">URL</Label>
        <Input
          id="edit-url"
          value={formData.url}
          onChange={(e) => setFormData({ ...formData, url: e.target.value })}
          placeholder="/api/endpoint"
          required
        />
      </div>
      
      <div>
        <Label htmlFor="edit-method">Metod</Label>
        <Select value={formData.method} onValueChange={(value) => setFormData({ ...formData, method: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="GET">GET</SelectItem>
            <SelectItem value="POST">POST</SelectItem>
            <SelectItem value="PUT">PUT</SelectItem>
            <SelectItem value="DELETE">DELETE</SelectItem>
            <SelectItem value="PATCH">PATCH</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Label htmlFor="edit-description">Təsvir</Label>
        <Textarea
          id="edit-description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Endpoint təsviri (ixtiyari)"
          rows={3}
        />
      </div>
      
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Ləğv et
        </Button>
        <Button type="submit">
          Yenilə
        </Button>
      </div>
    </form>
  );
};

const AddEndpointModal = ({ isOpen, onClose, storeId, storeName, onEndpointAdded }) => {
  const { token } = useAuth();
  const [endpoints, setEndpoints] = useState([
    { name: '', url: '', method: 'GET', description: '' }
  ]);
  const [loading, setLoading] = useState(false);
  const [existingEndpoints, setExistingEndpoints] = useState([]);
  const [showExistingEndpoints, setShowExistingEndpoints] = useState(false);
  const [editingEndpoint, setEditingEndpoint] = useState(null);
  const [deletingEndpoint, setDeletingEndpoint] = useState(null);

  useEffect(() => {
    if (isOpen && storeId) {
      fetchExistingEndpoints();
    }
  }, [isOpen, storeId]);

  const fetchExistingEndpoints = async () => {
    try {
      const response = await fetch(`/api/v1/store/${storeId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        setExistingEndpoints(result.data.endpoints || []);
      }
    } catch (error) {
      console.error('Error fetching existing endpoints:', error);
    }
  };

  const confirmDeleteEndpoint = async () => {
    if (!deletingEndpoint) return;

    try {
      const response = await fetch(`/api/v1/store/${storeId}/endpoint/${deletingEndpoint}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        fetchExistingEndpoints();
        toast.success('Endpoint uğurla silindi');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Endpoint silinərkən xəta baş verdi');
      }
    } catch (error) {
      console.error('Error deleting endpoint:', error);
      toast.error('Endpoint silinərkən xəta baş verdi');
    } finally {
      setDeletingEndpoint(null);
    }
  };

  const handleEditEndpoint = (endpoint) => {
    setEditingEndpoint(endpoint);
  };

  const handleUpdateEndpoint = async (endpointId, updatedData) => {
    try {
      const response = await fetch(`/api/v1/store/${storeId}/endpoint/${endpointId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedData)
      });

      if (response.ok) {
        fetchExistingEndpoints();
        setEditingEndpoint(null);
        toast.success('Endpoint uğurla yeniləndi');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Endpoint yeniləməkdə xəta baş verdi');
      }
    } catch (error) {
      console.error('Error updating endpoint:', error);
      toast.error('Endpoint yeniləməkdə xəta baş verdi');
    }
  };

  const handleCancelEdit = () => {
    setEditingEndpoint(null);
  };

  const handleEndpointChange = (index, field, value) => {
    const updatedEndpoints = [...endpoints];
    updatedEndpoints[index][field] = value;
    setEndpoints(updatedEndpoints);
  };

  const addEndpoint = () => {
    setEndpoints([...endpoints, { name: '', url: '', method: 'GET', description: '' }]);
  };

  const removeEndpoint = (index) => {
    if (endpoints.length > 1) {
      const updatedEndpoints = endpoints.filter((_, i) => i !== index);
      setEndpoints(updatedEndpoints);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Form validasiyası
    for (let i = 0; i < endpoints.length; i++) {
      const endpoint = endpoints[i];
      if (!endpoint.name || !endpoint.url) {
        toast.error(`Endpoint ${i + 1}: Ad və URL tələb olunur`);
        return;
      }
      if (!endpoint.method) {
        toast.error(`Endpoint ${i + 1}: HTTP metod tələb olunur`);
        return;
      }
    }
    
    setLoading(true);

    try {
      const response = await fetch(`/api/v1/store/${storeId}/endpoint`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ endpoints })
      });

      if (response.ok) {
        const result = await response.json();
        toast.success('Endpoint(lər) uğurla əlavə edildi!');
        onEndpointAdded && onEndpointAdded(result.data);
        onClose();
        setEndpoints([{ name: '', url: '', method: 'GET', description: '' }]);
      } else {
        const error = await response.json();
        toast.error(error.message || 'Endpoint əlavə edilərkən xəta baş verdi');
      }
    } catch (error) {
      console.error('Error adding endpoints:', error);
      toast.error(error.message || 'Endpoint əlavə edilərkən xəta baş verdi');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">{storeName} - Endpoint Əlavə Et</h2>
          <Button variant="ghost" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Existing Endpoints Accordion */}
        {existingEndpoints.length > 0 && (
          <div className="mb-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowExistingEndpoints(!showExistingEndpoints)}
              className="w-full flex justify-between items-center"
            >
              <span>Mövcud Endpoint'lər ({existingEndpoints.length})</span>
              {showExistingEndpoints ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            
            {showExistingEndpoints && (
              <div className="mt-4 space-y-3 max-h-60 overflow-y-auto">
                {existingEndpoints.map((endpoint, index) => (
                  <div key={endpoint._id || index} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold">{endpoint.name}</span>
                          <span className={`px-2 py-1 text-xs rounded ${
                            endpoint.method === 'GET' ? 'bg-green-100 text-green-800' :
                            endpoint.method === 'POST' ? 'bg-blue-100 text-blue-800' :
                            endpoint.method === 'PUT' ? 'bg-yellow-100 text-yellow-800' :
                            endpoint.method === 'DELETE' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {endpoint.method}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">{endpoint.url}</p>
                        {endpoint.description && (
                          <p className="text-sm text-gray-500">{endpoint.description}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditEndpoint(endpoint)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setDeletingEndpoint(endpoint._id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Edit Endpoint Modal */}
        {editingEndpoint && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Endpoint Düzənlə</h3>
                <Button variant="ghost" onClick={handleCancelEdit}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <EditEndpointForm
                endpoint={editingEndpoint}
                onUpdate={handleUpdateEndpoint}
                onCancel={handleCancelEdit}
              />
            </div>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deletingEndpoint} onOpenChange={() => setDeletingEndpoint(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Endpoint Sil</AlertDialogTitle>
              <AlertDialogDescription>
                Bu endpoint-i silmək istədiyinizdən əminsiniz? Bu əməliyyat geri qaytarıla bilməz.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Ləğv et</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteEndpoint} className="bg-red-600 hover:bg-red-700">
                Sil
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <form onSubmit={handleSubmit} className="space-y-6">
          {endpoints.map((endpoint, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Endpoint {index + 1}</h3>
                {endpoints.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeEndpoint(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`name-${index}`}>Endpoint Adı *</Label>
                  <Input
                    id={`name-${index}`}
                    value={endpoint.name}
                    onChange={(e) => handleEndpointChange(index, 'name', e.target.value)}
                    required
                    className="mt-1"
                    placeholder="məs: Get Users"
                  />
                </div>

                <div>
                  <Label htmlFor={`method-${index}`}>HTTP Method</Label>
                  <Select value={endpoint.method} onValueChange={(value) => handleEndpointChange(index, 'method', value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="HTTP metod seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GET">GET</SelectItem>
                      <SelectItem value="POST">POST</SelectItem>
                      <SelectItem value="PUT">PUT</SelectItem>
                      <SelectItem value="DELETE">DELETE</SelectItem>
                      <SelectItem value="PATCH">PATCH</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor={`url-${index}`}>Endpoint URL *</Label>
                <Input
                  id={`url-${index}`}
                  value={endpoint.url}
                  onChange={(e) => handleEndpointChange(index, 'url', e.target.value)}
                  required
                  className="mt-1"
                  placeholder="məs: /api/users"
                />
              </div>

              <div>
                <Label htmlFor={`description-${index}`}>Təsvir</Label>
                <Textarea
                  id={`description-${index}`}
                  value={endpoint.description}
                  onChange={(e) => handleEndpointChange(index, 'description', e.target.value)}
                  className="mt-1"
                  placeholder="Endpoint haqqında qısa məlumat (ixtiyari)"
                  rows={3}
                />
              </div>
            </div>
          ))}

          <div className="flex justify-center">
            <Button
              type="button"
              variant="outline"
              onClick={addEndpoint}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Yeni Endpoint Əlavə Et
            </Button>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Ləğv et
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Əlavə edilir...' : 'Endpoint(lər) Əlavə Et'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEndpointModal;