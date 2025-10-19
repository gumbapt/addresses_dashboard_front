import type { GlobalDomainRankingData, DomainRankingItem } from '~/types/api';
import { ReportService } from '~/services/ReportService';

export const useGlobalRanking = () => {
  const rankingData = ref<GlobalDomainRankingData | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const currentSortBy = ref<string>('score');
  
  const reportService = new ReportService();

  const loadRanking = async (sortBy: string = 'score') => {
    loading.value = true;
    error.value = null;
    currentSortBy.value = sortBy;
    
    try {
      const result = await reportService.getGlobalDomainRanking(sortBy);
      
      if (result.success && result.data) {
        rankingData.value = result.data;
      } else {
        error.value = result.error || 'Failed to load ranking';
        rankingData.value = null;
      }
    } catch (err) {
      error.value = 'Unexpected error loading ranking';
      rankingData.value = null;
    } finally {
      loading.value = false;
    }
  };

  // Computed para formatação
  const formattedRanking = computed(() => {
    if (!rankingData.value?.ranking || !Array.isArray(rankingData.value.ranking)) {
      return [];
    }
    
    return rankingData.value.ranking.map((item: DomainRankingItem) => ({
      ...item,
      formattedPeriod: `${new Date(item.coverage.period_start).toLocaleDateString()} - ${new Date(item.coverage.period_end).toLocaleDateString()}`,
      formattedRequests: formatNumber(item.metrics.total_requests),
      formattedSuccessRate: item.metrics.success_rate.toFixed(1) + '%',
      formattedSpeed: item.metrics.avg_speed > 0 ? item.metrics.avg_speed.toFixed(1) + ' Mbps' : 'N/A',
      formattedScore: item.metrics.score.toFixed(1)
    }));
  });

  // Helper para formatar números
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  // Computed para o top 3
  const topThree = computed(() => {
    return formattedRanking.value.slice(0, 3);
  });

  // Computed para estatísticas gerais
  const globalStats = computed(() => {
    if (!rankingData.value?.ranking || rankingData.value.ranking.length === 0) {
      return {
        totalDomains: 0,
        totalRequests: 0,
        avgSuccessRate: 0,
        avgSpeed: 0
      };
    }

    const ranking = rankingData.value.ranking;
    const totalRequests = ranking.reduce((sum, item) => sum + item.metrics.total_requests, 0);
    const avgSuccessRate = ranking.reduce((sum, item) => sum + item.metrics.success_rate, 0) / ranking.length;
    const domainsWithSpeed = ranking.filter(item => item.metrics.avg_speed > 0);
    const avgSpeed = domainsWithSpeed.length > 0
      ? domainsWithSpeed.reduce((sum, item) => sum + item.metrics.avg_speed, 0) / domainsWithSpeed.length
      : 0;

    return {
      totalDomains: ranking.length,
      totalRequests,
      avgSuccessRate,
      avgSpeed
    };
  });

  return {
    rankingData: readonly(rankingData),
    loading: readonly(loading),
    error: readonly(error),
    currentSortBy: readonly(currentSortBy),
    formattedRanking,
    topThree,
    globalStats,
    loadRanking
  };
};

