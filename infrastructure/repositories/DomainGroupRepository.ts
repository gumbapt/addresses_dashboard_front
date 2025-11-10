import { ApiClient } from '~/infrastructure/http/ApiClient';
import type {
  Domain,
  DomainGroup,
  DomainGroupsListResponse,
  DomainGroupResponse,
  CreateDomainGroupRequest,
  UpdateDomainGroupRequest,
  ApiResponse
} from '~/types/api';

export class DomainGroupRepository {
  private apiClient: ApiClient;

  constructor() {
    this.apiClient = new ApiClient();
  }

  /**
   * List all domain groups
   */
  async list(params?: {
    page?: number;
    per_page?: number;
    search?: string;
    is_active?: boolean;
    with_count?: boolean;
  }): Promise<DomainGroupsListResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
      if (params?.search) queryParams.append('search', params.search);
      if (params?.is_active !== undefined) queryParams.append('is_active', params.is_active.toString());
      
      // Always request domain count for display in the table
      queryParams.append('with_count', 'true');
      
      const url = `/domain-groups${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      console.log('🔍 DomainGroupRepository - list URL:', url);
      const response = await this.apiClient.get<DomainGroupsListResponse>(url);
      console.log('🔍 DomainGroupRepository - list response:', response);
      return response;
    } catch (error) {
      console.error('DomainGroupRepository - list error:', error);
      throw error;
    }
  }

  /**
   * Get specific domain group
   */
  async get(id: number): Promise<DomainGroupResponse> {
    try {
      return await this.apiClient.get<DomainGroupResponse>(`/domain-groups/${id}`);
    } catch (error) {
      console.error('DomainGroupRepository - get error:', error);
      throw error;
    }
  }

  /**
   * Create domain group (Super Admin only)
   */
  async create(data: CreateDomainGroupRequest): Promise<DomainGroupResponse> {
    try {
      return await this.apiClient.post<DomainGroupResponse>('/domain-groups', data);
    } catch (error) {
      console.error('DomainGroupRepository - create error:', error);
      throw error;
    }
  }

  /**
   * Update domain group (Super Admin only)
   */
  async update(id: number, data: UpdateDomainGroupRequest): Promise<DomainGroupResponse> {
    try {
      return await this.apiClient.put<DomainGroupResponse>(`/domain-groups/${id}`, data);
    } catch (error) {
      console.error('DomainGroupRepository - update error:', error);
      throw error;
    }
  }

  /**
   * Delete domain group (Super Admin only)
   */
  async delete(id: number): Promise<ApiResponse<void>> {
    try {
      return await this.apiClient.delete<ApiResponse<void>>(`/domain-groups/${id}`);
    } catch (error) {
      console.error('DomainGroupRepository - delete error:', error);
      throw error;
    }
  }

  /**
   * Get domains of a specific group
   */
  async getGroupDomains(id: number): Promise<any> {
    try {
      console.log('🔍 DomainGroupRepository - getGroupDomains called with id:', id);
      const response = await this.apiClient.get<any>(`/domain-groups/${id}/domains`);
      console.log('🔍 DomainGroupRepository - getGroupDomains raw response:', response);
      return response;
    } catch (error) {
      console.error('DomainGroupRepository - getGroupDomains error:', error);
      throw error;
    }
  }

  /**
   * Add multiple domains to a group (Batch operation)
   */
  async addDomainsToGroup(id: number, domainIds: number[]): Promise<ApiResponse<any>> {
    try {
      return await this.apiClient.post<ApiResponse<any>>(`/domain-groups/${id}/domains`, {
        domain_ids: domainIds
      });
    } catch (error) {
      console.error('DomainGroupRepository - addDomainsToGroup error:', error);
      throw error;
    }
  }

  /**
   * Remove multiple domains from a group (Batch operation)
   */
  async removeDomainsFromGroup(id: number, domainIds: number[]): Promise<ApiResponse<any>> {
    try {
      return await this.apiClient.deleteWithBody<ApiResponse<any>>(
        `/domain-groups/${id}/domains`, 
        { domain_ids: domainIds }
      );
    } catch (error) {
      console.error('DomainGroupRepository - removeDomainsFromGroup error:', error);
      throw error;
    }
  }
}

