import { ProviderRankingRepository } from '~/infrastructure/repositories/ProviderRankingRepository';
import type { 
  ProviderRanking,
  ProviderRankingFilters,
  ApiResponse 
} from '~/types/api';

export class ProviderRankingService {
  private providerRankingRepository: ProviderRankingRepository;

  constructor() {
    this.providerRankingRepository = new ProviderRankingRepository();
  }

  /**
   * Get provider rankings
   */
  async getProviderRankings(filters?: ProviderRankingFilters): Promise<ApiResponse<{
    rankings: ProviderRanking[];
    totalEntries: number;
    filters: ProviderRankingFilters;
    pagination?: any;
  }>> {
    try {
      console.log('🔍 ProviderRankingService - getProviderRankings filters:', filters);
      const response = await this.providerRankingRepository.getRankings(filters);
      console.log('🔍 ProviderRankingService - response:', response);
      
      if (response.success && response.data) {
        // Handle paginated response (new format)
        if (Array.isArray(response.data)) {
          return {
            success: true,
            data: {
              rankings: response.data,
              totalEntries: response.pagination?.total || response.data.length,
              filters: response.filters || {},
              pagination: response.pagination
            }
          };
        }
        
        // Handle legacy response (old format with limit)
        return {
          success: true,
          data: {
            rankings: response.data.ranking || [],
            totalEntries: response.data.total_entries || 0,
            filters: response.data.filters || {}
          }
        };
      }
      
      return {
        success: false,
        error: 'Failed to fetch provider rankings'
      };
    } catch (error) {
      console.error('ProviderRankingService - getProviderRankings error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch provider rankings'
      };
    }
  }

  /**
   * Get top provider by ID
   */
  async getTopProviderDomain(providerId: number): Promise<ApiResponse<ProviderRanking | null>> {
    try {
      const response = await this.providerRankingRepository.getRankings({
        provider_id: providerId,
        limit: 1
      });
      
      if (response.success && response.data) {
        // Handle both response formats
        const rankingData = Array.isArray(response.data) 
          ? response.data 
          : (response.data as any).ranking || [];
        
        if (rankingData.length > 0) {
          return {
            success: true,
            data: rankingData[0]
          };
        }
      }
      
      return {
        success: true,
        data: null
      };
    } catch (error) {
      console.error('ProviderRankingService - getTopProviderDomain error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch top provider domain'
      };
    }
  }
}

