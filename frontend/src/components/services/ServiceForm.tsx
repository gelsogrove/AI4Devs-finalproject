import { useEffect, useState } from "react";
import { serviceApi } from "../../api/serviceApi";
import { CreateServiceDto } from "../../types/service";

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
    isActive: true,
  });

  // Load service data if editing an existing service
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
            isActive: service.isActive,
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
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    
    // Handle different types of inputs
    let processedValue: string | number | boolean = value;
    
    if (type === 'number') {
      processedValue = value === '' ? 0 : parseFloat(value);
    } else if (name === 'isActive') {
      processedValue = value === 'true';
    }
    
    setForm((prev) => ({
      ...prev,
      [name]: processedValue,
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

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!form.name.trim()) {
      errors.name = "Name is required";
    } else if (form.name.length < 3) {
      errors.name = "Name must be at least 3 characters";
    }
    
    if (!form.description.trim()) {
      errors.description = "Description is required";
    } else if (form.description.length < 10) {
      errors.description = "Description must be at least 10 characters";
    }
    
    if (form.price <= 0) {
      errors.price = "Price must be greater than 0";
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSaving(true);
    setError(null);
    
    try {
      if (isNew) {
        await serviceApi.createService(form);
      } else if (serviceId) {
        await serviceApi.updateService(serviceId, form);
      }
      
      onSave();
    } catch (err) {
      console.error("Error saving service:", err);
      setError("Failed to save service. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="p-4 text-center">Loading service data...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-4">
      {error && (
        <div className="bg-red-50 p-4 rounded text-red-700 mb-4">
          {error}
        </div>
      )}
      
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Name
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={form.name}
          onChange={handleChange}
          className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-shopme-500 focus:ring-shopme-500 sm:text-sm ${
            validationErrors.name ? "border-red-500" : ""
          }`}
        />
        {validationErrors.name && (
          <p className="mt-1 text-sm text-red-600">{validationErrors.name}</p>
        )}
      </div>
      
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          value={form.description}
          onChange={handleChange}
          className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-shopme-500 focus:ring-shopme-500 sm:text-sm ${
            validationErrors.description ? "border-red-500" : ""
          }`}
        />
        {validationErrors.description && (
          <p className="mt-1 text-sm text-red-600">{validationErrors.description}</p>
        )}
      </div>
      
      <div>
        <label htmlFor="price" className="block text-sm font-medium text-gray-700">
          Price
        </label>
        <div className="relative mt-1 rounded-md shadow-sm">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <span className="text-gray-500 sm:text-sm">$</span>
          </div>
          <input
            type="number"
            id="price"
            name="price"
            min="0.01"
            step="0.01"
            value={form.price}
            onChange={handleChange}
            className={`block w-full rounded-md border-gray-300 pl-7 pr-12 focus:border-shopme-500 focus:ring-shopme-500 sm:text-sm ${
              validationErrors.price ? "border-red-500" : ""
            }`}
          />
        </div>
        {validationErrors.price && (
          <p className="mt-1 text-sm text-red-600">{validationErrors.price}</p>
        )}
      </div>
      
      <div>
        <label htmlFor="isActive" className="block text-sm font-medium text-gray-700">
          Status
        </label>
        <select
          id="isActive"
          name="isActive"
          value={form.isActive ? "true" : "false"}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-shopme-500 focus:ring-shopme-500 sm:text-sm"
        >
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>
      
      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-shopme-500 focus:ring-offset-2"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex items-center rounded-md border border-transparent bg-shopme-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-shopme-700 focus:outline-none focus:ring-2 focus:ring-shopme-500 focus:ring-offset-2"
        >
          {isSaving ? "Saving..." : isNew ? "Create Service" : "Update Service"}
        </button>
      </div>
    </form>
  );
} 