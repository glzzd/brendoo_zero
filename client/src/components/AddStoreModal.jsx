import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../utils/apiClient';
import { STORE_CATEGORIES } from '../const/categories';
import { toast } from 'sonner';

const AddStoreModal = ({ isOpen, onClose, onStoreAdded }) => {
  const { token } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    logo: null,
    website: ''
  });
  const [loading, setLoading] = useState(false);
  const [logoPreview, setLogoPreview] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast.error('Logo ölçüsü 2MB-dan çox ola bilməz');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64String = event.target.result;
        setFormData(prev => ({ ...prev, logo: base64String }));
        setLogoPreview(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await apiClient.post('/api/v1/store/add-store', formData);

      if (response.ok) {
        const result = await response.json();
        onStoreAdded(result.data);
        onClose();
        // Reset form
        setFormData({
          name: '',
          description: '',
          category: '',
          logo: null,
          website: ''
        });
        setLogoPreview('');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Mağaza əlavə edilərkən xəta baş verdi');
      }
    } catch (error) {
      console.error('Error adding store:', error);
      toast.error('Mağaza əlavə edilərkən xəta baş verdi');
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
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Yeni Mağaza Əlavə Et</h2>
          <Button variant="ghost" onClick={onClose}>
            ✕
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Logo Upload */}
          <div>
            <Label htmlFor="logo">Mağaza Loqosu</Label>
            <Input
              id="logo"
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="mt-1"
            />
            {logoPreview && (
              <div className="mt-2">
                <img
                  src={logoPreview}
                  alt="Logo preview"
                  className="w-20 h-20 object-cover rounded border"
                />
              </div>
            )}
          </div>

          {/* Store Name */}
          <div>
            <Label htmlFor="name">Mağaza Adı *</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="mt-1"
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Təsvir</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="mt-1"
              rows={3}
            />
          </div>

          {/* Category */}
          <div>
            <Label htmlFor="category">Kateqoriya *</Label>
            <Select onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Kateqoriya seçin" />
              </SelectTrigger>
              <SelectContent>
                {STORE_CATEGORIES.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Website */}
          <div>
            <Label htmlFor="website">Veb sayt</Label>
            <Input
              id="website"
              name="website"
              value={formData.website}
                onChange={handleInputChange}
              className="mt-1"
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Ləğv et
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Əlavə edilir...' : 'Mağaza Əlavə Et'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddStoreModal;