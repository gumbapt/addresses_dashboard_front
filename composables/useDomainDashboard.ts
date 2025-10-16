import type { Report, AggregatedDomainStats } from '~/types/api';
import { ApiClient } from '~/infrastructure/http/ApiClient';

export const useDomainDashboard = () => {
  const reportData = ref<Report | null>(null);
  const aggregatedData = ref<AggregatedDomainStats | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  
  const apiClient = new ApiClient();

  // Carregar dados de um report específico
  const loadDashboardStats = async (reportId: number) => {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await apiClient.get<{ success: boolean; data: Report }>(`/reports/${reportId}`);
      
      if (response.success && response.data) {
        reportData.value = response.data;
        aggregatedData.value = null; // Limpar dados agregados
      } else {
        error.value = 'Failed to load report data';
        reportData.value = null;
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unexpected error loading report';
      reportData.value = null;
    } finally {
      loading.value = false;
    }
  };

  // Carregar dados agregados de um domínio
  const loadAggregatedStats = async (domainId: number) => {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await apiClient.get<{ success: boolean; data: AggregatedDomainStats }>(`/reports/domain/${domainId}/aggregate`);
      
      if (response.success && response.data) {
        aggregatedData.value = response.data;
        reportData.value = null; // Limpar dados de report individual
      } else {
        error.value = 'Failed to load aggregated data';
        aggregatedData.value = null;
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unexpected error loading aggregated data';
      aggregatedData.value = null;
    } finally {
      loading.value = false;
    }
  };

  // Computed para os dados dos gráficos de donut (Provider Distribution)
  const providerChartData = computed(() => {
    // Dados agregados
    if (aggregatedData.value?.provider_distribution) {
      const topProviders = aggregatedData.value.provider_distribution.slice(0, 8);
      return {
        series: topProviders.map(p => p.total_count),
        labels: topProviders.map(p => p.name)
      };
    }
    
    // Dados de report individual
    if (reportData.value?.raw_data?.providers?.top_providers) {
      const topProviders = reportData.value.raw_data.providers.top_providers.slice(0, 8);
      return {
        series: topProviders.map((p: any) => p.total_count),
        labels: topProviders.map((p: any) => p.name)
      };
    }
    
    return { series: [], labels: [] };
  });

  // Computed para os dados do gráfico de barras (Top States)
  const topStatesChartData = computed(() => {
    // Dados agregados
    if (aggregatedData.value?.top_states) {
      const topStates = aggregatedData.value.top_states.slice(0, 10);
      return {
        categories: topStates.map(s => s.name || s.code),
        data: topStates.map(s => s.total_requests)
      };
    }
    
    // Dados de report individual
    if (reportData.value?.raw_data?.geographic?.states) {
      const topStates = [...reportData.value.raw_data.geographic.states]
        .sort((a: any, b: any) => b.request_count - a.request_count)
        .slice(0, 10);
      
      return {
        categories: topStates.map((s: any) => s.name || s.code),
        data: topStates.map((s: any) => s.request_count)
      };
    }
    
    return { categories: [], data: [] };
  });

  // Computed para os dados do gráfico de barras (Average Speed by State)
  const speedByStateChartData = computed(() => {
    // Dados agregados
    if (aggregatedData.value?.speed_by_state && aggregatedData.value.speed_by_state.length > 0) {
      const statesWithSpeed = aggregatedData.value.speed_by_state
        .filter(s => s.avg_speed > 0)
        .sort((a, b) => b.avg_speed - a.avg_speed)
        .slice(0, 10);
      
      return {
        categories: statesWithSpeed.map(s => s.name || s.code),
        data: statesWithSpeed.map(s => s.avg_speed)
      };
    }
    
    // Dados de report individual
    if (reportData.value?.raw_data?.speed_metrics?.by_state) {
      const topSpeeds = reportData.value.raw_data.speed_metrics.by_state.slice(0, 10);
      
      return {
        categories: topSpeeds.map((s: any) => s.state),
        data: topSpeeds.map((s: any) => s.avg_speed)
      };
    }
    
    return { categories: [], data: [] };
  });

  // Computed para os dados do gráfico de donut (Technology Distribution)
  const technologyChartData = computed(() => {
    // Dados agregados
    if (aggregatedData.value?.technology_distribution) {
      return {
        series: aggregatedData.value.technology_distribution.map(t => t.total_count),
        labels: aggregatedData.value.technology_distribution.map(t => t.technology)
      };
    }
    
    // Dados de report individual
    if (reportData.value?.raw_data?.technology_metrics?.distribution) {
      return {
        series: reportData.value.raw_data.technology_metrics.distribution.map((t: any) => t.count),
        labels: reportData.value.raw_data.technology_metrics.distribution.map((t: any) => t.tech)
      };
    }
    
    return { series: [], labels: [] };
  });

  // Computed para os cards do topo
  const topCards = computed(() => {
    // Dados agregados
    if (aggregatedData.value?.kpis) {
      const kpis = aggregatedData.value.kpis;
      
      return {
        totalRequests: kpis.total_requests || 0,
        successRate: kpis.success_rate || 0,
        dailyAverage: kpis.daily_average || 0,
        uniqueProviders: kpis.unique_providers || 0
      };
    }
    
    // Dados de report individual
    if (reportData.value?.raw_data?.summary) {
      const summary = reportData.value.raw_data.summary;
      
      return {
        totalRequests: summary.total_requests || 0,
        successRate: summary.success_rate || 0,
        dailyAverage: summary.avg_requests_per_hour * 24 || 0,
        uniqueProviders: summary.unique_providers || 0
      };
    }
    
    return {
      totalRequests: 0,
      successRate: 0,
      dailyAverage: 0,
      uniqueProviders: 0
    };
  });

  return {
    reportData: readonly(reportData),
    aggregatedData: readonly(aggregatedData),
    loading: readonly(loading),
    error: readonly(error),
    loadDashboardStats,
    loadAggregatedStats,
    providerChartData,
    topStatesChartData,
    speedByStateChartData,
    technologyChartData,
    topCards
  };
};
