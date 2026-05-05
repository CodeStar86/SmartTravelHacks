import { type DragEvent, type KeyboardEvent, useState } from 'react';
import { ContentBlock } from '../../types';
import { GripVertical, Trash2, Image, Type, List, Table, AlertCircle, Link as LinkIcon, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card } from '../ui/card';

interface BlockEditorProps {
  blocks: ContentBlock[];
  onChange: (blocks: ContentBlock[]) => void;
}

export function BlockEditor({ blocks, onChange }: BlockEditorProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const addBlock = (type: ContentBlock['type']) => {
    const newBlock: ContentBlock = {
      id: `block-${Date.now()}`,
      type,
      content: getDefaultContent(type),
      order: blocks.length,
    };
    onChange([...blocks, newBlock]);
    setSelectedIndex(blocks.length);
  };

  const updateBlock = (index: number, updates: Partial<ContentBlock>) => {
    const updated = blocks.map((block, i) => 
      i === index ? { ...block, ...updates } : block
    );
    onChange(updated);
  };

  const deleteBlock = (index: number) => {
    onChange(blocks.filter((_, i) => i !== index).map((block, i) => ({ ...block, order: i })));
    setSelectedIndex((current) => {
      if (current === null) return null;
      if (current === index) return null;
      return current > index ? current - 1 : current;
    });
  };

  const moveBlock = (from: number, to: number) => {
    if (to < 0 || to >= blocks.length || from === to) return;

    const updated = [...blocks];
    const [moved] = updated.splice(from, 1);
    updated.splice(to, 0, moved);
    onChange(updated.map((block, i) => ({ ...block, order: i })));
    setSelectedIndex(to);
  };

  const handleDragStart = (event: DragEvent<HTMLButtonElement>, index: number) => {
    setDraggedIndex(index);
    setSelectedIndex(index);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (event: DragEvent, index: number) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDrop = (event: DragEvent, index: number) => {
    event.preventDefault();

    const transferredIndex = Number(event.dataTransfer.getData('text/plain'));
    const fromIndex = Number.isInteger(transferredIndex) ? transferredIndex : draggedIndex;

    if (fromIndex !== null && fromIndex !== index) {
      moveBlock(fromIndex, index);
    }

    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleBlockKeyDown = (event: KeyboardEvent, index: number) => {
    const target = event.target as HTMLElement;
    const isEditingField = target.closest('input, textarea, [role="combobox"], [contenteditable="true"]');

    if (isEditingField) return;

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      moveBlock(index, index - 1);
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      moveBlock(index, index + 1);
    }
  };

  return (
    <div className="space-y-4">
      {blocks.map((block, index) => (
        <Card
          key={block.id}
          tabIndex={0}
          role="button"
          aria-label={`Blog content block ${index + 1}. Press arrow up or arrow down to move it.`}
          onClick={() => setSelectedIndex(index)}
          onFocus={() => setSelectedIndex(index)}
          onKeyDown={(event) => handleBlockKeyDown(event, index)}
          onDragOver={(event) => handleDragOver(event, index)}
          onDragEnter={(event) => handleDragOver(event, index)}
          onDrop={(event) => handleDrop(event, index)}
          onDragLeave={() => setDragOverIndex((current) => (current === index ? null : current))}
          className={`p-4 outline-none transition ${selectedIndex === index ? 'ring-2 ring-blue-500 ring-offset-2' : ''} ${dragOverIndex === index && draggedIndex !== index ? 'border-blue-500 bg-blue-50' : ''} ${draggedIndex === index ? 'opacity-60' : ''}`}
        >
          <div className="flex items-start gap-3">
            <button
              type="button"
              className="cursor-move mt-2"
              draggable
              onDragStart={(event) => handleDragStart(event, index)}
              onDragEnd={handleDragEnd}
              aria-label="Drag block to reorder"
            >
              <GripVertical size={20} className="text-gray-400" />
            </button>

            <div className="flex-1">
              {renderBlockEditor(block, index, updateBlock)}
            </div>

            <div className="flex flex-col gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={(event) => {
                  event.stopPropagation();
                  moveBlock(index, index - 1);
                }}
                disabled={index === 0}
                aria-label="Move block up"
              >
                <ArrowUp size={18} />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={(event) => {
                  event.stopPropagation();
                  moveBlock(index, index + 1);
                }}
                disabled={index === blocks.length - 1}
                aria-label="Move block down"
              >
                <ArrowDown size={18} />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={(event) => {
                  event.stopPropagation();
                  deleteBlock(index);
                }}
                className="text-red-600 hover:text-red-700"
                aria-label="Delete block"
              >
                <Trash2 size={18} />
              </Button>
            </div>
          </div>
        </Card>
      ))}

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => addBlock('heading')}>
          <Type size={16} className="mr-2" /> Heading
        </Button>
        <Button variant="outline" size="sm" onClick={() => addBlock('paragraph')}>
          <Type size={16} className="mr-2" /> Paragraph
        </Button>
        <Button variant="outline" size="sm" onClick={() => addBlock('image')}>
          <Image size={16} className="mr-2" /> Image
        </Button>
        <Button variant="outline" size="sm" onClick={() => addBlock('list')}>
          <List size={16} className="mr-2" /> List
        </Button>
        <Button variant="outline" size="sm" onClick={() => addBlock('table')}>
          <Table size={16} className="mr-2" /> Table
        </Button>
        <Button variant="outline" size="sm" onClick={() => addBlock('callout')}>
          <AlertCircle size={16} className="mr-2" /> Callout
        </Button>
        <Button variant="outline" size="sm" onClick={() => addBlock('button')}>
          <LinkIcon size={16} className="mr-2" /> Button/CTA
        </Button>
      </div>
    </div>
  );
}

