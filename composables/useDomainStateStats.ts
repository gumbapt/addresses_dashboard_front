import { ref, computed, readonly } from 'vue';
import { ApiClient } from '~/infrastructure/http/ApiClient';

export interface DomainStateStatsFilters {
  state_id: number;
  period?: 'today' | 'yesterday' | 'last_week' | 'last_month' | 'last_year' | 'all_time' | null;
  date_from?: string | null;
  date_to?: string | null;
  sort_by?: 'total_count' | 'total_requests' | 'success_rate' | 'avg_speed';
}

export interface DomainStateStats {
  domain: {
    id: number;
    name: string;
  };
  state: {
    id: number;
    code: string;
    name: string;
  };
  period: {
    total_reports: number;
    first_report: string;
    last_report: string;
    days_covered: number;
    date_from: string;
    date_to: string;
  };
  kpis: {
    total_requests: number;
    success_rate: number;
    daily_average: number;
    unique_providers: number;
  };
  provider_distribution: Array<{
    provider_id: number;
    name: string;
    slug: string;
    total_count: number;
    percentage: number;
    avg_success_rate: number;
    avg_speed: number;
  }>;
  top_cities: Array<{
    city_id: number;
    name: string;
    total_requests: number;
    report_count: number;
  }>;
  cities_chart_data?: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      backgroundColor: string[];
      borderColor: string[];
      borderWidth: number;
    }>;
    percentages: number[];
    total: number;
    raw_data: Array<{
      city_id: number;
      name: string;
      total_requests: number;
      percentage: number;
      report_count: number;
    }>;
  };
  top_zip_codes: Array<{
    zip_code_id: number;
    code: string;
    total_requests: number;
    report_count: number;
  }>;
  hourly_distribution: Array<{
    hour: string;
    count: number;
    normalized: number;
  }>;
  technology_distribution: Array<{
    technology: string;
    total_count: number;
    percentage: number;
  }>;
  state_stats: {
    total_requests: number;
    avg_success_rate: number;
    avg_speed: number;
  };
  daily_trends: Array<{
    date: string;
    report_id: number;
    total_requests: number;
    success_rate: number;
    failed_requests: number;
    avg_requests_per_hour: number;
  }>;
}

export const useDomainStateStats = () => {
  const stats = ref<DomainStateStats | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  
  const apiClient = new ApiClient();

  const fetchStats = async (domainId: number, filters: DomainStateStatsFilters) => {
    loading.value = true;
    error.value = null;
    
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('state_id', filters.state_id.toString());
      
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
      
      const url = `/reports/domain/${domainId}/state-stats?${queryParams.toString()}`;
      const response = await apiClient.get<{ success: boolean; data: DomainStateStats }>(url);
      
      if (response.success && response.data) {
        stats.value = response.data;
      } else {
        error.value = 'Failed to load domain state statistics';
        stats.value = null;
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unexpected error loading domain state statistics';
      stats.value = null;
    } finally {
      loading.value = false;
    }
  };

  // Computed para os dados dos gráficos de donut (Provider Distribution)
  const providerChartData = computed(() => {
    if (!stats.value?.provider_distribution) return { series: [], labels: [] };
    
    const topProviders = stats.value.provider_distribution.slice(0, 8);
    return {
      series: topProviders.map(p => p.total_count),
      labels: topProviders.map(p => p.name)
    };
  });

  // Computed para os dados do gráfico de barras (Top Cities) - usando cities_chart_data se disponível
  const topCitiesChartData = computed(() => {
    // Priorizar cities_chart_data se disponível
    if (stats.value?.cities_chart_data) {
      return {
        categories: stats.value.cities_chart_data.labels,
        data: stats.value.cities_chart_data.datasets[0]?.data || [],
        percentages: stats.value.cities_chart_data.percentages,
        raw_data: stats.value.cities_chart_data.raw_data,
        colors: stats.value.cities_chart_data.datasets[0]?.backgroundColor || []
      };
    }
    
    // Fallback para top_cities
    if (!stats.value?.top_cities) return { categories: [], data: [], percentages: [], raw_data: [], colors: [] };
    
    const topCities = stats.value.top_cities.slice(0, 10);
    return {
      categories: topCities.map(c => c.name),
      data: topCities.map(c => c.total_requests),
      percentages: [],
      raw_data: topCities,
      colors: []
    };
  });

  // Computed para os dados do gráfico de donut (Technology Distribution)
  const technologyChartData = computed(() => {
    if (!stats.value?.technology_distribution) return { series: [], labels: [] };
    
    return {
      series: stats.value.technology_distribution.map(t => t.total_count),
      labels: stats.value.technology_distribution.map(t => t.technology)
    };
  });

  // Computed para os dados do gráfico de linha (Daily Trends)
  const dailyTrendsChartData = computed(() => {
    if (!stats.value?.daily_trends) return { categories: [], data: [] };
    
    return {
      categories: stats.value.daily_trends.map(t => new Date(t.date).toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' })),
      data: stats.value.daily_trends.map(t => t.total_requests)
    };
  });

  // Computed para os cards do topo
  const topCards = computed(() => {
    if (!stats.value?.kpis) {
      return {
        totalRequests: 0,
        successRate: 0,
        dailyAverage: 0,
        uniqueProviders: 0
      };
    }
    
    return {
      totalRequests: stats.value.kpis.total_requests,
      successRate: stats.value.kpis.success_rate,
      dailyAverage: stats.value.kpis.daily_average,
      uniqueProviders: stats.value.kpis.unique_providers
    };
  });

  return {
    stats: readonly(stats),
    loading: readonly(loading),
    error: readonly(error),
    fetchStats,
    providerChartData,
    topCitiesChartData,
    technologyChartData,
    dailyTrendsChartData,
    topCards
  };
};

