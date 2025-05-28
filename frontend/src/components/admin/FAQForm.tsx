import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { faqApi } from "../../api/faqApi";
import { CreateFAQDto } from "../../types/faq";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { MarkdownViewer } from "../ui/markdown-viewer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Textarea } from "../ui/textarea";

interface FAQFormProps {
  faqId?: string;
  isNew?: boolean;
  onSave: () => void;
  onCancel: () => void;
}

export function FAQForm({ faqId, isNew = false, onSave, onCancel }: FAQFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("write");
  
  const formSchema = z.object({
    question: z.string().min(5, "Question must be at least 5 characters"),
    answer: z.string().min(10, "Answer must be at least 10 characters"),
  });
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      question: "",
      answer: "",
    }
  });
  
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