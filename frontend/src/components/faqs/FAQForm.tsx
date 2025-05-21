import { useEffect, useState } from "react";
import { faqApi } from "../../api/faqApi";
import { CreateFAQDto, UpdateFAQDto } from "../../types/faq";

interface FAQFormProps {
  faqId?: string;
  isNew?: boolean;
  onSave: () => void;
  onCancel: () => void;
}

export function FAQForm({
  faqId,
  isNew = false,
  onSave,
  onCancel,
}: FAQFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  const [form, setForm] = useState<CreateFAQDto>({
    question: "",
    answer: "",
    category: "",
    isPublished: true,
  });

  // Load FAQ data if editing an existing FAQ
  useEffect(() => {
    async function loadFAQ() {
      if (!isNew && faqId) {
        setIsLoading(true);
        try {
          const faq = await faqApi.getFAQById(faqId);
          setForm({
            question: faq.question,
            answer: faq.answer,
            category: faq.category || '',
            isPublished: faq.isPublished,
          });
        } catch (err) {
          setError("Failed to load FAQ data");
          console.error(err);
        } finally {
          setIsLoading(false);
        }
      }
    }

    async function loadCategories() {
      try {
        const categories = await faqApi.getCategories();
        setCategories(categories);
      } catch (err) {
        console.error("Failed to load categories", err);
      }
    }

    loadFAQ();
    loadCategories();
  }, [faqId, isNew]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "isPublished" ? value === "true" : value,
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

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (form.answer.length < 10) {
      errors.answer = "Answer must be at least 10 characters";
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
        await faqApi.createFAQ(form);
      } else if (faqId) {
        await faqApi.updateFAQ(faqId, form as UpdateFAQDto);
      }
      onSave();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to save FAQ");
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="p-4">Loading FAQ data...</div>;
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
          htmlFor="question" 
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Question
        </label>
        <input
          type="text"
          id="question"
          name="question"
          value={form.question}
          onChange={handleChange}
          className="w-full p-2 border rounded-lg focus:ring-green-500 focus:border-green-500"
          required
        />
      </div>

      <div>
        <label 
          htmlFor="answer" 
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Answer
        </label>
        <textarea
          id="answer"
          name="answer"
          rows={6}
          value={form.answer}
          onChange={handleChange}
          className={`w-full p-2 border rounded-lg focus:ring-green-500 focus:border-green-500 ${
            validationErrors.answer ? "border-red-500" : ""
          }`}
          required
        />
        {validationErrors.answer && (
          <p className="mt-1 text-sm text-red-600">{validationErrors.answer}</p>
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

      <div className="flex items-center">
        <input
          type="checkbox"
          id="isPublished"
          name="isPublished"
          checked={form.isPublished ?? true}
          onChange={handleCheckboxChange}
          className="h-4 w-4 rounded border text-green-600 focus:ring-green-500"
        />
        <label
          htmlFor="isPublished"
          className="ml-2 block text-sm text-gray-700"
        >
          Published
        </label>
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
          {isSaving ? "Saving..." : isNew ? "Create FAQ" : "Update FAQ"}
        </button>
      </div>
    </form>
  );
} 