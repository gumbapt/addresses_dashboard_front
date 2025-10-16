import type { Report } from '~/types/api';
import { ApiClient } from '~/infrastructure/http/ApiClient';

export const useDomainDashboard = () => {
  const reportData = ref<Report | null>(null);
  const allReportsData = ref<Report[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  
  const apiClient = new ApiClient();

  const loadDashboardStats = async (reportId: number) => {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await apiClient.get<{ success: boolean; data: Report }>(`/reports/${reportId}`);
      
      if (response.success && response.data) {
        reportData.value = response.data;
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

  const setAllReportsData = (reports: Report[]) => {
    allReportsData.value = reports;
  };

  // Computed para os dados dos gráficos de donut (Provider Distribution)
  const providerChartData = computed(() => {
    if (!reportData.value?.raw_data?.providers?.top_providers) {
      return { series: [], labels: [] };
    }
    
    const topProviders = reportData.value.raw_data.providers.top_providers.slice(0, 8); // Top 8
    
    return {
      series: topProviders.map((p: any) => p.total_count),
      labels: topProviders.map((p: any) => p.name)
    };
  });

  // Computed para os dados do gráfico de barras (Top States)
  const topStatesChartData = computed(() => {
    if (!reportData.value?.raw_data?.geographic?.states) {
      return { categories: [], data: [] };
    }
    
    // Ordenar por request_count e pegar os top 10
    const topStates = [...reportData.value.raw_data.geographic.states]
      .sort((a: any, b: any) => b.request_count - a.request_count)
      .slice(0, 10);
    
    return {
      categories: topStates.map((s: any) => s.name || s.code),
      data: topStates.map((s: any) => s.request_count)
    };
  });

  // Computed para os dados do gráfico de barras (Average Speed by State)
  const speedByStateChartData = computed(() => {
    if (!reportData.value?.raw_data?.speed_metrics?.by_state) {
      return { categories: [], data: [] };
    }
    
    // Pegar os top 10 estados com maior velocidade
    const topSpeeds = reportData.value.raw_data.speed_metrics.by_state.slice(0, 10);
    
    return {
      categories: topSpeeds.map((s: any) => s.state),
      data: topSpeeds.map((s: any) => s.avg_speed)
    };
  });

  // Computed para os dados do gráfico de donut (Technology Distribution)
  const technologyChartData = computed(() => {
    if (!reportData.value?.raw_data?.technology_metrics?.distribution) {
      return { series: [], labels: [] };
    }
    
    return {
      series: reportData.value.raw_data.technology_metrics.distribution.map((t: any) => t.count),
      labels: reportData.value.raw_data.technology_metrics.distribution.map((t: any) => t.tech)
    };
  });

  // Computed para os cards do topo
  const topCards = computed(() => {
    if (!reportData.value?.raw_data?.summary) {
      return {
        totalRequests: 0,
        successRate: 0,
        dailyAverage: 0,
        uniqueProviders: 0
      };
    }
    
    const summary = reportData.value.raw_data.summary;
    
    return {
      totalRequests: summary.total_requests || 0,
      successRate: summary.success_rate || 0,
      dailyAverage: summary.total_requests / 24 || 0, // Média por hora convertida para dia
      uniqueProviders: summary.unique_providers || 0
    };
  });

  // Computed para agregar dados de todos os reports
  const aggregatedProviderData = computed(() => {
    if (allReportsData.value.length === 0) return { series: [], labels: [] };
    
    const providerMap = new Map<string, number>();
    
    allReportsData.value.forEach(report => {
      if (report.raw_data?.providers?.top_providers) {
        report.raw_data.providers.top_providers.forEach((p: any) => {
          const current = providerMap.get(p.name) || 0;
          providerMap.set(p.name, current + p.total_count);
        });
      }
    });
    
    const sorted = Array.from(providerMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
    
    return {
      series: sorted.map(([_, count]) => count),
      labels: sorted.map(([name]) => name)
    };
  });

  const aggregatedStatesData = computed(() => {
    if (allReportsData.value.length === 0) return { categories: [], data: [] };
    
    const stateMap = new Map<string, { name: string; count: number }>();
    
    allReportsData.value.forEach(report => {
      if (report.raw_data?.geographic?.states) {
        report.raw_data.geographic.states.forEach((s: any) => {
          const key = s.code;
          const current = stateMap.get(key);
          if (current) {
            current.count += s.request_count;
          } else {
            stateMap.set(key, { name: s.name || s.code, count: s.request_count });
          }
        });
      }
    });
    
    const sorted = Array.from(stateMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    return {
      categories: sorted.map(s => s.name),
      data: sorted.map(s => s.count)
    };
  });

  const aggregatedSpeedData = computed(() => {
    if (allReportsData.value.length === 0) return { categories: [], data: [] };
    
    const speedMap = new Map<string, { total: number; count: number }>();
    
    allReportsData.value.forEach(report => {
      if (report.raw_data?.speed_metrics?.by_state) {
        report.raw_data.speed_metrics.by_state.forEach((s: any) => {
          const current = speedMap.get(s.state);
          if (current) {
            current.total += s.avg_speed;
            current.count += 1;
          } else {
            speedMap.set(s.state, { total: s.avg_speed, count: 1 });
          }
        });
      }
    });
    
    const sorted = Array.from(speedMap.entries())
      .map(([state, { total, count }]) => ({ state, avg: total / count }))
      .sort((a, b) => b.avg - a.avg)
      .slice(0, 10);
    
    return {
      categories: sorted.map(s => s.state),
      data: sorted.map(s => s.avg)
    };
  });

  const aggregatedTechnologyData = computed(() => {
    if (allReportsData.value.length === 0) return { series: [], labels: [] };
    
    const techMap = new Map<string, number>();
    
    allReportsData.value.forEach(report => {
      if (report.raw_data?.technology_metrics?.distribution) {
        report.raw_data.technology_metrics.distribution.forEach((t: any) => {
          const current = techMap.get(t.tech) || 0;
          techMap.set(t.tech, current + t.count);
        });
      }
    });
    
    const sorted = Array.from(techMap.entries())
      .sort((a, b) => b[1] - a[1]);
    
    return {
      series: sorted.map(([_, count]) => count),
      labels: sorted.map(([tech]) => tech)
    };
  });

  const aggregatedTopCards = computed(() => {
    if (allReportsData.value.length === 0) {
      return {
        totalRequests: 0,
        successRate: 0,
        dailyAverage: 0,
        uniqueProviders: 0
      };
    }
    
    let totalRequests = 0;
    let totalSuccessRate = 0;
    const providerSet = new Set<string>();
    
    allReportsData.value.forEach(report => {
      if (report.raw_data?.summary) {
        totalRequests += report.raw_data.summary.total_requests || 0;
        totalSuccessRate += report.raw_data.summary.success_rate || 0;
      }
      
      if (report.raw_data?.providers?.top_providers) {
        report.raw_data.providers.top_providers.forEach((p: any) => {
          providerSet.add(p.name);
        });
      }
    });
    
    const avgSuccessRate = allReportsData.value.length > 0 
      ? totalSuccessRate / allReportsData.value.length 
      : 0;
    
    const dailyAverage = allReportsData.value.length > 0
      ? totalRequests / allReportsData.value.length
      : 0;
    
    return {
      totalRequests,
      successRate: avgSuccessRate,
      dailyAverage,
      uniqueProviders: providerSet.size
    };
  });

  return {
    reportData: readonly(reportData),
    allReportsData: readonly(allReportsData),
    loading: readonly(loading),
    error: readonly(error),
    loadDashboardStats,
    setAllReportsData,
    providerChartData,
    topStatesChartData,
    speedByStateChartData,
    technologyChartData,
    topCards,
    aggregatedProviderData,
    aggregatedStatesData,
    aggregatedSpeedData,
    aggregatedTechnologyData,
    aggregatedTopCards
  };
};
