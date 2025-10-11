import type {
  DomainsListResponse,
  DomainResponse,
  CreateDomainRequest,
  UpdateDomainRequest
} from '~/types/api';
import { ApiClient } from '../http/ApiClient';

export class DomainRepository {
  private apiClient: ApiClient;

  constructor() {
    this.apiClient = new ApiClient();
  }

  async getDomains(page: number = 1, perPage: number = 15, search?: string, isActive?: boolean): Promise<DomainsListResponse> {
    try {
      let url = `/domains?page=${page}&per_page=${perPage}`;
      
      if (search) {
        url += `&search=${encodeURIComponent(search)}`;
      }
      
      if (isActive !== undefined) {
        url += `&is_active=${isActive}`;
      }
      
      const response = await this.apiClient.get<DomainsListResponse>(url);
      return response;
    } catch (error) {
      console.error('Get domains failed:', error);
      throw new Error('Failed to fetch domains');
    }
  }

  async getDomain(id: number): Promise<DomainResponse> {
    try {
      const response = await this.apiClient.get<DomainResponse>(`/domains/${id}`);
      return response;
    } catch (error) {
      console.error('Get domain failed:', error);
      throw new Error('Failed to fetch domain');
    }
  }

  async createDomain(data: CreateDomainRequest): Promise<DomainResponse> {
    try {
      const response = await this.apiClient.post<DomainResponse>('/domains', data);
      return response;
    } catch (error) {
      console.error('Create domain failed:', error);
      throw new Error('Failed to create domain');
    }
  }

  async updateDomain(id: number, data: UpdateDomainRequest): Promise<DomainResponse> {
    try {
      const response = await this.apiClient.put<DomainResponse>(`/domains/${id}`, data);
      return response;
    } catch (error) {
      console.error('Update domain failed:', error);
      throw new Error('Failed to update domain');
    }
  }

  async deleteDomain(id: number): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.apiClient.delete<{ success: boolean; message: string }>(`/domains/${id}`);
      return response;
    } catch (error) {
      console.error('Delete domain failed:', error);
      throw new Error('Failed to delete domain');
    }
  }

  async regenerateApiKey(id: number): Promise<DomainResponse> {
    try {
      const response = await this.apiClient.post<DomainResponse>(`/domains/${id}/regenerate-api-key`);
      return response;
    } catch (error) {
      console.error('Regenerate API key failed:', error);
      throw new Error('Failed to regenerate API key');
    }
  }
}
