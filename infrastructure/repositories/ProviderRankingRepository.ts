import { ApiClient } from '~/infrastructure/http/ApiClient';
import type { ProviderRankingResponse, ProviderRankingFilters } from '~/types/api';

export class ProviderRankingRepository {
  private apiClient: ApiClient;

  constructor() {
    this.apiClient = new ApiClient();
  }

  /**
   * Get provider rankings with filters
   */
  async getRankings(filters?: ProviderRankingFilters): Promise<ProviderRankingResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters?.provider_id) {
        queryParams.append('provider_id', filters.provider_id.toString());
      }
      if (filters?.technology) {
        queryParams.append('technology', filters.technology);
      }
      if (filters?.period) {
        queryParams.append('period', filters.period);
      }
      if (filters?.date_from) {
        queryParams.append('date_from', filters.date_from);
      }
      if (filters?.date_to) {
        queryParams.append('date_to', filters.date_to);
      }
      if (filters?.sort_by) {
        queryParams.append('sort_by', filters.sort_by);
      }
      if (filters?.aggregate_by_provider !== undefined) {
        queryParams.append('aggregate_by_provider', filters.aggregate_by_provider ? 'true' : 'false');
      }
      
      // Pagination (preferred over limit)
      if (filters?.page) {
        queryParams.append('page', filters.page.toString());
      }
      if (filters?.per_page) {
        queryParams.append('per_page', filters.per_page.toString());
      }
      
      // Legacy limit support (if no pagination params)
      if (filters?.limit && !filters?.page && !filters?.per_page) {
        queryParams.append('limit', filters.limit.toString());
      }
      
      const url = `/reports/global/provider-ranking${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      console.log('🔍 ProviderRankingRepository - URL:', url);
      
      const response = await this.apiClient.get<ProviderRankingResponse>(url);
      console.log('🔍 ProviderRankingRepository - Response:', response);
      
      return response;
    } catch (error) {
      console.error('ProviderRankingRepository - getRankings error:', error);
      throw error;
    }
  }
}

