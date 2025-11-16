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
        
        // Debug: Log da estrutura de dados recebida
        console.log(`[Report ${reportId}] Report data structure:`, {
          hasTechnologyMetrics: !!response.data.raw_data?.technology_metrics,
          technologyMetrics: response.data.raw_data?.technology_metrics,
          hasTechnologyDistribution: !!response.data.raw_data?.technology_distribution,
          technologyDistribution: response.data.raw_data?.technology_distribution,
          // Speed data debug
          hasSpeedMetrics: !!response.data.raw_data?.speed_metrics,
          speedMetrics: response.data.raw_data?.speed_metrics,
          hasGeographic: !!response.data.raw_data?.geographic,
          geographicStates: response.data.raw_data?.geographic?.states,
          statesWithSpeed: response.data.raw_data?.geographic?.states?.filter((s: any) => s.avg_speed > 0).length || 0,
          rawDataKeys: response.data.raw_data ? Object.keys(response.data.raw_data) : []
        });
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
        
        // Debug: Log da estrutura de dados recebida
        console.log(`[Domain ${domainId}] Aggregated data structure:`, {
          hasTechnologyDistribution: !!(response.data as any).technology_distribution,
          technologyDistribution: (response.data as any).technology_distribution,
          providersCount: response.data.providers?.length || 0,
          providersWithTechnology: response.data.providers?.filter(p => p.technology).length || 0,
          sampleProvider: response.data.providers?.[0],
          // Speed data debug
          hasGeographic: !!response.data.geographic,
          hasStates: !!response.data.geographic?.states,
          statesCount: response.data.geographic?.states?.length || 0,
          statesWithSpeed: response.data.geographic?.states?.filter((s: any) => s.avg_speed > 0).length || 0,
          sampleState: response.data.geographic?.states?.[0],
          geographicKeys: response.data.geographic ? Object.keys(response.data.geographic) : []
        });
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
    if (aggregatedData.value?.providers && Array.isArray(aggregatedData.value.providers)) {
      const topProviders = aggregatedData.value.providers.slice(0, 8);
      return {
        series: topProviders.map(p => p.total_count),
        labels: topProviders.map(p => p.name)
      };
    }
    
    // Dados de report individual
    if (reportData.value?.raw_data?.providers?.top_providers && Array.isArray(reportData.value.raw_data.providers.top_providers)) {
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
    if (aggregatedData.value?.geographic?.states && Array.isArray(aggregatedData.value.geographic.states)) {
      const topStates = aggregatedData.value.geographic.states.slice(0, 10);
      return {
        categories: topStates.map(s => s.name || s.code),
        data: topStates.map(s => s.total_requests)
      };
    }
    
    // Dados de report individual
    if (reportData.value?.raw_data?.geographic?.states && Array.isArray(reportData.value.raw_data.geographic.states)) {
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
    if (aggregatedData.value) {
      // Verificar se há geographic.states
      if (aggregatedData.value.geographic?.states && Array.isArray(aggregatedData.value.geographic.states)) {
        const allStates = aggregatedData.value.geographic.states;
        const statesWithSpeed = allStates
          .filter(s => s.avg_speed && s.avg_speed > 0)
          .sort((a, b) => b.avg_speed - a.avg_speed)
          .slice(0, 10);
        
        console.log('[Speed Chart] Aggregated data - States:', {
          totalStates: allStates.length,
          statesWithSpeed: statesWithSpeed.length,
          sampleState: allStates[0],
          filteredStates: statesWithSpeed.map(s => ({ name: s.name || s.code, speed: s.avg_speed }))
        });
        
        if (statesWithSpeed.length > 0) {
          return {
            categories: statesWithSpeed.map(s => s.name || s.code),
            data: statesWithSpeed.map(s => s.avg_speed)
          };
        } else {
          console.warn('[Speed Chart] No states with speed > 0 found. All states:', allStates.map(s => ({
            name: s.name || s.code,
            avg_speed: s.avg_speed
          })));
        }
      } else {
        console.warn('[Speed Chart] No geographic.states found in aggregated data:', {
          hasGeographic: !!aggregatedData.value.geographic,
          geographicKeys: aggregatedData.value.geographic ? Object.keys(aggregatedData.value.geographic) : []
        });
      }
    }
    
    // Dados de report individual
    if (reportData.value?.raw_data) {
      // Tentar speed_metrics.by_state primeiro
      const speedMetrics = reportData.value.raw_data.speed_metrics;
      if (speedMetrics?.by_state && Array.isArray(speedMetrics.by_state)) {
        const topSpeeds = speedMetrics.by_state
          .filter((s: any) => s.avg_speed && s.avg_speed > 0)
          .slice(0, 10);
        
        console.log('[Speed Chart] Using speed_metrics.by_state:', topSpeeds);
        
        if (topSpeeds.length > 0) {
          return {
            categories: topSpeeds.map((s: any) => s.state || s.name || s.code),
            data: topSpeeds.map((s: any) => s.avg_speed)
          };
        }
      }
      
      // Tentar estrutura alternativa: geographic.states com speed
      const geographic = reportData.value.raw_data.geographic;
      if (geographic?.states && Array.isArray(geographic.states)) {
        const statesWithSpeed = geographic.states
          .filter((s: any) => s.avg_speed && s.avg_speed > 0)
          .sort((a: any, b: any) => (b.avg_speed || 0) - (a.avg_speed || 0))
          .slice(0, 10);
        
        console.log('[Speed Chart] Using raw_data.geographic.states:', statesWithSpeed);
        
        if (statesWithSpeed.length > 0) {
          return {
            categories: statesWithSpeed.map((s: any) => s.name || s.state || s.code),
            data: statesWithSpeed.map((s: any) => s.avg_speed)
          };
        }
      }
      
      console.warn('[Speed Chart] No speed data found in report raw_data:', {
        hasSpeedMetrics: !!speedMetrics,
        hasGeographic: !!geographic,
        rawDataKeys: Object.keys(reportData.value.raw_data)
      });
    }
    
    console.warn('[Speed Chart] No speed data available');
    return { categories: [], data: [] };
  });

  // Computed para os dados do gráfico de donut (Technology Distribution)
  const technologyChartData = computed(() => {
    // Dados agregados - primeiro tentar usar technology_distribution direto se existir
    if (aggregatedData.value) {
      // Verificar se há technology_distribution direto na resposta (estrutura mais recente)
      const directTechDist = (aggregatedData.value as any).technology_distribution;
      if (directTechDist && Array.isArray(directTechDist) && directTechDist.length > 0) {
        console.log('[Technology Chart] Using direct technology_distribution from API:', directTechDist);
        return {
          series: directTechDist.map((t: any) => t.count || t.total_count || 0),
          labels: directTechDist.map((t: any) => t.technology || t.tech || t.name)
        };
      }
      
      // Fallback: calcular a partir dos providers
      if (aggregatedData.value.providers && Array.isArray(aggregatedData.value.providers)) {
        const techMap = new Map<string, number>();
        
        aggregatedData.value.providers.forEach(p => {
          if (p.technology) {
            const current = techMap.get(p.technology) || 0;
            techMap.set(p.technology, current + (p.total_count || 0));
          }
        });
        
        if (techMap.size > 0) {
          const sorted = Array.from(techMap.entries())
            .sort((a, b) => b[1] - a[1]);
          
          console.log('[Technology Chart] Calculated from providers:', sorted);
          return {
            series: sorted.map(([_, count]) => count),
            labels: sorted.map(([tech]) => tech)
          };
        }
      }
      
      console.warn('[Technology Chart] No technology data found in aggregated data:', aggregatedData.value);
    }
    
    // Dados de report individual
    if (reportData.value?.raw_data) {
      // Tentar múltiplas estruturas possíveis
      const techMetrics = reportData.value.raw_data.technology_metrics;
      if (techMetrics?.distribution && Array.isArray(techMetrics.distribution)) {
        console.log('[Technology Chart] Using technology_metrics.distribution:', techMetrics.distribution);
        return {
          series: techMetrics.distribution.map((t: any) => t.count || t.total_count || 0),
          labels: techMetrics.distribution.map((t: any) => t.technology || t.tech || t.name)
        };
      }
      
      // Tentar estrutura alternativa
      const techDist = reportData.value.raw_data.technology_distribution;
      if (techDist && Array.isArray(techDist) && techDist.length > 0) {
        console.log('[Technology Chart] Using raw_data.technology_distribution:', techDist);
        return {
          series: techDist.map((t: any) => t.count || t.total_count || 0),
          labels: techDist.map((t: any) => t.technology || t.tech || t.name)
        };
      }
      
      console.warn('[Technology Chart] No technology data found in report raw_data:', reportData.value.raw_data);
    }
    
    console.warn('[Technology Chart] No technology data available');
    return { series: [], labels: [] };
  });

  // Computed para os cards do topo
  const topCards = computed(() => {
    // Dados agregados
    if (aggregatedData.value?.summary) {
      const summary = aggregatedData.value.summary;
      const period = aggregatedData.value.period;
      
      return {
        totalRequests: summary.total_requests || 0,
        successRate: summary.avg_success_rate || 0,
        dailyAverage: period.days_covered > 0 ? summary.total_requests / period.days_covered : 0,
        uniqueProviders: summary.total_unique_providers || 0
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
