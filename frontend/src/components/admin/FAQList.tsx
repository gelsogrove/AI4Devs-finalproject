import { Edit, Plus, Search, Trash2, Zap } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { faqApi } from "../../api/faqApi";
import { FAQ, FAQFilters } from "../../types/faq";
import { Button } from "../ui/button";
import { SlidePanel } from "../ui/SlidePanel";
import { toast } from "../ui/use-toast";
import { FAQForm } from "./FAQForm";

export function FAQList() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<FAQFilters>({});
  const [selectedFaqId, setSelectedFaqId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [generatingEmbeddings, setGeneratingEmbeddings] = useState(false);

  // Add function to generate embeddings for all FAQs
  const handleGenerateEmbeddings = async () => {
    try {
      setGeneratingEmbeddings(true);
      await faqApi.generateEmbeddingsForAllFAQs();
      toast({
        title: "Embeddings generated",
        description: "Embeddings for all FAQs have been generated successfully.",
      });
    } catch (err) {
      console.error("Failed to generate embeddings", err);
      toast({
        title: "Error",
        description: "Failed to generate embeddings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGeneratingEmbeddings(false);
    }
  };

  // Load FAQs with filters
  const loadFaqs = useCallback(async () => {
    setLoading(true);
    try {
      const result = await faqApi.getFAQs(filters, currentPage, 10);
      setFaqs(result.data);
      setTotalPages(result.pagination.totalPages);
    } catch (err) {
      console.error("Failed to load FAQs", err);
      setError("Failed to load FAQs. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, [filters, currentPage]);

  useEffect(() => {
    loadFaqs();
  }, [loadFaqs]);

  // Apply filters
  const applyFilters = () => {
    setFilters({
      search: searchTerm,
    });
    setCurrentPage(1);
  };

  // Reset filters
  const resetFilters = () => {
    setSearchTerm("");
    setFilters({});
    setCurrentPage(1);
  };

  // Handle edit
  const handleEditFaq = (faqId: string) => {
    setSelectedFaqId(faqId);
    setIsEditing(true);
  };

  // Handle create
  const handleCreateFaq = () => {
    setIsCreating(true);
  };

  // Handle delete
  const handleDeleteFaq = async (faqId: string) => {
    if (window.confirm("Are you sure you want to delete this FAQ?")) {
      try {
        await faqApi.deleteFAQ(faqId);
        loadFaqs();
      } catch (err) {
        console.error("Failed to delete FAQ", err);
        toast({
          title: "Error",
          description: "Failed to delete FAQ. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  // Handle save (create or edit)
  const handleSave = () => {
    setIsEditing(false);
    setIsCreating(false);
    setSelectedFaqId(null);
    loadFaqs();
  };

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">FAQs</h1>
        <div className="flex gap-2">
          <Button
            onClick={handleGenerateEmbeddings}
            className="bg-purple-600 hover:bg-purple-700"
            disabled={generatingEmbeddings}
          >
            <Zap className="mr-2 h-4 w-4" />
            {generatingEmbeddings ? "Generating..." : "Generate Embeddings"}
          </Button>
          <Button
            onClick={handleCreateFaq}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add FAQ
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 flex gap-2">
        <form onSubmit={handleSearch} className="flex-1">
          <div className="relative">
            <input
              type="text"
              placeholder="Search FAQs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-green-500 focus:border-green-500"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            <button
              type="submit"
              className="absolute right-2 top-2 text-green-600 hover:text-green-700"
            >
              Search
            </button>
          </div>
        </form>

        <Button onClick={resetFilters} variant="ghost">
          Reset
        </Button>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 p-4 mb-6 rounded-md">
          <p className="text-destructive">{error}</p>
        </div>
      )}

      {/* FAQs table */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500">Loading FAQs...</p>
        </div>
      ) : faqs.length === 0 ? (
        <div className="bg-gray-50 p-6 text-center rounded-lg">
          <p className="text-gray-500">No FAQs found</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Question
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {faqs.map((faq) => (
                <tr key={faq.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {faq.question}
                    </div>
                    <div className="text-sm text-gray-500 truncate max-w-md">
                      {faq.answer}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEditFaq(faq.id)}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteFaq(faq.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <div className="flex gap-2">
            <Button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              variant="outline"
            >
              Previous
            </Button>
            <span className="flex items-center px-4 py-2 text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              variant="outline"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Edit FAQ Slide Panel */}
      <SlidePanel
        isOpen={isEditing}
        onClose={() => setIsEditing(false)}
        title="Edit FAQ"
      >
        {selectedFaqId && (
          <FAQForm
            faqId={selectedFaqId}
            onSave={handleSave}
            onCancel={() => setIsEditing(false)}
          />
        )}
      </SlidePanel>

      {/* Create FAQ Slide Panel */}
      <SlidePanel
        isOpen={isCreating}
        onClose={() => setIsCreating(false)}
        title="Create FAQ"
      >
        <FAQForm
          isNew
          onSave={handleSave}
          onCancel={() => setIsCreating(false)}
        />
      </SlidePanel>
    </div>
  );
} 