import { ref, computed } from 'vue';
import { ProviderRankingService } from '~/services/ProviderRankingService';
import type { ProviderRanking, ProviderRankingFilters } from '~/types/api';

export const useProviderRankings = () => {
  // Reactive state
  const rankings = ref<ProviderRanking[]>([]);
  const totalEntries = ref(0);
  const pagination = ref<any>(null);
  const filters = ref<ProviderRankingFilters>({
    technology: null,
    provider_id: null,
    period: 'all_time',
    sort_by: 'total_requests',
    page: 1,
    per_page: 15
  });
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Service instance
  const providerRankingService = new ProviderRankingService();

  // Local sort field (for client-side sorting)
  const localSortBy = ref<string>('total_requests');

  // Computed: formatted rankings with client-side sorting
  const formattedRankings = computed(() => {
    let sorted = rankings.value.map(ranking => ({
      ...ranking,
      requestsFormatted: ranking.total_requests.toLocaleString(),
      domainTotalFormatted: ranking.domain_total_requests?.toLocaleString() || '-',
      percentageFormatted: ranking.percentage_of_domain?.toFixed(1) || '0.0',
      percentageColor: getPercentageColor(ranking.percentage_of_domain),
      successRateFormatted: ranking.avg_success_rate.toFixed(1),
      avgSpeedFormatted: ranking.avg_speed.toFixed(0),
      successRateColor: ranking.avg_success_rate >= 90 ? 'success' : 
                       ranking.avg_success_rate >= 70 ? 'warning' : 'error',
      techColor: getTechColor(ranking.technology),
      hasMedal: ranking.rank <= 3,
      medalEmoji: ranking.rank === 1 ? '🥇' : ranking.rank === 2 ? '🥈' : ranking.rank === 3 ? '🥉' : ''
    }));

    // Client-side sorting
    if (localSortBy.value === 'domain_total') {
      sorted = sorted.sort((a, b) => (b.domain_total_requests || 0) - (a.domain_total_requests || 0));
    } else if (localSortBy.value === 'percentage') {
      sorted = sorted.sort((a, b) => (b.percentage_of_domain || 0) - (a.percentage_of_domain || 0));
    } else if (localSortBy.value === 'avg_speed') {
      sorted = sorted.sort((a, b) => a.avg_speed - b.avg_speed); // Ascending (faster first)
    }

    return sorted;
  });

  // Helper functions
  const getTechColor = (technology: string | null) => {
    const techMap: Record<string, string> = {
      'Fiber': 'blue',
      'Cable': 'green',
      'DSL': 'orange',
      'Mobile': 'purple',
      'Satellite': 'red'
    };
    return technology ? techMap[technology] || 'grey' : 'grey';
  };

  const getPercentageColor = (percentage: number | undefined) => {
    if (!percentage) return 'grey';
    if (percentage >= 50) return 'error';      // Very high dependence (red)
    if (percentage >= 25) return 'warning';    // High dependence (orange)
    if (percentage >= 10) return 'info';       // Moderate dependence (blue)
    return 'success';                          // Low dependence (green)
  };

  /**
   * Load provider rankings
   */
  const loadProviderRankings = async (customFilters?: ProviderRankingFilters) => {
    loading.value = true;
    error.value = null;

    try {
      const filtersToUse = customFilters || filters.value;
      const result = await providerRankingService.getProviderRankings(filtersToUse);

      if (result.success && result.data) {
        rankings.value = result.data.rankings;
        totalEntries.value = result.data.totalEntries;
        pagination.value = result.data.pagination || null;
      } else {
        error.value = result.error || 'Failed to load provider rankings';
        rankings.value = [];
        pagination.value = null;
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unexpected error';
      rankings.value = [];
    } finally {
      loading.value = false;
    }
  };

  /**
   * Get top domain for specific provider
   */
  const getTopProviderDomain = async (providerId: number) => {
    const result = await providerRankingService.getTopProviderDomain(providerId);
    return result;
  };

  /**
   * Update filters
   */
  const updateFilters = (newFilters: Partial<ProviderRankingFilters>) => {
    filters.value = { ...filters.value, ...newFilters };
  };

  /**
   * Clear filters
   */
  const clearFilters = () => {
    filters.value = {
      technology: null,
      provider_id: null,
      period: 'all_time',
      sort_by: 'total_requests',
      page: 1,
      per_page: 15
    };
  };

  /**
   * Go to specific page
   */
  const goToPage = async (page: number) => {
    filters.value.page = page;
    await loadProviderRankings();
  };

  /**
   * Change items per page
   */
  const changePerPage = async (perPage: number) => {
    filters.value.per_page = perPage;
    filters.value.page = 1; // Reset to first page
    await loadProviderRankings();
  };

  /**
   * Change local sort (client-side)
   */
  const changeLocalSort = (sortBy: string) => {
    localSortBy.value = sortBy;
  };

  return {
    // State
    rankings,
    formattedRankings,
    totalEntries,
    pagination,
    filters,
    loading,
    error,
    localSortBy,

    // Actions
    loadProviderRankings,
    getTopProviderDomain,
    updateFilters,
    clearFilters,
    goToPage,
    changePerPage,
    changeLocalSort
  };
};

