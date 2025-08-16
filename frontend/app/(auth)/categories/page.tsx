'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  GripVertical,
  Folder,
  FolderOpen,
  Package,
} from 'lucide-react';
import Link from 'next/link';

interface Category {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  level: number;
  productCount: number;
  isActive: boolean;
  children?: Category[];
  isExpanded?: boolean;
}

// Mock category data with hierarchy
const mockCategories: Category[] = [
  {
    id: '1',
    name: 'Phone Cases',
    description: 'Protective cases for smartphones',
    level: 0,
    productCount: 45,
    isActive: true,
    children: [
      {
        id: '1.1',
        name: 'iPhone Cases',
        description: 'Cases specifically for iPhone models',
        parentId: '1',
        level: 1,
        productCount: 28,
        isActive: true,
        children: [
          {
            id: '1.1.1',
            name: 'iPhone 14 Cases',
            parentId: '1.1',
            level: 2,
            productCount: 12,
            isActive: true,
          },
          {
            id: '1.1.2',
            name: 'iPhone 13 Cases',
            parentId: '1.1',
            level: 2,
            productCount: 8,
            isActive: true,
          },
          {
            id: '1.1.3',
            name: 'iPhone 12 Cases',
            parentId: '1.1',
            level: 2,
            productCount: 8,
            isActive: true,
          },
        ],
      },
      {
        id: '1.2',
        name: 'Samsung Cases',
        description: 'Cases for Samsung Galaxy devices',
        parentId: '1',
        level: 1,
        productCount: 17,
        isActive: true,
        children: [
          {
            id: '1.2.1',
            name: 'Galaxy S23 Cases',
            parentId: '1.2',
            level: 2,
            productCount: 9,
            isActive: true,
          },
          {
            id: '1.2.2',
            name: 'Galaxy A Series Cases',
            parentId: '1.2',
            level: 2,
            productCount: 8,
            isActive: true,
          },
        ],
      },
    ],
  },
  {
    id: '2',
    name: 'Chargers',
    description: 'Charging accessories and cables',
    level: 0,
    productCount: 32,
    isActive: true,
    children: [
      {
        id: '2.1',
        name: 'Wall Chargers',
        parentId: '2',
        level: 1,
        productCount: 18,
        isActive: true,
      },
      {
        id: '2.2',
        name: 'Car Chargers',
        parentId: '2',
        level: 1,
        productCount: 8,
        isActive: true,
      },
      {
        id: '2.3',
        name: 'Wireless Chargers',
        parentId: '2',
        level: 1,
        productCount: 6,
        isActive: true,
      },
    ],
  },
  {
    id: '3',
    name: 'Screen Protectors',
    description: 'Tempered glass and film protectors',
    level: 0,
    productCount: 24,
    isActive: true,
  },
  {
    id: '4',
    name: 'Headphones',
    description: 'Audio accessories and earphones',
    level: 0,
    productCount: 19,
    isActive: true,
    children: [
      {
        id: '4.1',
        name: 'Wireless Earbuds',
        parentId: '4',
        level: 1,
        productCount: 12,
        isActive: true,
      },
      {
        id: '4.2',
        name: 'Wired Headphones',
        parentId: '4',
        level: 1,
        productCount: 7,
        isActive: true,
      },
    ],
  },
  {
    id: '5',
    name: 'Power Banks',
    description: 'Portable charging devices',
    level: 0,
    productCount: 15,
    isActive: true,
  },
];

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>(mockCategories);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['1', '2', '4']));
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [newCategoryForm, setNewCategoryForm] = useState({
    name: '',
    description: '',
    parentId: '',
  });
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [draggedCategory, setDraggedCategory] = useState<string | null>(null);

  // Flatten categories for easy manipulation
  const flattenCategories = (cats: Category[], expanded: Set<string>): Category[] => {
    const result: Category[] = [];
    
    const flatten = (items: Category[], level = 0) => {
      for (const item of items) {
        result.push({ ...item, level, isExpanded: expanded.has(item.id) });
        if (item.children && expanded.has(item.id)) {
          flatten(item.children, level + 1);
        }
      }
    };
    
    flatten(cats);
    return result;
  };

  const flatCategories = flattenCategories(categories, expandedCategories);

  const toggleExpanded = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const handleAddCategory = () => {
    if (!newCategoryForm.name.trim()) return;

    const newCategory: Category = {
      id: Date.now().toString(),
      name: newCategoryForm.name,
      description: newCategoryForm.description,
      parentId: newCategoryForm.parentId || undefined,
      level: newCategoryForm.parentId ? 1 : 0,
      productCount: 0,
      isActive: true,
    };

    // In real app, call API to create category
    console.log('Creating category:', newCategory);

    // Add to categories (simplified for demo)
    if (newCategoryForm.parentId) {
      // Add as child category
      const updateCategories = (cats: Category[]): Category[] => {
        return cats.map(cat => {
          if (cat.id === newCategoryForm.parentId) {
            return {
              ...cat,
              children: [...(cat.children || []), newCategory],
            };
          }
          if (cat.children) {
            return { ...cat, children: updateCategories(cat.children) };
          }
          return cat;
        });
      };
      setCategories(updateCategories(categories));
    } else {
      // Add as top-level category
      setCategories([...categories, newCategory]);
    }

    // Reset form
    setNewCategoryForm({ name: '', description: '', parentId: '' });
    setIsAddingCategory(false);
  };

  const handleDeleteCategory = (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
      return;
    }

    // In real app, call API to delete category
    console.log('Deleting category:', categoryId);

    const removeCategory = (cats: Category[]): Category[] => {
      return cats.filter(cat => cat.id !== categoryId).map(cat => ({
        ...cat,
        children: cat.children ? removeCategory(cat.children) : undefined,
      }));
    };

    setCategories(removeCategory(categories));
  };

  const handleEditCategory = (categoryId: string, newName: string) => {
    const updateCategory = (cats: Category[]): Category[] => {
      return cats.map(cat => {
        if (cat.id === categoryId) {
          return { ...cat, name: newName };
        }
        if (cat.children) {
          return { ...cat, children: updateCategory(cat.children) };
        }
        return cat;
      });
    };

    setCategories(updateCategory(categories));
    setEditingCategory(null);
  };

  const getIndentClass = (level: number) => {
    return `ml-${level * 6}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/products">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Products
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Category Management</h1>
            <p className="text-muted-foreground">
              Organize and manage product categories
            </p>
          </div>
        </div>

        <Button onClick={() => setIsAddingCategory(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Category Tree */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Category Hierarchy</CardTitle>
              <CardDescription>
                Drag and drop to reorganize categories
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Add New Category Form */}
              {isAddingCategory && (
                <div className="mb-6 p-4 border rounded-lg bg-muted/50">
                  <h3 className="font-semibold mb-3">Add New Category</h3>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="categoryName">Category Name *</Label>
                      <Input
                        id="categoryName"
                        placeholder="Enter category name"
                        value={newCategoryForm.name}
                        onChange={(e) => setNewCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="categoryDescription">Description</Label>
                      <Input
                        id="categoryDescription"
                        placeholder="Enter category description"
                        value={newCategoryForm.description}
                        onChange={(e) => setNewCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="parentCategory">Parent Category</Label>
                      <select
                        id="parentCategory"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        value={newCategoryForm.parentId}
                        onChange={(e) => setNewCategoryForm(prev => ({ ...prev, parentId: e.target.value }))}
                      >
                        <option value="">Top Level Category</option>
                        {flatCategories.filter(cat => cat.level === 0).map(cat => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleAddCategory} disabled={!newCategoryForm.name.trim()}>
                        <Save className="h-4 w-4 mr-2" />
                        Create Category
                      </Button>
                      <Button variant="outline" onClick={() => setIsAddingCategory(false)}>
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Category List */}
              <div className="space-y-1">
                {flatCategories.map((category) => (
                  <div
                    key={category.id}
                    className={`flex items-center gap-2 p-3 border rounded-lg hover:bg-muted/50 transition-colors ${getIndentClass(category.level)}`}
                    draggable
                    onDragStart={() => setDraggedCategory(category.id)}
                    onDragEnd={() => setDraggedCategory(null)}
                  >
                    {/* Drag Handle */}
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />

                    {/* Expand/Collapse Button */}
                    {category.children && category.children.length > 0 ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => toggleExpanded(category.id)}
                      >
                        {category.isExpanded ? (
                          <FolderOpen className="h-4 w-4" />
                        ) : (
                          <Folder className="h-4 w-4" />
                        )}
                      </Button>
                    ) : (
                      <div className="w-6" /> // Spacer for alignment
                    )}

                    {/* Category Info */}
                    <div className="flex-1">
                      {editingCategory === category.id ? (
                        <Input
                          defaultValue={category.name}
                          autoFocus
                          onBlur={(e) => handleEditCategory(category.id, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleEditCategory(category.id, e.currentTarget.value);
                            }
                            if (e.key === 'Escape') {
                              setEditingCategory(null);
                            }
                          }}
                        />
                      ) : (
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{category.name}</span>
                            <Badge variant="secondary" className="text-xs">
                              {category.productCount} products
                            </Badge>
                            {!category.isActive && (
                              <Badge variant="destructive" className="text-xs">
                                Inactive
                              </Badge>
                            )}
                          </div>
                          {category.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {category.description}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingCategory(category.id)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteCategory(category.id)}
                        disabled={category.productCount > 0}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {flatCategories.length === 0 && (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No categories found</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setIsAddingCategory(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Category
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Category Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Category Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Categories</p>
                <p className="text-2xl font-bold">{flatCategories.length}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Top Level</p>
                <p className="text-xl font-semibold">
                  {flatCategories.filter(cat => cat.level === 0).length}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Subcategories</p>
                <p className="text-xl font-semibold">
                  {flatCategories.filter(cat => cat.level > 0).length}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Products</p>
                <p className="text-xl font-semibold text-green-600">
                  {flatCategories.reduce((sum, cat) => sum + cat.productCount, 0)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full" onClick={() => setIsAddingCategory(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Category
              </Button>
              <Button variant="outline" className="w-full">
                <Package className="h-4 w-4 mr-2" />
                Import Categories
              </Button>
              <Button variant="outline" className="w-full">
                Export Categories
              </Button>
            </CardContent>
          </Card>

          {/* Help */}
          <Card>
            <CardHeader>
              <CardTitle>Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>• Drag categories to reorder them</p>
              <p>• Use subcategories to organize products better</p>
              <p>• Categories with products cannot be deleted</p>
              <p>• Click folder icons to expand/collapse</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
