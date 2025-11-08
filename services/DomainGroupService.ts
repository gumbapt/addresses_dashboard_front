import { DomainGroupRepository } from '~/infrastructure/repositories/DomainGroupRepository';
import type {
  Domain,
  DomainGroup,
  CreateDomainGroupRequest,
  UpdateDomainGroupRequest,
  ApiResponse
} from '~/types/api';

export class DomainGroupService {
  private domainGroupRepository: DomainGroupRepository;

  constructor() {
    this.domainGroupRepository = new DomainGroupRepository();
  }

  /**
   * Get all domain groups with optional filters
   */
  async getDomainGroups(filters?: {
    page?: number;
    per_page?: number;
    search?: string;
    is_active?: boolean;
  }): Promise<ApiResponse<{ data: DomainGroup[]; pagination: any }>> {
    try {
      const response = await this.domainGroupRepository.list(filters);
      
      return {
        success: response.success,
        data: {
          data: response.data || [],
          pagination: response.pagination
        }
      };
    } catch (error) {
      console.error('DomainGroupService - getDomainGroups error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch domain groups'
      };
    }
  }

  /**
   * Get specific domain group
   */
  async getDomainGroup(id: number): Promise<ApiResponse<DomainGroup>> {
    try {
      const response = await this.domainGroupRepository.get(id);
      
      if (response.success && response.data) {
        return {
          success: true,
          data: response.data
        };
      }
      
      return {
        success: false,
        error: response.message || 'Failed to fetch domain group'
      };
    } catch (error) {
      console.error('DomainGroupService - getDomainGroup error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch domain group'
      };
    }
  }

  /**
   * Create domain group (Super Admin only)
   */
  async createDomainGroup(data: CreateDomainGroupRequest): Promise<ApiResponse<DomainGroup>> {
    try {
      // Validation
      if (!data.name || data.name.trim() === '') {
        return {
          success: false,
          error: 'Group name is required'
        };
      }

      if (data.max_domains !== null && data.max_domains !== undefined && data.max_domains < 1) {
        return {
          success: false,
          error: 'Max domains must be at least 1 or null for unlimited'
        };
      }

      const response = await this.domainGroupRepository.create(data);
      
      if (response.success && response.data) {
        return {
          success: true,
          data: response.data,
          message: 'Domain group created successfully'
        };
      }
      
      return {
        success: false,
        error: response.message || 'Failed to create domain group'
      };
    } catch (error) {
      console.error('DomainGroupService - createDomainGroup error:', error);
      
      // Handle 403 Forbidden (not Super Admin)
      if ((error as any)?.response?.status === 403) {
        return {
          success: false,
          error: 'Access denied. Only Super Admins can create domain groups.'
        };
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create domain group'
      };
    }
  }

  /**
   * Update domain group (Super Admin only)
   */
  async updateDomainGroup(id: number, data: UpdateDomainGroupRequest): Promise<ApiResponse<DomainGroup>> {
    try {
      if (data.max_domains !== null && data.max_domains !== undefined && data.max_domains < 1) {
        return {
          success: false,
          error: 'Max domains must be at least 1 or null for unlimited'
        };
      }

      const response = await this.domainGroupRepository.update(id, data);
      
      if (response.success && response.data) {
        return {
          success: true,
          data: response.data,
          message: 'Domain group updated successfully'
        };
      }
      
      return {
        success: false,
        error: response.message || 'Failed to update domain group'
      };
    } catch (error) {
      console.error('DomainGroupService - updateDomainGroup error:', error);
      
      if ((error as any)?.response?.status === 403) {
        return {
          success: false,
          error: 'Access denied. Only Super Admins can update domain groups.'
        };
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update domain group'
      };
    }
  }

  /**
   * Delete domain group (Super Admin only)
   */
  async deleteDomainGroup(id: number): Promise<ApiResponse<void>> {
    try {
      const response = await this.domainGroupRepository.delete(id);
      
      if (response.success) {
        return {
          success: true,
          message: 'Domain group deleted successfully'
        };
      }
      
      return {
        success: false,
        error: response.message || 'Failed to delete domain group'
      };
    } catch (error) {
      console.error('DomainGroupService - deleteDomainGroup error:', error);
      
      if ((error as any)?.response?.status === 400) {
        return {
          success: false,
          error: 'Cannot delete group with associated domains. Remove domains first.'
        };
      }
      
      if ((error as any)?.response?.status === 403) {
        return {
          success: false,
          error: 'Access denied. Only Super Admins can delete domain groups.'
        };
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete domain group'
      };
    }
  }

  /**
   * Get domains in a specific group
   */
  async getGroupDomains(id: number): Promise<ApiResponse<Domain[]>> {
    try {
      const response = await this.domainGroupRepository.getGroupDomains(id);
      
      if (response.success && response.data) {
        return {
          success: true,
          data: response.data
        };
      }
      
      return {
        success: false,
        error: 'Failed to fetch group domains'
      };
    } catch (error) {
      console.error('DomainGroupService - getGroupDomains error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch group domains'
      };
    }
  }
}

