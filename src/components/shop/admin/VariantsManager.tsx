import React, { useState } from 'react';
import { Plus, Trash2, Package } from 'lucide-react';
import type { ProductVariant } from '../../../types/shop';

interface VariantsManagerProps {
  productId: string | null;
  variants: Partial<ProductVariant>[];
  onChange: (variants: Partial<ProductVariant>[]) => void;
}

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const COLORS = ['Zwart', 'Wit', 'Grijs', 'Geel', 'Rood', 'Blauw'];

export const VariantsManager: React.FC<VariantsManagerProps> = ({
  productId,
  variants,
  onChange,
}) => {
  const [newVariant, setNewVariant] = useState<Partial<ProductVariant>>({
    size: '',
    color: '',
    sku: '',
    price_adjustment: 0,
    stock_quantity: 0,
    low_stock_alert: 5,
    is_active: true,
  });

  const addVariant = () => {
    if (!newVariant.size && !newVariant.color) return;

    const name = [newVariant.size, newVariant.color].filter(Boolean).join(' - ');
    const variant: Partial<ProductVariant> = {
      ...newVariant,
      name,
      product_id: productId || undefined,
    };

    onChange([...variants, variant]);
    setNewVariant({
      size: '',
      color: '',
      sku: '',
      price_adjustment: 0,
      stock_quantity: 0,
      low_stock_alert: 5,
      is_active: true,
    });
  };

  const removeVariant = (index: number) => {
    onChange(variants.filter((_, i) => i !== index));
  };

  const updateVariant = (index: number, updates: Partial<ProductVariant>) => {
    const updated = [...variants];
    updated[index] = { ...updated[index], ...updates };

    // Update name if size/color changed
    if (updates.size !== undefined || updates.color !== undefined) {
      const v = updated[index];
      updated[index].name = [v.size, v.color].filter(Boolean).join(' - ');
    }

    onChange(updated);
  };

  const totalStock = variants.reduce((sum, v) => sum + (v.stock_quantity || 0), 0);
  const lowStockCount = variants.filter(v =>
    (v.stock_quantity || 0) <= (v.low_stock_alert || 5)
  ).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          <Package size={16} className="inline mr-1" />
          Varianten & Voorraad
        </label>
        <div className="text-sm text-gray-600">
          Totaal: {totalStock} stuks
          {lowStockCount > 0 && (
            <span className="ml-2 text-orange-600">({lowStockCount} laag)</span>
          )}
        </div>
      </div>

      {/* Existing Variants */}
      {variants.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          {variants.map((variant, index) => (
            <div key={index} className="flex items-center gap-3 bg-white p-3 rounded-lg shadow-sm">
              <div className="flex-1 grid grid-cols-2 md:grid-cols-5 gap-2">
                <select
                  value={variant.size || ''}
                  onChange={(e) => updateVariant(index, { size: e.target.value })}
                  className="px-2 py-1 border rounded text-sm text-gray-900"
                >
                  <option value="">Maat</option>
                  {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>

                <select
                  value={variant.color || ''}
                  onChange={(e) => updateVariant(index, { color: e.target.value })}
                  className="px-2 py-1 border rounded text-sm text-gray-900"
                >
                  <option value="">Kleur</option>
                  {COLORS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>

                <input
                  type="text"
                  value={variant.sku || ''}
                  onChange={(e) => updateVariant(index, { sku: e.target.value })}
                  placeholder="SKU"
                  className="px-2 py-1 border rounded text-sm text-gray-900"
                />

                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-500">+/-</span>
                  <input
                    type="number"
                    value={variant.price_adjustment || 0}
                    onChange={(e) => updateVariant(index, { price_adjustment: parseFloat(e.target.value) || 0 })}
                    step="0.01"
                    className="w-20 px-2 py-1 border rounded text-sm text-gray-900"
                  />
                </div>

                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-500">Voorraad:</span>
                  <input
                    type="number"
                    value={variant.stock_quantity || 0}
                    onChange={(e) => updateVariant(index, { stock_quantity: parseInt(e.target.value) || 0 })}
                    min="0"
                    className={`w-16 px-2 py-1 border rounded text-sm text-gray-900 ${
                      (variant.stock_quantity || 0) <= (variant.low_stock_alert || 5)
                        ? 'border-orange-400 bg-orange-50'
                        : ''
                    }`}
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => removeVariant(index)}
                className="p-1 text-red-600 hover:bg-red-50 rounded"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add New Variant */}
      <div className="flex items-center gap-3 p-3 border-2 border-dashed border-gray-300 rounded-lg">
        <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-2">
          <select
            value={newVariant.size || ''}
            onChange={(e) => setNewVariant({ ...newVariant, size: e.target.value })}
            className="px-2 py-1 border rounded text-sm text-gray-900"
          >
            <option value="">Maat</option>
            {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          <select
            value={newVariant.color || ''}
            onChange={(e) => setNewVariant({ ...newVariant, color: e.target.value })}
            className="px-2 py-1 border rounded text-sm text-gray-900"
          >
            <option value="">Kleur</option>
            {COLORS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <input
            type="number"
            value={newVariant.stock_quantity || 0}
            onChange={(e) => setNewVariant({ ...newVariant, stock_quantity: parseInt(e.target.value) || 0 })}
            placeholder="Voorraad"
            min="0"
            className="px-2 py-1 border rounded text-sm text-gray-900"
          />

          <input
            type="text"
            value={newVariant.sku || ''}
            onChange={(e) => setNewVariant({ ...newVariant, sku: e.target.value })}
            placeholder="SKU (optioneel)"
            className="px-2 py-1 border rounded text-sm text-gray-900"
          />
        </div>

        <button
          type="button"
          onClick={addVariant}
          disabled={!newVariant.size && !newVariant.color}
          className="p-2 bg-amber-400 hover:bg-amber-500 text-gray-900 rounded-lg disabled:opacity-50 transition-colors"
        >
          <Plus size={18} />
        </button>
      </div>
    </div>
  );
};
