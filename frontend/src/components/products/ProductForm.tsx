import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { productApi } from "../../api/productApi";
import { CreateProductDto, UpdateProductDto } from "../../types/product";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";

interface ProductFormProps {
  productId?: string;
  isNew?: boolean;
  onSave: () => void;
  onCancel: () => void;
}

export function ProductForm({
  productId,
  isNew = false,
  onSave,
  onCancel,
}: ProductFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [newTag, setNewTag] = useState<string>("");
  
  const [form, setForm] = useState<CreateProductDto>({
    name: "",
    description: "",
    price: 0,
    imageUrl: "",
    category: "",
    tags: [],
    stock: 0,
  });

  // Load product data if editing an existing product
  useEffect(() => {
    async function loadProduct() {
      if (!isNew && productId) {
        setIsLoading(true);
        try {
          const product = await productApi.getProductById(productId);
          setForm({
            name: product.name,
            description: product.description,
            price: product.price,
            imageUrl: product.imageUrl,
            category: product.category,
            tags: product.tags || [],
            stock: product.stock || 0,
          });
        } catch (err) {
          setError("Failed to load product data");
          console.error(err);
        } finally {
          setIsLoading(false);
        }
      }
    }

    async function loadCategories() {
      try {
        const categories = await productApi.getCategories();
        setCategories(categories);
      } catch (err) {
        console.error("Failed to load categories", err);
      }
    }

    loadProduct();
    loadCategories();
  }, [productId, isNew]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    const newValue = name === "price" || name === "stock" ? parseFloat(value) || 0 : value;
    
    setForm((prev) => ({
      ...prev,
      [name]: newValue,
    }));
    
    // Clear validation error when field is updated
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !form.tags?.includes(newTag.trim())) {
      setForm((prev) => ({
        ...prev,
        tags: [...(prev.tags || []), newTag.trim()],
      }));
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setForm((prev) => ({
      ...prev,
      tags: (prev.tags || []).filter(tag => tag !== tagToRemove),
    }));
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (form.description.length < 10) {
      errors.description = "Description must be at least 10 characters";
    }
    
    if (form.price <= 0) {
      errors.price = "Price must be positive";
    }
    
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    
    // Validate form before submission
    if (!validateForm()) {
      return;
    }
    
    setIsSaving(true);

    try {
      if (isNew) {
        await productApi.createProduct(form);
        setSuccessMessage("Product created successfully");
      } else if (productId) {
        await productApi.updateProduct(productId, form as UpdateProductDto);
        setSuccessMessage("Product updated successfully");
      }
      
      // Wait a bit before calling onSave to allow the user to see the success message
      setTimeout(() => {
        onSave();
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to save product");
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="p-4">Loading product data...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 p-4 rounded-md text-red-700 mb-4">
          {error}
        </div>
      )}
      
      {successMessage && (
        <div className="bg-green-50 p-4 rounded-md text-green-700 mb-4">
          {successMessage}
        </div>
      )}

      <div className="space-y-2">
        <label 
          htmlFor="name" 
          className="block text-sm font-medium"
        >
          Product Name
        </label>
        <Input
          type="text"
          id="name"
          name="name"
          value={form.name}
          onChange={handleChange}
          className={validationErrors.name ? "border-red-500" : ""}
          required
        />
        {validationErrors.name && (
          <p className="text-sm text-destructive">{validationErrors.name}</p>
        )}
      </div>

      <div className="space-y-2">
        <label 
          htmlFor="description" 
          className="block text-sm font-medium"
        >
          Description
        </label>
        <Textarea
          id="description"
          name="description"
          rows={5}
          value={form.description}
          onChange={handleChange}
          className={validationErrors.description ? "border-red-500" : ""}
          required
        />
        {validationErrors.description && (
          <p className="text-sm text-destructive">{validationErrors.description}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label 
            htmlFor="price" 
            className="block text-sm font-medium"
          >
            Price (€)
          </label>
          <Input
            type="number"
            id="price"
            name="price"
            value={form.price}
            onChange={handleChange}
            className={validationErrors.price ? "border-red-500" : ""}
            step="0.01"
            min="0"
            required
          />
          {validationErrors.price && (
            <p className="text-sm text-destructive">{validationErrors.price}</p>
          )}
        </div>

        <div className="space-y-2">
          <label 
            htmlFor="stock" 
            className="block text-sm font-medium"
          >
            Stock
          </label>
          <Input
            type="number"
            id="stock"
            name="stock"
            value={form.stock}
            onChange={handleChange}
            className={validationErrors.stock ? "border-red-500" : ""}
            step="1"
            min="0"
            required
          />
          {validationErrors.stock && (
            <p className="text-sm text-destructive">{validationErrors.stock}</p>
          )}
        </div>

        <div className="space-y-2">
          <label 
            htmlFor="category" 
            className="block text-sm font-medium"
          >
            Category
          </label>
          <select
            id="category"
            name="category"
            value={form.category}
            onChange={handleChange}
            className="w-full h-10 px-3 py-2 bg-background border border-input rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            required
          >
            <option value="">Select a category</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label 
          htmlFor="imageUrl" 
          className="block text-sm font-medium"
        >
          Image URL
        </label>
        <Input
          type="url"
          id="imageUrl"
          name="imageUrl"
          value={form.imageUrl}
          onChange={handleChange}
          placeholder="https://example.com/image.jpg"
          required
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Tags</label>
        <div className="flex gap-2">
          <Input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            placeholder="Add a tag"
            className="flex-1"
          />
          <Button 
            type="button"
            onClick={handleAddTag}
            variant="secondary"
          >
            Add
          </Button>
        </div>
        
        {/* Display tags */}
        <div className="flex flex-wrap gap-2 mt-2">
          {form.tags?.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-sm py-1 px-2 gap-1">
              {tag}
              <button
                type="button"
                onClick={() => handleRemoveTag(tag)}
                className="ml-1 text-gray-500 hover:text-gray-700 focus:outline-none"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button 
          type="button" 
          onClick={onCancel}
          variant="outline"
        >
          Cancel
        </Button>
        <Button 
          type="submit"
          disabled={isSaving}
        >
          {isSaving ? "Saving..." : (isNew ? "Create Product" : "Update Product")}
        </Button>
      </div>
    </form>
  );
} 