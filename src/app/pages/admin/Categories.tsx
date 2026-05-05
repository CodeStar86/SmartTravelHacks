import { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { categoryApi } from '../../lib/api';
import { cleanupLegacyAICategories, filterLegacyAICategories } from '../../lib/category-utils';

import { logger } from '../../lib/logger';
interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  created_at: string;
}

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
  });

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    try {
      setLoading(true);
      await cleanupLegacyAICategories(categoryApi.list, categoryApi.delete);
      const data = await categoryApi.list();
      setCategories(filterLegacyAICategories(data || []));
    } catch (error: any) {
      logger.error('Failed to load categories:', error);
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  }

  function handleInputChange(field: string, value: string) {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      if (field === 'name' && !editingId) {
        newData.slug = value
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');
      }
      
      return newData;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Category name is required');
      return;
    }

    try {
      if (editingId) {
        await categoryApi.update(editingId, formData);
        toast.success('Category updated');
      } else {
        await categoryApi.create(formData);
        toast.success('Category created');
      }
      
      resetForm();
      loadCategories();
    } catch (error: any) {
      logger.error('Save error:', error);
      toast.error('Failed to save category');
    }
  }

  function handleEdit(category: Category) {
    setFormData({
      name: category.name || '',
      slug: category.slug || '',
      description: category.description || '',
    });
    setEditingId(category.id);
    setShowForm(true);
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"?`)) return;

    try {
      await categoryApi.delete(id);
      toast.success('Category deleted');
      loadCategories();
    } catch (error: any) {
      logger.error('Delete error:', error);
      toast.error(error.message || 'Failed to delete category');
    }
  }

  function resetForm() {
    setFormData({ name: '', slug: '', description: '' });
    setEditingId(null);
    setShowForm(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Categories</h1>
          <p className="text-muted-foreground mt-1">
            Organize posts by category
          </p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)}>
            <Plus size={16} className="mr-2" />
            Add Category
          </Button>
        )}
      </div>

      {showForm && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">
              {editingId ? 'Edit Category' : 'New Category'}
            </h2>
            <Button variant="ghost" size="sm" onClick={resetForm}>
              <X size={16} />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Name *</label>
              <Input
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Machine Learning"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Slug *</label>
              <Input
                value={formData.slug}
                onChange={(e) => handleInputChange('slug', e.target.value)}
                placeholder="machine-learning"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Optional description"
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit">
                {editingId ? 'Update' : 'Create'}
              </Button>
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="space-y-3">
        {categories.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground mb-4">No categories yet</p>
            <Button onClick={() => setShowForm(true)}>
              <Plus size={16} className="mr-2" />
              Create First Category
            </Button>
          </Card>
        ) : (
          categories.filter(category => category && category.id && category.name).map((category) => (
            <Card key={category.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{category.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">/{category.slug}</p>
                  {category.description && (
                    <p className="text-sm text-muted-foreground mt-2">{category.description}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(category)}>
                    <Edit2 size={16} />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(category.id, category.name)}>
                    <Trash2 size={16} className="text-red-500" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}