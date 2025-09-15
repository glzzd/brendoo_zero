import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../utils/apiClient';
import { STORE_CATEGORIES } from '../../const/categories';

const AddStore = () => {
  const navigate = useNavigate();
  const { token, refreshAccessToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    logo: null,
    website: ''
  });
  const [logoPreview, setLogoPreview] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
        setFormData(prev => ({ ...prev, logo: reader.result }));
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
        toast.success('Mağaza uğurla əlavə edildi!');
        navigate('/stores/list');
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

  return (
    <div className="container mx-auto py-6 px-4">
      <Card className="w-full  mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Yeni Mağaza Əlavə Et</CardTitle>
          <CardDescription>
            Yeni mağaza məlumatlarını daxil edin
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Logo Upload */}
            <div className="space-y-2">
              <Label htmlFor="logo">Mağaza Loqosu</Label>
              <Input
                id="logo"
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="w-full"
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

            <div className='flex gap-2'>

            <div className="space-y-2 flex-1">
              <Label htmlFor="name">Mağaza Adı *</Label>
              <Input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Mağaza adını daxil edin"
                required
                className="w-full"
                />
            </div>
<div className="space-y-2 flex-1">
              <Label htmlFor="category">Kateqoriya *</Label>
              <Select onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                <SelectTrigger className="w-full">
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
                </div>
            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Təsvir</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Mağaza haqqında qısa məlumat"
                rows={3}
                className="w-full"
              />
            </div>

        

            {/* Website */}
            <div className="space-y-2">
              <Label htmlFor="website">Veb sayt</Label>
              <Input
                id="website"
                name="website"
                value={formData.website}
                onChange={handleInputChange}
                placeholder="Veb sayt ünvanı"
                className="w-full"
              />
            </div>

            <div className="flex gap-4 pt-4">
             
          
               <Button
                type="submit"
                disabled={loading}
                className="flex-1"
              >
                {loading ? 'Əlavə edilir...' : 'Mağaza Əlavə Et'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddStore;