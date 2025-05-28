import { Edit, Plus, Search, Trash2, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { serviceApi } from "../api/serviceApi";
import { ServiceForm } from "../components/services/ServiceForm";
import { Button } from "../components/ui/button";
import { MarkdownViewer } from "../components/ui/markdown-viewer";
import { SlidePanel } from "../components/ui/SlidePanel";
import { toast } from "../components/ui/use-toast";
import { Service, ServiceFilters } from "../types/service";

export default function Services() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<ServiceFilters>({});
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedDescription, setExpandedDescription] = useState<string | null>(null);
  const [generatingEmbeddings, setGeneratingEmbeddings] = useState(false);

  // Add function to generate embeddings for all active services
  const handleGenerateEmbeddings = async () => {
    try {
      setGeneratingEmbeddings(true);
      await serviceApi.generateEmbeddingsForAllServices();
      toast({
        title: "Embeddings generated",
        description: "Embeddings for all active services have been generated successfully.",
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

  // Load services when page loads or filters change
  useEffect(() => {
    async function loadServices() {
      setLoading(true);
      try {
        const result = await serviceApi.getServices(filters, currentPage, 10);
        setServices(result.data);
        setTotalPages(result.pagination.totalPages);
      } catch (err) {
        console.error("Failed to load services", err);
        setError("Failed to load services. Please try again later.");
      } finally {
        setLoading(false);
      }
    }

    loadServices();
  }, [filters, currentPage]);

  // Reset filters
  const resetFilters = () => {
    setSearchTerm("");
    setFilters({});
    setCurrentPage(1);
  };

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters((prev) => ({ ...prev, search: searchTerm }));
    setCurrentPage(1);
  };

  // Handle service edit
  const handleEditService = (serviceId: string) => {
    setSelectedServiceId(serviceId);
    setIsEditing(true);
  };

  // Handle service create
  const handleCreateService = () => {
    setIsCreating(true);
  };

  // Handle service delete
  const handleDeleteService = async (serviceId: string) => {
    if (window.confirm("Are you sure you want to delete this service?")) {
      try {
        await serviceApi.deleteService(serviceId);
        // Refresh service list
        const result = await serviceApi.getServices(filters, currentPage, 10);
        setServices(result.data);
        setTotalPages(result.pagination.totalPages);
      } catch (err) {
        console.error("Failed to delete service", err);
        alert("Failed to delete service. Please try again later.");
      }
    }
  };

  // Toggle description expansion
  const toggleDescription = (serviceId: string) => {
    if (expandedDescription === serviceId) {
      setExpandedDescription(null);
    } else {
      setExpandedDescription(serviceId);
    }
  };

  // Handle save (create or edit)
  const handleSave = () => {
    // Close edit/create panel
    setIsEditing(false);
    setIsCreating(false);
    setSelectedServiceId(null);

    // Reload services
    serviceApi.getServices(filters, currentPage, 10).then((result) => {
      setServices(result.data);
      setTotalPages(result.pagination.totalPages);
    });
  };

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Services</h1>
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
            onClick={handleCreateService}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Service
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 flex gap-2">
        <form onSubmit={handleSearch} className="flex-1">
          <div className="relative">
            <input
              type="text"
              placeholder="Search services..."
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
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Services table */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500">Loading services...</p>
        </div>
      ) : services.length === 0 ? (
        <div className="bg-gray-50 p-6 text-center rounded-lg">
          <p className="text-gray-500">No services found</p>
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
                  Service
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Price
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
              {services.map((service) => (
                <tr key={service.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900 flex items-center">
                      {service.name}
                    </div>
                    
                    <div 
                      className="mt-1 cursor-pointer"
                      onClick={() => toggleDescription(service.id)}
                    >
                      {expandedDescription === service.id ? (
                        <div className="prose prose-sm max-w-none p-2 rounded bg-gray-50">
                          <MarkdownViewer content={service.description} />
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500 truncate max-w-md">
                          {service.description}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      {formatPrice(service.price)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      service.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {service.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEditService(service.id)}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                    >
                      <Edit className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteService(service.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="h-5 w-5" />
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
        <div className="mt-6 flex justify-center">
          <nav className="inline-flex rounded-md shadow">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i + 1}
                onClick={() => setCurrentPage(i + 1)}
                className={`px-4 py-2 text-sm font-medium ${
                  currentPage === i + 1
                    ? "bg-green-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                } ${
                  i === 0 ? "rounded-l-md" : ""
                } ${
                  i === totalPages - 1 ? "rounded-r-md" : ""
                }`}
              >
                {i + 1}
              </button>
            ))}
          </nav>
        </div>
      )}

      {/* Create/Edit Service Slide Panel */}
      <SlidePanel
        title={isCreating ? "Create Service" : "Edit Service"}
        isOpen={isCreating || isEditing}
        onClose={() => {
          setIsCreating(false);
          setIsEditing(false);
          setSelectedServiceId(null);
        }}
      >
        <ServiceForm
          serviceId={selectedServiceId || undefined}
          isNew={isCreating}
          onSave={handleSave}
          onCancel={() => {
            setIsCreating(false);
            setIsEditing(false);
            setSelectedServiceId(null);
          }}
        />
      </SlidePanel>
    </div>
  );
} 