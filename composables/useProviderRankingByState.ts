import { ref, computed } from 'vue';
import { ProviderRankingByStateRepository } from '~/infrastructure/repositories/ProviderRankingByStateRepository';
import type { ProviderRankingByState, ProviderRankingByStateFilters } from '~/types/api';

export const useProviderRankingByState = () => {
  const ranking = ref<ProviderRankingByState[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const totalEntries = ref(0);
  const filters = ref<ProviderRankingByStateFilters>({
    state_id: 0,
    provider_id: null,
    period: 'last_month',
    date_from: null,
    date_to: null,
    sort_by: 'total_requests',
    aggregate_by_provider: false
  });

  const repository = new ProviderRankingByStateRepository();

  /**
   * Load provider rankings by state
   */
  const loadRankingByState = async (customFilters?: Partial<ProviderRankingByStateFilters>) => {
    if (!filters.value.state_id || filters.value.state_id === 0) {
      error.value = 'Please select a state';
      return;
    }

    loading.value = true;
    error.value = null;

    try {
      const finalFilters: ProviderRankingByStateFilters = {
        ...filters.value,
        ...customFilters
      };

      const result = await repository.getRankingsByState(finalFilters);

      if (result.success && result.data) {
        ranking.value = result.data.ranking || [];
        totalEntries.value = result.data.total_entries || 0;
        filters.value = { ...filters.value, ...result.data.filters };
      } else {
        error.value = result.message || 'Failed to load ranking data';
        ranking.value = [];
        totalEntries.value = 0;
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unexpected error loading ranking';
      ranking.value = [];
      totalEntries.value = 0;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Update filters
   */
  const updateFilters = (newFilters: Partial<ProviderRankingByStateFilters>) => {
    filters.value = { ...filters.value, ...newFilters };
  };

  /**
   * Clear filters (except state_id and aggregate_by_provider)
   */
  const clearFilters = () => {
    filters.value = {
      ...filters.value,
      provider_id: null,
      period: 'last_month',
      date_from: null,
      date_to: null,
      sort_by: 'total_requests'
    };
  };

  /**
   * Check if current ranking is aggregated by provider
   */
  const isAggregatedByProvider = computed(() => {
    return filters.value.aggregate_by_provider === true;
  });

  /**
   * Formatted ranking for display
   */
  const formattedRanking = computed(() => {
    return ranking.value.map((item) => {
      const base = {
        ...item,
        formattedRequests: item.total_requests.toLocaleString(),
        formattedSuccessRate: `${item.avg_success_rate.toFixed(1)}%`,
        formattedSpeed: `${item.avg_speed.toFixed(2)} Mbps`
      };

      // Check if item has domain fields (aggregate_by_provider=false)
      if ('domain_id' in item && 'percentage_of_domain' in item) {
        const domainItem = item as any;
        return {
          ...base,
          formattedPercentage: `${domainItem.percentage_of_domain.toFixed(2)}%`,
          formattedProviderTotalRequests: domainItem.provider_total_requests?.toLocaleString() || '0',
          formattedPercentageOfProvider: domainItem.percentage_of_provider_in_state ? `${domainItem.percentage_of_provider_in_state.toFixed(2)}%` : '0%'
        };
      }

      // Check if item has provider aggregation fields (aggregate_by_provider=true)
      if ('percentage_of_state' in item) {
        const providerItem = item as any;
        return {
          ...base,
          formattedPercentage: `${providerItem.percentage_of_state.toFixed(2)}%`,
          formattedDomains: providerItem.domains || '',
          domainsCount: providerItem.domains_count || 0
        };
      }

      return base;
    });
  });

  return {
    ranking,
    formattedRanking,
    loading,
    error,
    totalEntries,
    filters,
    isAggregatedByProvider,
    loadRankingByState,
    updateFilters,
    clearFilters
  };
};

