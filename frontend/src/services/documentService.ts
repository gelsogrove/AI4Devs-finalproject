import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '';
const DOCUMENTS_ENDPOINT = API_URL ? `${API_URL}/api/documents` : '/api/documents';

// Get authentication token from localStorage
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

export interface Document {
  id: string;
  filename: string;
  originalName: string;
  title?: string;
  size: number;
  status: 'UPLOADING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  isActive: boolean;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentStats {
  totalDocuments: number;
  totalSize: number;
  statusBreakdown: Record<string, number>;
}

export interface DocumentListResponse {
  documents: Document[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export interface DocumentSearchResponse extends DocumentListResponse {
  query?: string;
}

export interface UploadDocumentRequest {
  document: File;
  title?: string;
}

export interface UploadDocumentResponse {
  message: string;
  document: Document;
}

export interface UpdateDocumentRequest {
  title?: string;
  filename?: string;
  isActive?: boolean;
}

export interface UpdateDocumentResponse {
  message: string;
  document: Document;
}

class DocumentService {
  /**
   * Upload a new document
   */
  async uploadDocument(request: UploadDocumentRequest): Promise<UploadDocumentResponse> {
    const formData = new FormData();
    formData.append('document', request.document);
    
    if (request.title) {
      formData.append('title', request.title);
    }

    const authHeaders = getAuthHeader();
    const response = await axios.post(`${DOCUMENTS_ENDPOINT}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        ...authHeaders.headers,
      },
    });

    return response.data;
  }

  /**
   * Get user documents with pagination
   */
  async getDocuments(limit = 10, offset = 0): Promise<DocumentListResponse> {
    const response = await axios.get(DOCUMENTS_ENDPOINT, {
      params: { limit, offset },
      ...getAuthHeader()
    });

    return response.data;
  }

  /**
   * Search documents
   */
  async searchDocuments(query: string, limit = 10, offset = 0): Promise<DocumentSearchResponse> {
    const response = await axios.get(`${DOCUMENTS_ENDPOINT}/search`, {
      params: { query, limit, offset },
      ...getAuthHeader()
    });

    return response.data;
  }

  /**
   * Get document by ID
   */
  async getDocumentById(id: string): Promise<Document> {
    const response = await axios.get(`${DOCUMENTS_ENDPOINT}/${id}`, getAuthHeader());
    return response.data;
  }

  /**
   * Delete document
   */
  async deleteDocument(id: string): Promise<{ message: string }> {
    const response = await axios.delete(`${DOCUMENTS_ENDPOINT}/${id}`, getAuthHeader());
    return response.data;
  }

  /**
   * Get document statistics
   */
  async getDocumentStats(): Promise<DocumentStats> {
    const response = await axios.get(`${DOCUMENTS_ENDPOINT}/stats`, getAuthHeader());
    return response.data;
  }

  /**
   * Generate embeddings for a specific document
   */
  async generateEmbeddingsForDocument(documentId: string): Promise<{ message: string; documentId: string }> {
    const response = await axios.post(`${DOCUMENTS_ENDPOINT}/${documentId}/embeddings`, {}, getAuthHeader());
    return response.data;
  }

  /**
   * Generate embeddings for all documents
   */
  async generateEmbeddingsForAllDocuments(): Promise<{ message: string; count: number }> {
    const response = await axios.post(`${DOCUMENTS_ENDPOINT}/embeddings`, {}, getAuthHeader());
    return response.data;
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Get status color for UI
   */
  getStatusColor(status: Document['status']): string {
    switch (status) {
      case 'COMPLETED':
        return 'text-green-600';
      case 'PROCESSING':
        return 'text-blue-600';
      case 'UPLOADING':
        return 'text-yellow-600';
      case 'FAILED':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  }

  /**
   * Get status badge color for UI
   */
  getStatusBadgeColor(status: Document['status']): string {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'PROCESSING':
        return 'bg-blue-100 text-blue-800';
      case 'UPLOADING':
        return 'bg-yellow-100 text-yellow-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  /**
   * Update document
   */
  async updateDocument(id: string, request: UpdateDocumentRequest): Promise<UpdateDocumentResponse> {
    const response = await axios.put(`${DOCUMENTS_ENDPOINT}/${id}`, request, getAuthHeader());
    return response.data;
  }
}

export const documentService = new DocumentService(); 