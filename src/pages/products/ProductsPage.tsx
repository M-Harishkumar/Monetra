import React, { useState, useEffect } from 'react';
import { Package, Plus, Search, Tag, Check, Layers, DollarSign } from 'lucide-react';
import { api, formatCurrency } from '../../services/api.ts';
import { Badge, getStatusBadgeVariant } from '../../components/common/Badge.tsx';
import { Modal } from '../../components/common/Modal.tsx';
import { useAuth } from '../../context/AuthContext.tsx';

export const ProductsPage: React.FC = () => {
  const { role } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [form, setForm] = useState({
    name: '',
    type: 'software',
    salesPrice: '',
    costPrice: '',
    description: '',
    variants: [
      { name: 'Standard / Community', additionalPrice: 0, isDefault: true },
      { name: 'Enterprise Edition', additionalPrice: 560, isDefault: false },
    ],
  });

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      const data = await api.getProducts();
      setProducts(data);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createProduct({
        ...form,
        salesPrice: Number(form.salesPrice),
        costPrice: Number(form.costPrice || 0),
      });
      setIsModalOpen(false);
      setForm({
        name: '',
        type: 'software',
        salesPrice: '',
        costPrice: '',
        description: '',
        variants: [
          { name: 'Standard / Community', additionalPrice: 0, isDefault: true },
          { name: 'Enterprise Edition', additionalPrice: 560, isDefault: false },
        ],
      });
      await loadProducts();
    } catch (err: any) {
      alert(err.message || 'Failed to create product.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 font-heading">
            Products & Tier Variants
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Define recurring software modules, add-ons, and pricing tier variants with cost margins.
          </p>
        </div>

        {role === 'ADMIN' && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add New Product
          </button>
        )}
      </div>

      {/* Product Catalog Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {products.map(p => (
          <div
            key={p.id}
            className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600 bg-teal-50 px-2 py-0.5 rounded-sm border border-teal-200/60">
                    {p.type}
                  </span>
                  <h3 className="mt-2 text-base font-bold text-slate-900 font-heading">{p.name}</h3>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-slate-900 font-tabular-nums">
                    {formatCurrency(p.salesPrice)}
                  </span>
                  <p className="text-[10px] text-slate-400">Base Unit Price</p>
                </div>
              </div>

              <p className="mt-2.5 text-xs text-slate-600 line-clamp-2">
                {p.description || 'Enterprise module for automated subscription processing.'}
              </p>

              {/* Variants Pill List */}
              <div className="mt-4 pt-3 border-t border-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Tier Variants & Modifiers:
                </span>
                <div className="mt-2 space-y-1.5">
                  {(p.variants && p.variants.length > 0
                    ? p.variants
                    : [
                        { name: 'Basic Edition', additionalPrice: 0 },
                        { name: 'Enterprise Edition', additionalPrice: 560 },
                      ]
                  ).map((v: any, vIdx: number) => (
                    <div
                      key={vIdx}
                      className="flex items-center justify-between rounded-md bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 border border-slate-100"
                    >
                      <span className="font-medium">{v.name}</span>
                      <span className="font-mono text-[11px] font-bold text-teal-700">
                        {v.additionalPrice > 0 ? `+${formatCurrency(v.additionalPrice)}` : 'Included (₹0)'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
              <span>Status: <strong className="text-emerald-600 font-semibold">{p.status}</strong></span>
              <span>Margin: <strong className="text-slate-700 font-semibold">{p.costPrice ? `${Math.round(((p.salesPrice - p.costPrice) / p.salesPrice) * 100)}%` : '85%'}</strong></span>
            </div>
          </div>
        ))}
      </div>

      {/* Add Product Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New SaaS Product"
        description="Configure pricing, type, cost, and add-on variant pricing."
      >
        <form onSubmit={handleAddProduct} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Product Title *</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Real-Time Telemetry & Sentinel"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Product Type</label>
              <select
                value={form.type}
                onChange={e => setForm({ ...form, type: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500"
              >
                <option value="software">Software</option>
                <option value="service">Service</option>
                <option value="addon">Add-on</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Sales Price (₹) *</label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={form.salesPrice}
                onChange={e => setForm({ ...form, salesPrice: e.target.value })}
                placeholder="2499.00"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Cost Price (₹)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.costPrice}
                onChange={e => setForm({ ...form, costPrice: e.target.value })}
                placeholder="400.00"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              rows={2}
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Enterprise capabilities included in this package..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-teal-600 px-5 py-2 text-xs font-bold text-white hover:bg-teal-700"
            >
              Save Product
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
