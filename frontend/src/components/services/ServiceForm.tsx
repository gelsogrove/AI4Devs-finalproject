import { XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { serviceApi } from "../../api/serviceApi";
import { CreateServiceDto, UpdateServiceDto } from "../../types/service";
import { Badge } from "../ui/badge";

interface ServiceFormProps {
  serviceId?: string;
  isNew?: boolean;
  onSave: () => void;
  onCancel: () => void;
}

export function ServiceForm({
  serviceId,
  isNew = false,
  onSave,
  onCancel,
}: ServiceFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  const [form, setForm] = useState<CreateServiceDto>({
    name: "",
    description: "",
    price: 0,
    tags: []
  });

  // For tag input
  const [tagInput, setTagInput] = useState("");

  // Load Service data if editing an existing Service
  useEffect(() => {
    async function loadService() {
      if (!isNew && serviceId) {
        setIsLoading(true);
        try {
          const service = await serviceApi.getServiceById(serviceId);
          setForm({
            name: service.name,
            description: service.description,
            price: service.price,
            tags: service.tags || []
          });
        } catch (err) {
          setError("Failed to load service data");
          console.error(err);
        } finally {
          setIsLoading(false);
        }
      }
    }

    loadService();
  }, [serviceId, isNew]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    
    // Handle price separately to ensure it's a number
    if (name === 'price') {
      const numValue = parseFloat(value);
      setForm((prev) => ({
        ...prev,
        [name]: isNaN(numValue) ? 0 : numValue,
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
    
    // Clear validation error when field is updated
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };

  const addTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      
      // Don't add duplicate tags
      if (!form.tags.includes(tagInput.trim().toLowerCase())) {
        setForm(prev => ({
          ...prev,
          tags: [...prev.tags, tagInput.trim().toLowerCase()]
        }));
      }
      
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setForm(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!form.name.trim()) {
      errors.name = "Name is required";
    }
    
    if (!form.description.trim()) {
      errors.description = "Description is required";
    }
    
    if (form.price <= 0) {
      errors.price = "Price must be greater than 0";
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
        await serviceApi.createService(form);
      } else if (serviceId) {
        await serviceApi.updateService(serviceId, form as UpdateServiceDto);
      }
      onSave();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to save service");
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="p-4">Loading service data...</div>;
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
          Name
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={form.name}
          onChange={handleChange}
          className={`w-full p-2 border rounded-lg focus:ring-green-500 focus:border-green-500 ${
            validationErrors.name ? "border-red-500" : ""
          }`}
          required
        />
        {validationErrors.name && (
          <p className="mt-1 text-sm text-red-600">{validationErrors.name}</p>
        )}
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
          value={form.price}
          onChange={handleChange}
          min="0.01"
          step="0.01"
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
          htmlFor="tags" 
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Tags (press Enter to add)
        </label>
        <input
          type="text"
          id="tags"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={addTag}
          className="w-full p-2 border rounded-lg focus:ring-green-500 focus:border-green-500 mb-2"
          placeholder="Add tags (e.g. delivery, premium, quick)"
        />
        <div className="flex flex-wrap gap-2 mt-2">
          {form.tags.map(tag => (
            <Badge key={tag} variant="secondary" className="flex items-center gap-1 px-3 py-1">
              {tag}
              <XCircle 
                className="h-4 w-4 cursor-pointer text-gray-500 hover:text-red-500" 
                onClick={() => removeTag(tag)} 
              />
            </Badge>
          ))}
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
          {isSaving ? "Saving..." : isNew ? "Create Service" : "Update Service"}
        </button>
      </div>
    </form>
  );
} 