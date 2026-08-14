'use client';

import * as React from 'react';
import { Plus, Pencil, Trash2, UtensilsCrossed } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Input, Textarea, Label, Select } from '@/components/ui/input';
import { SkeletonCard } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toaster';
import { formatCurrency, cn } from '@/lib/utils';
import { FOOD_CATEGORIES } from '@/types';

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  preparationTime: number;
  available: number | boolean;
}

const emptyForm = {
  name: '',
  description: '',
  price: '',
  category: FOOD_CATEGORIES[0] as string,
  preparationTime: '10',
};

export default function MenuManagementPage() {
  const [items, setItems] = React.useState<MenuItem[] | null>(null);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<MenuItem | null>(null);
  const [form, setForm] = React.useState(emptyForm);
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<MenuItem | null>(null);
  const [deleting, setDeleting] = React.useState(false);
  const { toast } = useToast();

  const load = React.useCallback(async () => {
    const res = await fetch('/api/menu-items', { cache: 'no-store' });
    const json = await res.json();
    if (json.success) setItems(json.data.items);
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setError(null);
    setModalOpen(true);
  }

  function openEdit(item: MenuItem) {
    setEditing(item);
    setForm({
      name: item.name,
      description: item.description ?? '',
      price: String(item.price),
      category: item.category,
      preparationTime: String(item.preparationTime),
    });
    setError(null);
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const price = Number(form.price);
    const preparationTime = Number(form.preparationTime);
    if (!price || price <= 0) {
      setError('Enter a valid price.');
      return;
    }
    if (!preparationTime || preparationTime <= 0) {
      setError('Enter a valid preparation time.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name,
        description: form.description || undefined,
        price,
        category: form.category,
        preparationTime,
      };
      const res = await fetch(editing ? `/api/menu-items/${editing.id}` : '/api/menu-items', {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.message ?? 'Could not save this item.');
        return;
      }
      toast({ kind: 'success', title: editing ? 'Item updated' : 'Item added' });
      setModalOpen(false);
      load();
    } finally {
      setSaving(false);
    }
  }

  async function toggleAvailability(item: MenuItem) {
    setItems((prev) =>
      prev ? prev.map((i) => (i.id === item.id ? { ...i, available: !i.available } : i)) : prev
    );
    const res = await fetch(`/api/menu-items/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ available: !item.available }),
    });
    const json = await res.json();
    if (!json.success) {
      toast({ kind: 'error', title: 'Could not update availability' });
      load();
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/menu-items/${deleteTarget.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!json.success) {
        toast({ kind: 'error', title: 'Could not delete item', description: json.message });
        return;
      }
      toast({
        kind: 'success',
        title: json.data.hidden ? 'Item hidden' : 'Item deleted',
        description: json.data.hidden ? 'It has order history, so it was hidden instead of deleted.' : undefined,
      });
      load();
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Menu Management"
        description="Add dishes, update prices, and toggle availability instantly."
        action={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Add item
          </Button>
        }
      />

      {items === null ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <SkeletonCard /><SkeletonCard /><SkeletonCard />
        </div>
      ) : items.length === 0 ? (
        <EmptyState icon={UtensilsCrossed} title="No menu items yet" action={<Button onClick={openCreate}>Add your first item</Button>} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <div key={item.id} className="flex flex-col justify-between rounded-2xl border border-line bg-white p-4 shadow-card">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-ink-900">{item.name}</p>
                  <span className="shrink-0 rounded-full bg-ink-50 px-2 py-0.5 text-[11px] font-medium text-ink-400">
                    {item.category}
                  </span>
                </div>
                {item.description && <p className="mt-1 text-xs text-ink-400 line-clamp-2">{item.description}</p>}
                <p className="mt-2 font-display text-lg text-ink-900">{formatCurrency(item.price)}</p>
                <p className="text-xs text-ink-400">{item.preparationTime} min prep time</p>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <button
                  onClick={() => toggleAvailability(item)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
                    item.available ? 'bg-teal-50 text-teal-600' : 'bg-ink-50 text-ink-400'
                  )}
                >
                  <span className={cn('h-1.5 w-1.5 rounded-full', item.available ? 'bg-teal-400' : 'bg-ink-300')} />
                  {item.available ? 'Available' : 'Sold out'}
                </button>
                <div className="flex items-center gap-1">
                  <button onClick={() => openEdit(item)} aria-label={`Edit ${item.name}`} className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-50 hover:text-ink-900">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => setDeleteTarget(item)} aria-label={`Delete ${item.name}`} className="rounded-lg p-1.5 text-ink-400 hover:bg-red-50 hover:text-red-500">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit item' : 'Add menu item'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="item-name">Name</Label>
            <Input id="item-name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="item-desc">Description</Label>
            <Textarea id="item-desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="item-price">Price (₹)</Label>
              <Input id="item-price" type="number" min="1" step="1" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="item-prep">Prep time (min)</Label>
              <Input id="item-prep" type="number" min="1" step="1" required value={form.preparationTime} onChange={(e) => setForm({ ...form, preparationTime: e.target.value })} />
            </div>
          </div>
          <div>
            <Label htmlFor="item-category">Category</Label>
            <Select id="item-category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {FOOD_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" className="w-full" loading={saving}>
            {editing ? 'Save changes' : 'Add item'}
          </Button>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={`Delete "${deleteTarget?.name}"?`}
        description="If this item has order history, it will be hidden instead of permanently deleted."
        confirmLabel="Delete item"
        danger
        loading={deleting}
      />
    </div>
  );
}
