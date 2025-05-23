import { Edit, Plus, Search, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { serviceApi } from "../api/serviceApi";
import { ServiceForm } from "../components/services/ServiceForm";
import { SlidePanel } from "../components/ui/SlidePanel";
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

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters((prev) => ({ ...prev, search: searchTerm }));
    setCurrentPage(1);
  };

  // Handle status filter
  const handleStatusFilter = (status: string | null) => {
    setFilters((prev) => ({
      ...prev,
      isActive: status === null ? undefined : status === 'active',
    }));
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

  // Handle toggle service active status
  const handleToggleStatus = async (serviceId: string) => {
    try {
      await serviceApi.toggleServiceStatus(serviceId);
      // Refresh service list
      const result = await serviceApi.getServices(filters, currentPage, 10);
      setServices(result.data);
    } catch (err) {
      console.error("Failed to toggle service status", err);
      alert("Failed to update service status. Please try again later.");
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

  // Format price to currency
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Services</h1>
        <button
          onClick={handleCreateService}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-shopme-600 hover:bg-shopme-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-shopme-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Service
        </button>
      </div>

      <div className="bg-white shadow rounded-lg mb-6">
        <div className="p-4 border-b border-gray-200 flex flex-wrap gap-4">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 min-w-[250px]">
            <div className="relative">
              <input
                type="text"
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-shopme-500 focus:border-transparent"
                placeholder="Search services..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="absolute left-3 top-2.5">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          </form>

          {/* Status filter */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Status:</span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleStatusFilter(null)}
                className={`px-3 py-1 rounded-md text-sm ${
                  filters.isActive === undefined
                    ? "bg-shopme-100 text-shopme-700"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                All
              </button>
              <button
                onClick={() => handleStatusFilter('active')}
                className={`px-3 py-1 rounded-md text-sm ${
                  filters.isActive === true
                    ? "bg-shopme-100 text-shopme-700"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Active
              </button>
              <button
                onClick={() => handleStatusFilter('inactive')}
                className={`px-3 py-1 rounded-md text-sm ${
                  filters.isActive === false
                    ? "bg-shopme-100 text-shopme-700"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Inactive
              </button>
            </div>
          </div>
        </div>

        {/* Services list */}
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
                      <div className="text-sm font-medium text-gray-900">
                        {service.name}
                      </div>
                      <div className="text-sm text-gray-500 truncate max-w-md">
                        {service.description}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatPrice(service.price)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          service.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {service.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEditService(service.id)}
                        className="text-shopme-600 hover:text-shopme-900 mr-4"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(service.id)}
                        className={`mr-4 ${
                          service.isActive
                            ? "text-yellow-600 hover:text-yellow-900"
                            : "text-green-600 hover:text-green-900"
                        }`}
                        title={
                          service.isActive ? "Deactivate Service" : "Activate Service"
                        }
                      >
                        {service.isActive ? (
                          <ToggleRight className="h-4 w-4" />
                        ) : (
                          <ToggleLeft className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDeleteService(service.id)}
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
        {!loading && services.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`px-3 py-1 rounded-md text-sm ${
                  currentPage === 1
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Previous
              </button>
              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className={`px-3 py-1 rounded-md text-sm ${
                  currentPage === totalPages
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit/Create Service Panel */}
      <SlidePanel
        isOpen={isEditing || isCreating}
        onClose={() => {
          setIsEditing(false);
          setIsCreating(false);
          setSelectedServiceId(null);
        }}
        title={isEditing ? "Edit Service" : "Create New Service"}
      >
        <ServiceForm
          serviceId={selectedServiceId || undefined}
          isNew={isCreating}
          onSave={handleSave}
          onCancel={() => {
            setIsEditing(false);
            setIsCreating(false);
            setSelectedServiceId(null);
          }}
        />
      </SlidePanel>
    </div>
  );
} 