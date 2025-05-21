import { Edit, Plus, Search, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { faqApi } from "../api/faqApi";
import { FAQForm } from "../components/faqs/FAQForm";
import { SlidePanel } from "../components/ui/SlidePanel";
import { FAQ, FAQFilters } from "../types/faq";

export default function FAQs() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<FAQFilters>({});
  const [selectedFAQId, setSelectedFAQId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Load FAQs when page loads or filters change
  useEffect(() => {
    async function loadFAQs() {
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
    }

    loadFAQs();
  }, [filters, currentPage]);

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters((prev) => ({ ...prev, search: searchTerm }));
    setCurrentPage(1);
  };

  // Handle category filter
  const handleCategoryFilter = (category: string | null) => {
    setFilters((prev) => ({
      ...prev,
      category: category || undefined,
    }));
    setCurrentPage(1);
  };

  // Handle status filter
  const handleStatusFilter = (status: string | null) => {
    setFilters((prev) => ({
      ...prev,
      isPublished: status === null ? undefined : status === 'published',
    }));
    setCurrentPage(1);
  };

  // Handle FAQ edit
  const handleEditFAQ = (faqId: string) => {
    setSelectedFAQId(faqId);
    setIsEditing(true);
  };

  // Handle FAQ create
  const handleCreateFAQ = () => {
    setIsCreating(true);
  };

  // Handle FAQ delete
  const handleDeleteFAQ = async (faqId: string) => {
    if (window.confirm("Are you sure you want to delete this FAQ?")) {
      try {
        await faqApi.deleteFAQ(faqId);
        // Refresh FAQ list
        const result = await faqApi.getFAQs(filters, currentPage, 10);
        setFaqs(result.data);
        setTotalPages(result.pagination.totalPages);
      } catch (err) {
        console.error("Failed to delete FAQ", err);
        alert("Failed to delete FAQ. Please try again later.");
      }
    }
  };

  // Handle toggle FAQ publication status
  const handleToggleStatus = async (faqId: string) => {
    try {
      await faqApi.toggleFAQStatus(faqId);
      // Refresh FAQ list
      const result = await faqApi.getFAQs(filters, currentPage, 10);
      setFaqs(result.data);
    } catch (err) {
      console.error("Failed to toggle FAQ status", err);
      alert("Failed to update FAQ status. Please try again later.");
    }
  };

  // Handle save (create or edit)
  const handleSave = () => {
    // Close edit/create panel
    setIsEditing(false);
    setIsCreating(false);
    setSelectedFAQId(null);

    // Reload FAQs
    faqApi.getFAQs(filters, currentPage, 10).then((result) => {
      setFaqs(result.data);
      setTotalPages(result.pagination.totalPages);
    });
  };

  // Get unique categories from FAQs for the filter
  const categories = Array.from(
    new Set(faqs.filter(faq => faq.category).map((faq) => faq.category as string))
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">FAQs</h1>
        <button
          onClick={handleCreateFAQ}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg flex items-center"
        >
          <Plus className="mr-2 h-4 w-4" /> Add FAQ
        </button>
      </div>

      {/* Search and filters */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row gap-4">
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

          <div className="w-full md:w-64">
            <select
              value={filters.category || ""}
              onChange={(e) =>
                handleCategoryFilter(
                  e.target.value === "" ? null : e.target.value
                )
              }
              className="w-full border rounded-lg p-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div className="w-full md:w-64">
            <select
              value={
                filters.isPublished === undefined
                  ? ""
                  : filters.isPublished
                  ? "published"
                  : "unpublished"
              }
              onChange={(e) =>
                handleStatusFilter(
                  e.target.value === "" ? null : e.target.value
                )
              }
              className="w-full border rounded-lg p-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="">All Status</option>
              <option value="published">Published</option>
              <option value="unpublished">Unpublished</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 p-4 mb-6 rounded-md">
          <p className="text-red-700">{error}</p>
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
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Category
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Status
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
                  <td className="px-6 py-4 whitespace-nowrap">
                    {faq.category && (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        {faq.category}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        faq.isPublished
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {faq.isPublished ? "Published" : "Unpublished"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEditFAQ(faq.id)}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleToggleStatus(faq.id)}
                      className={`mr-4 ${
                        faq.isPublished
                          ? "text-yellow-600 hover:text-yellow-900"
                          : "text-green-600 hover:text-green-900"
                      }`}
                      title={
                        faq.isPublished ? "Unpublish FAQ" : "Publish FAQ"
                      }
                    >
                      {faq.isPublished ? (
                        <ToggleRight className="h-4 w-4" />
                      ) : (
                        <ToggleLeft className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDeleteFAQ(faq.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
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
          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                currentPage === 1
                  ? "text-gray-300 cursor-not-allowed"
                  : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              Previous
            </button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                  currentPage === i + 1
                    ? "z-10 bg-green-50 border-green-500 text-green-600"
                    : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                currentPage === totalPages
                  ? "text-gray-300 cursor-not-allowed"
                  : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              Next
            </button>
          </nav>
        </div>
      )}

      {/* Edit/Create Panel */}
      <SlidePanel
        isOpen={isEditing || isCreating}
        onClose={() => {
          setIsEditing(false);
          setIsCreating(false);
          setSelectedFAQId(null);
        }}
        title={isEditing ? "Edit FAQ" : "Create New FAQ"}
      >
        <FAQForm
          faqId={selectedFAQId || undefined}
          isNew={isCreating}
          onSave={handleSave}
          onCancel={() => {
            setIsEditing(false);
            setIsCreating(false);
            setSelectedFAQId(null);
          }}
        />
      </SlidePanel>
    </div>
  );
}
