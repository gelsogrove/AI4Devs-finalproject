import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { faqApi } from "../../api/faqApi";
import { CreateFAQDto } from "../../types/faq";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { MarkdownViewer } from "../ui/markdown-viewer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Textarea } from "../ui/textarea";
import { toast } from "../ui/use-toast";

interface FAQFormProps {
  faqId?: string;
  isNew?: boolean;
  onSave: () => void;
  onCancel: () => void;
  categories: string[];
}

export function FAQForm({ faqId, isNew = false, onSave, onCancel, categories }: FAQFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("write");
  const [newCategory, setNewCategory] = useState<string>("");
  const [tagInput, setTagInput] = useState("");
  
  const formSchema = z.object({
    question: z.string().min(5, "Question must be at least 5 characters"),
    answer: z.string().min(10, "Answer must be at least 10 characters"),
    category: z.string().optional(),
    tags: z.array(z.string()).default([]),
  });
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      question: "",
      answer: "",
      category: "",
      tags: [],
    }
  });
  
  const tags = watch("tags");
  const selectedCategory = watch("category");
  
  // Load FAQ data if editing an existing FAQ
  useEffect(() => {
    async function loadFAQ() {
      if (!isNew && faqId) {
        setIsLoading(true);
        try {
          const faq = await faqApi.getFAQById(faqId);
          reset({
            question: faq.question,
            answer: faq.answer,
            category: faq.category || '',
            tags: faq.tags || [],
          });
        } catch (err) {
          setError("Failed to load FAQ data");
          console.error(err);
        } finally {
          setIsLoading(false);
        }
      }
    }
    
    loadFAQ();
  }, [faqId, isNew, reset]);
  
  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim().toLowerCase())) {
      setValue("tags", [...tags, tagInput.trim().toLowerCase()]);
      setTagInput("");
    }
  };
  
  const removeTag = (tagToRemove: string) => {
    setValue(
      "tags",
      tags.filter((tag) => tag !== tagToRemove)
    );
  };
  
  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };
  
  const handleCategorySelect = (category: string) => {
    setValue("category", category);
  };
  
  const handleAddNewCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      setValue("category", newCategory.trim());
      setNewCategory("");
      toast({
        title: "New category added",
        description: "The new category will be saved when you save the FAQ."
      });
    }
  };
  
  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setError(null);
    setIsSaving(true);
    
    try {
      if (isNew) {
        await faqApi.createFAQ(data as CreateFAQDto);
      } else if (faqId) {
        await faqApi.updateFAQ(faqId, data);
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-4">
      {error && (
        <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
          {error}
        </div>
      )}
      
      <div className="space-y-2">
        <label htmlFor="question" className="block font-medium">
          Question <span className="text-red-600">*</span>
        </label>
        <Input
          id="question"
          {...register("question")}
          placeholder="Enter the question"
          className={errors.question ? "border-red-500" : ""}
        />
        {errors.question && (
          <p className="text-sm text-red-600">{errors.question.message}</p>
        )}
      </div>
      
      <div className="space-y-2">
        <label htmlFor="answer" className="block font-medium">
          Answer <span className="text-red-600">*</span>
        </label>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList>
            <TabsTrigger value="write">Write</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>
          <TabsContent value="write" className="p-0">
            <Textarea
              id="answer"
              {...register("answer")}
              placeholder="Enter the answer (Markdown supported)"
              rows={8}
              className={errors.answer ? "border-red-500" : ""}
            />
          </TabsContent>
          <TabsContent value="preview" className="p-0">
            <div className="min-h-[200px] border rounded-md p-4 bg-white">
              <MarkdownViewer content={watch("answer")} />
            </div>
          </TabsContent>
        </Tabs>
        {errors.answer && (
          <p className="text-sm text-red-600">{errors.answer.message}</p>
        )}
      </div>
      
      <div className="space-y-2">
        <label htmlFor="category" className="block font-medium">
          Category
        </label>
        <div className="space-y-3">
          {/* Existing categories */}
          <div className="flex flex-wrap gap-2">
            <Badge 
              variant={selectedCategory === "" ? "default" : "outline"} 
              className="cursor-pointer"
              onClick={() => handleCategorySelect("")}
            >
              None
            </Badge>
            {categories.map((category) => (
              <Badge
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => handleCategorySelect(category)}
              >
                {category}
              </Badge>
            ))}
          </div>
          
          {/* Add new category */}
          <div className="flex">
            <Input
              placeholder="Add new category"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="rounded-r-none"
            />
            <Button 
              type="button" 
              onClick={handleAddNewCategory} 
              className="rounded-l-none"
              disabled={!newCategory.trim()}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
          
          {/* Show selected category */}
          {selectedCategory && (
            <div className="mt-2">
              <p className="text-sm text-gray-600">Selected category:</p>
              <Badge className="mt-1">
                {selectedCategory}
                <button
                  type="button"
                  onClick={() => setValue("category", "")}
                  className="ml-1 hover:text-red-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            </div>
          )}
        </div>
      </div>
      
      <div className="space-y-2">
        <label htmlFor="tags" className="block font-medium">
          Tags
        </label>
        <div className="flex">
          <Input
            id="tag-input"
            placeholder="Add a tag"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagInputKeyDown}
            className="rounded-r-none"
          />
          <Button
            type="button"
            onClick={addTag}
            className="rounded-l-none"
            disabled={!tagInput.trim()}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1">
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="hover:text-red-600"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      </div>
      
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? "Saving..." : "Save FAQ"}
        </Button>
      </div>
    </form>
  );
} 