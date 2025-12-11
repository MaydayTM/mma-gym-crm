import React, { useState } from 'react';
import { useProducts } from '../../../hooks/shop/useProducts';
import { ProductEditor } from './ProductEditor';
import type { Product } from '../../../types/shop';

export const ProductsManager: React.FC = () => {
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const { data: products, isLoading, refetch } = useProducts({ includeInactive: true });

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setShowEditor(true);
  };

  const handleNew = () => {
    setEditingProduct(null);
    setShowEditor(true);
  };

  const handleClose = () => {
    setShowEditor(false);
    setEditingProduct(null);
    refetch();
  };

  if (isLoading) {
    return <div className="text-center py-8 text-gray-400">Laden...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Producten</h2>
        <button
          onClick={handleNew}
          className="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-gray-900 font-bold rounded-lg transition-colors"
        >
          + Nieuw Product
        </button>
      </div>

      <div className="bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 overflow-hidden">
        <table className="w-full">
          <thead className="bg-white/5 border-b border-white/10">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Product</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Categorie</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Prijs</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Variants</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Acties</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {products?.map(product => (
              <tr key={product.id} className="hover:bg-white/5 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/10 rounded overflow-hidden">
                      {product.featured_image && (
                        <img src={product.featured_image} alt={product.name} className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-white">{product.name}</p>
                      <p className="text-sm text-gray-400">{product.seo_slug}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-300">{product.category}</td>
                <td className="px-4 py-3 text-sm text-gray-300">€{product.base_price.toFixed(2)}</td>
                <td className="px-4 py-3 text-sm text-gray-300">{product.variants?.length || 0}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    product.is_active ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                  }`}>
                    {product.is_active ? 'Actief' : 'Inactief'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleEdit(product)}
                    className="text-amber-400 hover:text-amber-300 font-medium text-sm transition-colors"
                  >
                    Bewerken
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {products?.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            Nog geen producten. Maak je eerste product aan!
          </div>
        )}
      </div>

      {showEditor && (
        <ProductEditor
          product={editingProduct}
          onClose={handleClose}
        />
      )}
    </div>
  );
};
