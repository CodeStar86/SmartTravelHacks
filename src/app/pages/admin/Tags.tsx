import { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { tagApi } from '../../lib/api';

import { logger } from '../../lib/logger';
interface Tag {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export default function Tags() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
  });

  useEffect(() => {
    loadTags();
  }, []);

  async function loadTags() {
    try {
      setLoading(true);
      const data = await tagApi.list();
      setTags(data || []);
    } catch (error: any) {
      logger.error('Failed to load tags:', error);
      toast.error('Failed to load tags');
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
      toast.error('Tag name is required');
      return;
    }

    try {
      if (editingId) {
        await tagApi.update(editingId, formData);
        toast.success('Tag updated');
      } else {
        await tagApi.create(formData);
        toast.success('Tag created');
      }
      
      resetForm();
      loadTags();
    } catch (error: any) {
      logger.error('Save error:', error);
      toast.error('Failed to save tag');
    }
  }

  function handleEdit(tag: Tag) {
    setFormData({
      name: tag.name || '',
      slug: tag.slug || '',
    });
    setEditingId(tag.id);
    setShowForm(true);
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"?`)) return;

    try {
      await tagApi.delete(id);
      toast.success('Tag deleted');
      loadTags();
    } catch (error: any) {
      logger.error('Delete error:', error);
      toast.error(error.message || 'Failed to delete tag');
    }
  }

  function resetForm() {
    setFormData({ name: '', slug: '' });
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
          <h1 className="text-3xl font-bold">Tags</h1>
          <p className="text-muted-foreground mt-1">
            Add tags to posts
          </p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)}>
            <Plus size={16} className="mr-2" />
            Add Tag
          </Button>
        )}
      </div>

      {showForm && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">
              {editingId ? 'Edit Tag' : 'New Tag'}
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
                placeholder="Neural Networks"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Slug *</label>
              <Input
                value={formData.slug}
                onChange={(e) => handleInputChange('slug', e.target.value)}
                placeholder="neural-networks"
                required
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {tags.length === 0 ? (
          <Card className="p-12 text-center col-span-full">
            <p className="text-muted-foreground mb-4">No tags yet</p>
            <Button onClick={() => setShowForm(true)}>
              <Plus size={16} className="mr-2" />
              Create First Tag
            </Button>
          </Card>
        ) : (
          tags.filter(tag => tag && tag.id && tag.name).map((tag) => (
            <Card key={tag.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{tag.name}</h3>
                  <p className="text-sm text-muted-foreground truncate mt-1">
                    /{tag.slug}
                  </p>
                </div>
                <div className="flex gap-1 ml-2">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(tag)}>
                    <Edit2 size={14} />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(tag.id, tag.name)}>
                    <Trash2 size={14} className="text-red-500" />
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