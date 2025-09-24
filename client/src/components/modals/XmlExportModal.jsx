import React, { useState } from 'react';
import { X, Download, Store } from 'lucide-react';
import { toast } from 'sonner';

const XmlExportModal = ({ isOpen, onClose, stores }) => {
  const [selectedStore, setSelectedStore] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!selectedStore) {
      toast.error('Zəhmət olmasa mağaza seçin');
      return;
    }

    setIsExporting(true);
    try {
      const response = await fetch(`http://localhost:5001/api/v1/products-stock/export-xml?store=${selectedStore.toLowerCase()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/xml',
        },
      });

      if (!response.ok) {
        throw new Error('XML export uğursuz oldu');
      }

      const xmlData = await response.text();
      
      // XML faylını yükləmək üçün blob yaradırıq
      const blob = new Blob([xmlData], { type: 'application/xml' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${selectedStore}_products_${new Date().toISOString().split('T')[0]}.xml`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('XML fayl uğurla yükləndi');
      onClose();
    } catch (error) {
      console.error('XML export xətası:', error);
      toast.error('XML export zamanı xəta baş verdi');
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-2">
            <Download className="h-5 w-5 text-green-600" />
            <h2 className="text-lg font-semibold text-gray-900">XML Export</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Store className="h-4 w-4 inline mr-1" />
                Mağaza seçin
              </label>
              <select
                value={selectedStore}
                onChange={(e) => setSelectedStore(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Mağaza seçin...</option>
                {stores.map((store) => (
                  <option key={store._id} value={store.name}>
                    {store.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>Qeyd:</strong> Seçilən mağazanın bütün məhsulları XML formatında ixrac ediləcək.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Ləğv et
          </button>
          <button
            onClick={handleExport}
            disabled={!selectedStore || isExporting}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {isExporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                İxrac edilir...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                XML İxrac et
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default XmlExportModal;