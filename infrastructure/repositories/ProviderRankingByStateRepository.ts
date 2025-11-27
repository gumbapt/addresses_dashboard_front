import { ApiClient } from '~/infrastructure/http/ApiClient';
import type { ProviderRankingByStateResponse, ProviderRankingByStateFilters } from '~/types/api';

export class ProviderRankingByStateRepository {
  private apiClient: ApiClient;

  constructor() {
    this.apiClient = new ApiClient();
  }

  /**
   * Get provider rankings by state with filters
   */
  async getRankingsByState(filters: ProviderRankingByStateFilters): Promise<ProviderRankingByStateResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      // state_id is required
      queryParams.append('state_id', filters.state_id.toString());
      
      if (filters.provider_id) {
        queryParams.append('provider_id', filters.provider_id.toString());
      }
      if (filters.period) {
        queryParams.append('period', filters.period);
      }
      if (filters.date_from) {
        queryParams.append('date_from', filters.date_from);
      }
      if (filters.date_to) {
        queryParams.append('date_to', filters.date_to);
      }
      if (filters.sort_by) {
        queryParams.append('sort_by', filters.sort_by);
      }
      if (filters.aggregate_by_provider !== undefined) {
        queryParams.append('aggregate_by_provider', filters.aggregate_by_provider ? 'true' : 'false');
      }
      
      const url = `/reports/global/provider-ranking-by-state?${queryParams.toString()}`;
      console.log('🔍 ProviderRankingByStateRepository - URL:', url);
      
      const response = await this.apiClient.get<ProviderRankingByStateResponse>(url);
      console.log('🔍 ProviderRankingByStateRepository - Response:', response);
      
      return response;
    } catch (error) {
      console.error('ProviderRankingByStateRepository - getRankingsByState error:', error);
      throw error;
    }
  }
}