function renderBlockEditor(
  block: ContentBlock,
  index: number,
  updateBlock: (index: number, updates: Partial<ContentBlock>) => void
) {
  const updateContent = (updates: any) => {
    updateBlock(index, { content: { ...block.content, ...updates } });
  };

  switch (block.type) {
    case 'heading':
      return (
        <div className="space-y-2">
          <div className="flex gap-2">
            <Select
              value={block.content?.level?.toString() || '2'}
              onValueChange={(value) => updateContent({ level: parseInt(value) })}
            >
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">H2</SelectItem>
                <SelectItem value="3">H3</SelectItem>
                <SelectItem value="4">H4</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="Heading text..."
              value={block.content?.text || ''}
              onChange={(e) => updateContent({ text: e.target.value })}
              className="flex-1"
            />
          </div>
        </div>
      );

    case 'paragraph':
      return (
        <Textarea
          placeholder="Paragraph text... (supports basic HTML: <strong>, <em>, <a>)"
          value={block.content?.text || ''}
          onChange={(e) => updateContent({ text: e.target.value })}
          rows={4}
        />
      );

    case 'image':
      return (
        <div className="space-y-2">
          <Input
            placeholder="Image URL"
            value={block.content?.url || ''}
            onChange={(e) => updateContent({ url: e.target.value })}
          />
          <Input
            placeholder="Alt text (required for SEO)"
            value={block.content?.alt || ''}
            onChange={(e) => updateContent({ alt: e.target.value })}
          />
          <Input
            placeholder="Caption (optional)"
            value={block.content?.caption || ''}
            onChange={(e) => updateContent({ caption: e.target.value })}
          />
          {block.content?.url && (
            <div className="mt-3 border rounded-lg overflow-hidden bg-gray-50">
              <img
                src={block.content.url}
                alt={block.content.alt || 'Preview'}
                className="w-full max-h-64 object-contain"
                onError={(e) => {
                  e.currentTarget.src = 'https://via.placeholder.com/800x400?text=Invalid+Image+URL';
                }}
              />
              {block.content?.caption && (
                <div className="p-2 bg-white border-t text-xs text-gray-600 text-center">
                  {block.content.caption}
                </div>
              )}
            </div>
          )}
        </div>
      );

    case 'list':
      return (
        <div className="space-y-2">
          <Select
            value={block.content?.ordered ? 'ordered' : 'unordered'}
            onValueChange={(value) => updateContent({ ordered: value === 'ordered' })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unordered">Bulleted List</SelectItem>
              <SelectItem value="ordered">Numbered List</SelectItem>
            </SelectContent>
          </Select>
          <Textarea
            placeholder="One item per line..."
            value={(block.content?.items || []).join('\n')}
            onChange={(e) => updateContent({ items: e.target.value.split('\n').filter(Boolean) })}
            rows={5}
          />
        </div>
      );

    case 'callout':
      return (
        <div className="space-y-2">
          <Select
            value={block.content?.type || 'info'}
            onValueChange={(value) => updateContent({ type: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="error">Error</SelectItem>
            </SelectContent>
          </Select>
          <Textarea
            placeholder="Callout text..."
            value={block.content?.text || ''}
            onChange={(e) => updateContent({ text: e.target.value })}
            rows={3}
          />
        </div>
      );

    case 'button':
      return (
        <div className="space-y-2">
          <Input
            placeholder="Button text"
            value={block.content?.text || ''}
            onChange={(e) => updateContent({ text: e.target.value })}
          />
          <Input
            placeholder="URL"
            value={block.content?.url || ''}
            onChange={(e) => updateContent({ url: e.target.value })}
          />
          <Select
            value={block.content?.style || 'primary'}
            onValueChange={(value) => updateContent({ style: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="primary">Primary</SelectItem>
              <SelectItem value="secondary">Secondary</SelectItem>
              <SelectItem value="outline">Outline</SelectItem>
            </SelectContent>
          </Select>
        </div>
      );

    default:
      return <p className="text-gray-500">Unsupported block type</p>;
  }
}

function getDefaultContent(type: ContentBlock['type']) {
  switch (type) {
    case 'heading':
      return { text: '', level: 2 };
    case 'paragraph':
      return { text: '' };
    case 'image':
      return { url: '', alt: '', caption: '' };
    case 'list':
      return { items: [], ordered: false };
    case 'table':
      return { headers: [], rows: [] };
    case 'callout':
      return { text: '', type: 'info' };
    case 'button':
      return { text: '', url: '', style: 'primary' };
    default:
      return {};
  }
}