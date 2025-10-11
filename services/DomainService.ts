import type {
  Domain,
  DomainsListResponse,
  DomainResponse,
  ApiResponse,
  CreateDomainRequest,
  UpdateDomainRequest
} from '~/types/api';
import { DomainRepository } from '~/infrastructure/repositories/DomainRepository';

export class DomainService {
  private domainRepository: DomainRepository;

  constructor() {
    this.domainRepository = new DomainRepository();
  }

  async getDomains(page: number = 1, perPage: number = 15, search?: string, isActive?: boolean): Promise<ApiResponse<DomainsListResponse>> {
    try {
      const response = await this.domainRepository.getDomains(page, perPage, search, isActive);
      
      return {
        success: response.success,
        data: response,
        message: 'Domains loaded successfully'
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  async getDomain(id: number): Promise<ApiResponse<Domain>> {
    try {
      const response = await this.domainRepository.getDomain(id);
      
      return {
        success: response.success,
        data: response.data,
        message: 'Domain loaded successfully'
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  async createDomain(data: CreateDomainRequest): Promise<ApiResponse<Domain>> {
    try {
      const response = await this.domainRepository.createDomain(data);
      
      return {
        success: response.success,
        data: response.data,
        message: response.message || 'Domain created successfully'
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  async updateDomain(id: number, data: UpdateDomainRequest): Promise<ApiResponse<Domain>> {
    try {
      const response = await this.domainRepository.updateDomain(id, data);
      
      return {
        success: response.success,
        data: response.data,
        message: response.message || 'Domain updated successfully'
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  async deleteDomain(id: number): Promise<ApiResponse<boolean>> {
    try {
      const response = await this.domainRepository.deleteDomain(id);
      
      return {
        success: response.success,
        data: response.success,
        message: response.message || 'Domain deleted successfully'
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  async regenerateApiKey(id: number): Promise<ApiResponse<Domain>> {
    try {
      const response = await this.domainRepository.regenerateApiKey(id);
      
      return {
        success: response.success,
        data: response.data,
        message: 'API key regenerated successfully'
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }
}
