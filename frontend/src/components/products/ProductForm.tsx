import { useEffect, useState } from "react";
import { productApi } from "../../api/productApi";
import { CreateProductDto, UpdateProductDto } from "../../types/product";

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
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  const [form, setForm] = useState<CreateProductDto>({
    name: "",
    description: "",
    price: 0,
    imageUrl: "",
    category: "",
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
    const newValue = name === "price" ? parseFloat(value) || 0 : value;
    
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
    
    // Validate form before submission
    if (!validateForm()) {
      return;
    }
    
    setIsSaving(true);

    try {
      if (isNew) {
        await productApi.createProduct(form);
      } else if (productId) {
        await productApi.updateProduct(productId, form as UpdateProductDto);
      }
      onSave();
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

      <div>
        <label 
          htmlFor="name" 
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Product Name
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={form.name}
          onChange={handleChange}
          className="w-full p-2 border rounded-lg focus:ring-green-500 focus:border-green-500"
          required
        />
      </div>

      <div>
        <label 
          htmlFor="description" 
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          value={form.description}
          onChange={handleChange}
          className={`w-full p-2 border rounded-lg focus:ring-green-500 focus:border-green-500 ${
            validationErrors.description ? "border-red-500" : ""
          }`}
          required
        />
        {validationErrors.description && (
          <p className="mt-1 text-sm text-red-600">{validationErrors.description}</p>
        )}
      </div>

      <div>
        <label 
          htmlFor="price" 
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Price (€)
        </label>
        <input
          type="number"
          id="price"
          name="price"
          min="0.01"
          step="0.01"
          value={form.price}
          onChange={handleChange}
          className={`w-full p-2 border rounded-lg focus:ring-green-500 focus:border-green-500 ${
            validationErrors.price ? "border-red-500" : ""
          }`}
          required
        />
        {validationErrors.price && (
          <p className="mt-1 text-sm text-red-600">{validationErrors.price}</p>
        )}
      </div>

      <div>
        <label 
          htmlFor="imageUrl" 
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Image URL
        </label>
        <input
          type="url"
          id="imageUrl"
          name="imageUrl"
          value={form.imageUrl}
          onChange={handleChange}
          className="w-full p-2 border rounded-lg focus:ring-green-500 focus:border-green-500"
          required
        />
        {form.imageUrl && (
          <div className="mt-2">
            <img 
              src={form.imageUrl} 
              alt="Product preview" 
              className="h-40 w-40 object-cover rounded-lg border"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=Invalid+Image';
              }}
            />
          </div>
        )}
      </div>

      <div>
        <label 
          htmlFor="category" 
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Category
        </label>
        <select
          id="category"
          name="category"
          value={form.category}
          onChange={handleChange}
          className="w-full p-2 border rounded-lg focus:ring-green-500 focus:border-green-500"
          required
        >
          <option value="">Select a category</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
          {/* Allow creating a new category if it's not in the list */}
          {form.category && !categories.includes(form.category) && (
            <option value={form.category}>{form.category} (New)</option>
          )}
        </select>
        {/* Input field to add a new category */}
        <div className="mt-2">
          <input
            type="text"
            name="category"
            placeholder="Or enter a new category"
            onChange={handleChange}
            className="w-full p-2 border rounded-lg focus:ring-green-500 focus:border-green-500"
          />
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-5">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          className="rounded-lg border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="rounded-lg border border-transparent bg-green-600 py-2 px-4 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
        >
          {isSaving ? "Saving..." : isNew ? "Create Product" : "Update Product"}
        </button>
      </div>
    </form>
  );
} 