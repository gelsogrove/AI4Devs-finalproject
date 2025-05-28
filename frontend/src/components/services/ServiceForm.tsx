import { useEffect, useState } from "react";
import { serviceApi } from "../../api/serviceApi";
import { CreateServiceDto, UpdateServiceDto } from "../../types/service";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { MarkdownViewer } from "../ui/markdown-viewer";
import { Switch } from "../ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Textarea } from "../ui/textarea";

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
    isActive: true
  });
  
  // For markdown preview
  const [activeTab, setActiveTab] = useState<string>("edit");

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
            isActive: service.isActive !== undefined ? service.isActive : true
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

  const handleSwitchChange = (checked: boolean) => {
    setForm(prev => ({
      ...prev,
      isActive: checked
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

      <div className="space-y-2">
        <label 
          htmlFor="name" 
          className="block text-sm font-medium"
        >
          Name
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
          Description (Supports Markdown)
        </label>
        
        <Tabs 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="edit">Edit</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>
          
          <TabsContent value="edit" className="mt-2">
            <Textarea
              id="description"
              name="description"
              rows={8}
              value={form.description}
              onChange={handleChange}
              className={validationErrors.description ? "border-red-500" : ""}
              required
              placeholder="# Title
## Subtitle
- Bullet point
- Another point

**Bold text** and *italic text*

[Link text](http://example.com)

> Blockquote

```
Code block
```

| Column 1 | Column 2 |
| -------- | -------- |
| Cell 1   | Cell 2   |
"
            />
          </TabsContent>
          
          <TabsContent value="preview" className="mt-2 border rounded-md p-4 min-h-[200px]">
            {form.description ? (
              <MarkdownViewer content={form.description} />
            ) : (
              <p className="text-muted-foreground text-sm italic">Preview will appear here</p>
            )}
          </TabsContent>
        </Tabs>
        
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
          <label className="block text-sm font-medium">
            Status
          </label>
          <div className="flex items-center space-x-2">
            <Switch 
              checked={form.isActive} 
              onCheckedChange={handleSwitchChange}
              id="isActive"
            />
            <label htmlFor="isActive" className="text-sm">
              {form.isActive ? "Active" : "Inactive"}
            </label>
          </div>
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
          {isSaving ? "Saving..." : (isNew ? "Create Service" : "Update Service")}
        </Button>
      </div>
    </form>
  );
} 