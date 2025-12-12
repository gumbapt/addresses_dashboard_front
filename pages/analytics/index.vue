<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import UiChildCard from '@/components/shared/UiChildCard.vue';
import ProviderRankingTable from '@/components/ProviderRankingTable.vue';

const route = useRoute();

// Define page title
useHead({
  title: 'Analytics'
});

// Define middleware
definePageMeta({
  middleware: ['auth', 'permissions']
});

// Use composables
const { rankingData, loading, error, currentSortBy, formattedRanking, topThree, globalStats, loadRanking } = useGlobalRanking();
const { comparisonData, loading: comparisonLoading, error: comparisonError, loadComparison, formatNumber: formatNumberComp, getDiffColor, getDiffIcon } = useDomainComparison();
const { domains: allDomains, loadDomains } = useDomains();
const { formattedRankings, totalEntries, filters, loading: providerLoading, error: providerError, loadProviderRankings, updateFilters, clearFilters } = useProviderRankings();
const { 
  reportData,
  aggregatedData,
  loading: domainLoading, 
  error: domainError, 
  loadDashboardStats,
  loadAggregatedStats,
  providerChartData, 
  topStatesChartData, 
  speedByStateChartData, 
  technologyChartData, 
  topCards
} = useDomainDashboard();
const { formattedReports, loading: reportsLoading, loadReports } = useReports();
const { 
  ranking: stateRanking, 
  formattedRanking: formattedStateRanking,
  loading: stateRankingLoading, 
  error: stateRankingError,
  totalEntries: stateRankingTotalEntries,
  filters: stateRankingFilters,
  isAggregatedByProvider: isStateRankingAggregated,
  loadRankingByState, 
  updateFilters: updateStateRankingFilters,
  clearFilters: clearStateRankingFilters 
} = useProviderRankingByState();
const { states: allStates, loading: statesLoading, error: statesError, fetchStates } = useStates();

// States
const currentTab = ref('ranking');
const selectedDomainIds = ref<number[]>([]);
const dateFrom = ref<string>('');
const dateTo = ref<string>('');
const selectedDomainId = ref<number | null>(null);
const selectedReportId = ref<number | string>('all');
const showAllReports = ref(false);
const selectedStateId = ref<number | null>(null);

// Period and date filters for Domain Dashboard tab
const domainDashboardPeriod = ref<'today' | 'yesterday' | 'last_week' | 'last_month' | 'last_year' | 'all_time' | null>(null);
const domainDashboardDateFrom = ref<string | null>(null);
const domainDashboardDateTo = ref<string | null>(null);

const domainDashboardPeriodOptions = [
  { title: '📅 Today', value: 'today' },
  { title: '📅 Yesterday', value: 'yesterday' },
  { title: '📅 Last Week', value: 'last_week' },
  { title: '📅 Last Month', value: 'last_month' },
  { title: '📅 Last Year', value: 'last_year' },
  { title: '📅 All Time', value: 'all_time' }
];

// Sort options
const sortOptions = [
  { value: 'score', label: 'Overall Score' },
  { value: 'volume', label: 'Total Requests' },
  { value: 'success', label: 'Success Rate' },
  { value: 'speed', label: 'Average Speed' }
];

// Domain options for comparison
const domainOptions = computed(() => {
  if (!allDomains.value || !Array.isArray(allDomains.value)) return [];
  return allDomains.value.map((d: any) => ({
    value: d.id,
    title: d.name
  }));
});

// Load data
onMounted(() => {
  loadRanking('score');
  loadDomains();
  loadProviderRankings(); // Load provider rankings
  
  // Initialize date filters from URL for state ranking
  if (route.query.state_date_from) {
    updateStateRankingFilters({ date_from: route.query.state_date_from as string });
  }
  if (route.query.state_date_to) {
    updateStateRankingFilters({ date_to: route.query.state_date_to as string });
  }
  
  // Initialize date filters from URL for domain dashboard
  if (route.query.domain_dashboard_date_from) {
    domainDashboardDateFrom.value = route.query.domain_dashboard_date_from as string;
  }
  if (route.query.domain_dashboard_date_to) {
    domainDashboardDateTo.value = route.query.domain_dashboard_date_to as string;
  }
  if (route.query.domain_dashboard_period) {
    domainDashboardPeriod.value = route.query.domain_dashboard_period as any;
  }
});

// Function to change sorting
const changeSortBy = (sortBy: string) => {
  loadRanking(sortBy);
};

// Function to navigate to domain dashboard
const viewDomainDashboard = (domainId: number) => {
  navigateTo(`/domains/${domainId}/dashboard`);
};

// Function to navigate to domain state dashboard
const viewDomainStateDashboard = (domainId: number, stateId: number) => {
  navigateTo(`/domains/${domainId}/state/${stateId}/dashboard`);
};

// Domain info for selected domain
const currentDomain = computed(() => {
  if (!selectedDomainId.value || !allDomains.value || !Array.isArray(allDomains.value)) return null;
  return allDomains.value.find((d: any) => d.id === selectedDomainId.value);
});

// Reports do domínio selecionado
const domainReports = computed(() => {
  if (!selectedDomainId.value) return [];
  return formattedReports.value.filter((r: any) => r.domain_id === selectedDomainId.value);
});

// Opções do seletor de reports
const reportSelectOptions = computed(() => {
  const options = [
    { id: 'all', reportDate: 'All Reports Combined', statusColor: 'primary', data_version: 'Aggregated' }
  ];
  return [...options, ...domainReports.value];
});

// Watch para carregar dados quando domínio for selecionado
watch(selectedDomainId, async (newDomainId) => {
  if (newDomainId) {
    await loadReports({ domain_id: newDomainId, per_page: 100 });
    await loadDomainDashboardData();
    selectedReportId.value = 'all';
    showAllReports.value = false;
  }
});

// Watch for domain dashboard date changes
watch([domainDashboardDateFrom, domainDashboardDateTo], () => {
  if (selectedDomainId.value && selectedReportId.value === 'all' && currentTab.value === 'domain-dashboard') {
    onDomainDashboardDateChange();
  }
});

// Calculate date range from period for Domain Dashboard
const calculateDomainDashboardDateRange = (period: string | null): { date_from: string | null; date_to: string | null } => {
  if (!period || period === 'all_time') {
    return { date_from: null, date_to: null };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let dateFrom: Date;
  let dateTo: Date = new Date(today);

  switch (period) {
    case 'today':
      dateFrom = new Date(today);
      dateTo = new Date(today);
      break;
    
    case 'yesterday':
      dateFrom = new Date(today);
      dateFrom.setDate(dateFrom.getDate() - 1);
      dateTo = new Date(dateFrom);
      break;
    
    case 'last_week':
      dateFrom = new Date(today);
      dateFrom.setDate(dateFrom.getDate() - 6);
      break;
    
    case 'last_month':
      dateFrom = new Date(today);
      dateFrom.setDate(dateFrom.getDate() - 29);
      break;
    
    case 'last_year':
      dateFrom = new Date(today);
      dateFrom.setDate(dateFrom.getDate() - 364);
      break;
    
    default:
      return { date_from: null, date_to: null };
  }

  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return {
    date_from: formatDate(dateFrom),
    date_to: formatDate(dateTo)
  };
};

// Update URL for Domain Dashboard filters
const updateDomainDashboardURL = () => {
  const query: Record<string, string> = {};
  
  // Preserve other query params
  const currentQuery = route.query;
  Object.keys(currentQuery).forEach(key => {
    if (!key.startsWith('domain_dashboard_') && key !== 'domain_date_from' && key !== 'domain_date_to' && key !== 'domain_period') {
      query[key] = currentQuery[key] as string;
    }
  });
  
  // Add domain dashboard specific params
  if (domainDashboardDateFrom.value) {
    query.domain_dashboard_date_from = domainDashboardDateFrom.value;
  }
  if (domainDashboardDateTo.value) {
    query.domain_dashboard_date_to = domainDashboardDateTo.value;
  }
  if (domainDashboardPeriod.value) {
    query.domain_dashboard_period = domainDashboardPeriod.value;
  }
  
  navigateTo({
    query: Object.keys(query).length > 0 ? query : {}
  }, { replace: true });
};

// Handle period change for Domain Dashboard
const onDomainDashboardPeriodChange = () => {
  if (domainDashboardPeriod.value) {
    const dateRange = calculateDomainDashboardDateRange(domainDashboardPeriod.value);
    domainDashboardDateFrom.value = dateRange.date_from;
    domainDashboardDateTo.value = dateRange.date_to;
  } else {
    domainDashboardDateFrom.value = null;
    domainDashboardDateTo.value = null;
  }
  updateDomainDashboardURL();
  loadDomainDashboardData();
};

// Handle date change for Domain Dashboard
const onDomainDashboardDateChange = () => {
  if (domainDashboardDateFrom.value || domainDashboardDateTo.value) {
    domainDashboardPeriod.value = null;
  } else {
    domainDashboardPeriod.value = null;
  }
  updateDomainDashboardURL();
  loadDomainDashboardData();
};

// Load Domain Dashboard data
const loadDomainDashboardData = async () => {
  if (!selectedDomainId.value) return;
  
  if (selectedReportId.value === 'all') {
    showAllReports.value = false;
    await loadAggregatedStats(selectedDomainId.value, {
      period: domainDashboardPeriod.value,
      date_from: domainDashboardDateFrom.value,
      date_to: domainDashboardDateTo.value
    });
  } else if (selectedReportId.value) {
    showAllReports.value = false;
    await loadDashboardStats(selectedReportId.value as number);
  }
};

// Watch para carregar dados quando report mudar
watch(selectedReportId, async (newId) => {
  if (!selectedDomainId.value) return;
  
  if (newId === 'all') {
    showAllReports.value = false;
    await loadDomainDashboardData();
  } else if (newId) {
    showAllReports.value = false;
    await loadDashboardStats(newId as number);
  }
});

// Info para display
const displayInfo = computed(() => {
  if (selectedReportId.value === 'all' && aggregatedData.value) {
    return `Showing aggregated data from ${domainReports.value.length} report(s)`;
  }
  const selectedReport = domainReports.value.find((r: any) => r.id === selectedReportId.value);
  if (selectedReport && selectedReportId.value !== 'all') {
    return `Report Date: ${selectedReport.reportDate} | Status: ${selectedReport.statusLabel}`;
  }
  return '';
});

// Compare domains
const compare = () => {
  if (selectedDomainIds.value.length < 2) {
    return;
  }
  loadComparison(selectedDomainIds.value, undefined, dateFrom.value || undefined, dateTo.value || undefined);
  currentTab.value = 'comparison';
};

// Clear comparison selection
const clearComparison = () => {
  selectedDomainIds.value = [];
  dateFrom.value = '';
  dateTo.value = '';
};

// Format numbers
const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

// Format percentage
const formatPercentage = (num: number): string => {
  return num.toFixed(1) + '%';
};

// Format decimal
const formatDecimal = (num: number): string => {
  return num.toFixed(2);
};

// State options for select (from API)
const stateOptions = computed(() => {
  if (!allStates.value || !Array.isArray(allStates.value)) return [];
  return allStates.value.map(state => ({
    value: state.id,
    title: `${state.name} (${state.code})`
  }));
});

// Get state name by ID
const getStateNameById = (stateId: number | null): string => {
  if (!stateId || !allStates.value || !Array.isArray(allStates.value)) return '';
  const state = allStates.value.find(s => s.id === stateId);
  return state ? `${state.name} (${state.code})` : '';
};

// Load states when State Ranking tab is accessed
watch(currentTab, async (newTab) => {
  if (newTab === 'state-ranking' && allStates.value.length === 0 && !statesLoading.value) {
    await fetchStates();
  }
});

// Watch for state selection changes
watch(selectedStateId, async (newStateId) => {
  if (newStateId) {
    updateStateRankingFilters({ state_id: newStateId });
    await loadRankingByState();
  }
});


// Calculate date range from period for State Ranking
const calculateStateRankingDateRange = (period: string | null): { date_from: string | null; date_to: string | null } => {
  if (!period || period === 'all_time') {
    return { date_from: null, date_to: null };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let dateFrom: Date;
  let dateTo: Date = new Date(today);

  switch (period) {
    case 'today':
      dateFrom = new Date(today);
      dateTo = new Date(today);
      break;
    
    case 'yesterday':
      dateFrom = new Date(today);
      dateFrom.setDate(dateFrom.getDate() - 1);
      dateTo = new Date(dateFrom);
      break;
    
    case 'last_week':
      dateFrom = new Date(today);
      dateFrom.setDate(dateFrom.getDate() - 6); // Last 7 days (including today)
      break;
    
    case 'last_month':
      dateFrom = new Date(today);
      dateFrom.setDate(dateFrom.getDate() - 29); // Last 30 days (including today)
      break;
    
    case 'last_year':
      dateFrom = new Date(today);
      dateFrom.setDate(dateFrom.getDate() - 364); // Last 365 days (including today)
      break;
    
    default:
      return { date_from: null, date_to: null };
  }

  // Format to ISO (YYYY-MM-DD)
  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return {
    date_from: formatDate(dateFrom),
    date_to: formatDate(dateTo)
  };
};

// Flag to prevent infinite loops
const isUpdatingStateRankingFilters = ref(false);

// Watch for filter changes
watch(() => stateRankingFilters.value.period, async (newPeriod, oldPeriod) => {
  if (!selectedStateId.value || isUpdatingStateRankingFilters.value) return;
  if (newPeriod === oldPeriod) return;
  
  isUpdatingStateRankingFilters.value = true;
  
  try {
    // If period is selected, calculate and set dates automatically
    if (newPeriod) {
      const dateRange = calculateStateRankingDateRange(newPeriod);
      // Update dates without triggering date watch
      updateStateRankingFilters({
        date_from: dateRange.date_from,
        date_to: dateRange.date_to
      });
    } else {
      // If period is cleared, also clear dates
      updateStateRankingFilters({
        date_from: null,
        date_to: null
      });
    }
    
    // Wait a bit before updating URL to avoid conflicts
    await nextTick();
    updateStateRankingURL();
    await loadRankingByState();
  } finally {
    // Reset flag after a delay to ensure all updates are complete
    setTimeout(() => {
      isUpdatingStateRankingFilters.value = false;
    }, 100);
  }
});

watch(() => stateRankingFilters.value.sort_by, async () => {
  if (selectedStateId.value) {
    await loadRankingByState();
  }
});

watch(() => stateRankingFilters.value.provider_id, async () => {
  if (selectedStateId.value) {
    await loadRankingByState();
  }
});

watch(() => stateRankingFilters.value.aggregate_by_provider, async () => {
  if (selectedStateId.value) {
    await loadRankingByState();
  }
});

// Handle state ranking date changes (called directly from USDatePicker)
const onStateRankingDateChange = async () => {
  if (!selectedStateId.value || isUpdatingStateRankingFilters.value) return;
  
  isUpdatingStateRankingFilters.value = true;
  
  try {
    // Clear period when custom dates are selected
    const currentPeriod = stateRankingFilters.value.period;
    if (stateRankingFilters.value.date_from || stateRankingFilters.value.date_to) {
      if (currentPeriod) {
        updateStateRankingFilters({ period: null });
      }
    } else {
      // If both dates are cleared, also clear period
      if (currentPeriod) {
        updateStateRankingFilters({ period: null });
      }
    }
    updateStateRankingURL();
    await loadRankingByState();
  } finally {
    setTimeout(() => {
      isUpdatingStateRankingFilters.value = false;
    }, 100);
  }
};

// Update URL query parameters for state ranking
const updateStateRankingURL = () => {
  const query: Record<string, string> = {};
  
  // Preserve other query params that might exist
  const currentQuery = route.query;
  Object.keys(currentQuery).forEach(key => {
    // Only preserve params that are not related to state ranking
    if (!key.startsWith('state_') && key !== 'state_date_from' && key !== 'state_date_to') {
      query[key] = currentQuery[key] as string;
    }
  });
  
  // Add state ranking specific params
  if (stateRankingFilters.value.date_from) {
    query.state_date_from = stateRankingFilters.value.date_from;
  }
  if (stateRankingFilters.value.date_to) {
    query.state_date_to = stateRankingFilters.value.date_to;
  }
  
  // Only navigate if query actually changed
  const currentStateDateFrom = currentQuery.state_date_from as string;
  const currentStateDateTo = currentQuery.state_date_to as string;
  
  if (query.state_date_from !== currentStateDateFrom || query.state_date_to !== currentStateDateTo) {
    navigateTo({
      query: Object.keys(query).length > 0 ? query : {}
    }, { replace: true });
  }
};

// Helper function to format date for display
const formatStateDate = (dateString: string | null): string => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  } catch (e) {
    return dateString;
  }
};

// Medal color by position
const getMedalColor = (rank: number): string => {
  if (rank === 1) return 'warning'; // Gold
  if (rank === 2) return 'grey'; // Silver
  if (rank === 3) return 'orange'; // Bronze
  return 'default';
};

// Medal icon
const getMedalIcon = (rank: number): string => {
  if (rank <= 3) return 'mdi-medal';
  return 'mdi-numeric-' + rank + '-circle';
};

// Technology color helper
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

// Computed for Provider Distribution table (sorted by percentage, highest to lowest)
const providerDistributionTable = computed(() => {
  // Dados agregados
  if (aggregatedData.value?.providers && Array.isArray(aggregatedData.value.providers)) {
    const providers = [...aggregatedData.value.providers];
    const totalRequests = providers.reduce((sum, p) => sum + p.total_count, 0);
    
    return providers
      .map(p => ({
        provider_id: p.provider_id,
        name: p.name,
        technology: p.technology || 'Unknown',
        total_count: p.total_count,
        percentage: totalRequests > 0 ? (p.total_count / totalRequests) * 100 : 0,
        avg_success_rate: p.avg_success_rate,
        avg_speed: p.avg_speed
      }))
      .sort((a, b) => b.percentage - a.percentage);
  }
  
  // Dados de report individual
  if (reportData.value?.raw_data?.providers?.top_providers && Array.isArray(reportData.value.raw_data.providers.top_providers)) {
    const providers = [...reportData.value.raw_data.providers.top_providers];
    const totalRequests = providers.reduce((sum: number, p: any) => sum + (p.total_count || 0), 0);
    
    return providers
      .map((p: any) => ({
        provider_id: p.provider_id || p.id,
        name: p.name,
        technology: p.technology || 'Unknown',
        total_count: p.total_count || 0,
        percentage: totalRequests > 0 ? ((p.total_count || 0) / totalRequests) * 100 : 0,
        avg_success_rate: p.avg_success_rate || 0,
        avg_speed: p.avg_speed || 0
      }))
      .sort((a, b) => b.percentage - a.percentage);
  }
  
  return [];
});

// Computed for Technology Distribution table (sorted by percentage, highest to lowest)
const technologyDistributionTable = computed(() => {
  // Dados agregados - primeiro tentar usar technology_distribution direto se existir
  if (aggregatedData.value) {
    const directTechDist = (aggregatedData.value as any).technology_distribution;
    if (directTechDist && Array.isArray(directTechDist) && directTechDist.length > 0) {
      const technologies = [...directTechDist];
      const totalRequests = technologies.reduce((sum: number, t: any) => sum + (t.count || t.total_count || 0), 0);
      
      return technologies
        .map((t: any) => {
          const count = t.count || t.total_count || 0;
          return {
            technology: t.technology || t.tech || t.name || 'Unknown',
            total_count: count,
            percentage: totalRequests > 0 ? (count / totalRequests) * 100 : 0
          };
        })
        .sort((a, b) => b.percentage - a.percentage);
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
        const totalRequests = Array.from(techMap.values()).reduce((sum, count) => sum + count, 0);
        
        return Array.from(techMap.entries())
          .map(([technology, count]) => ({
            technology,
            total_count: count,
            percentage: totalRequests > 0 ? (count / totalRequests) * 100 : 0
          }))
          .sort((a, b) => b.percentage - a.percentage);
      }
    }
  }
  
  // Dados de report individual
  if (reportData.value?.raw_data) {
    // Tentar technology_metrics.distribution
    const techMetrics = reportData.value.raw_data.technology_metrics;
    if (techMetrics?.distribution && Array.isArray(techMetrics.distribution)) {
      const technologies = [...techMetrics.distribution];
      const totalRequests = technologies.reduce((sum: number, t: any) => sum + (t.count || t.total_count || 0), 0);
      
      return technologies
        .map((t: any) => {
          const count = t.count || t.total_count || 0;
          return {
            technology: t.technology || t.tech || t.name || 'Unknown',
            total_count: count,
            percentage: totalRequests > 0 ? (count / totalRequests) * 100 : 0
          };
        })
        .sort((a, b) => b.percentage - a.percentage);
    }
    
    // Tentar technology_distribution
    const techDist = reportData.value.raw_data.technology_distribution;
    if (techDist && Array.isArray(techDist) && techDist.length > 0) {
      const technologies = [...techDist];
      const totalRequests = technologies.reduce((sum: number, t: any) => sum + (t.count || t.total_count || 0), 0);
      
      return technologies
        .map((t: any) => {
          const count = t.count || t.total_count || 0;
          return {
            technology: t.technology || t.tech || t.name || 'Unknown',
            total_count: count,
            percentage: totalRequests > 0 ? (count / totalRequests) * 100 : 0
          };
        })
        .sort((a, b) => b.percentage - a.percentage);
    }
  }
  
  return [];
});
</script>

<template>
  <div>
    <!-- Header -->
    <v-row class="mb-4">
      <v-col cols="12">
        <h1 class="text-h4 font-weight-bold">Analytics</h1>
        <p class="text-body-1 text-medium-emphasis">
          Global Address Search Analytics
        </p>
      </v-col>
    </v-row>

    <!-- Tabs -->
    <v-row class="mb-4">
      <v-col cols="12">
        <v-tabs v-model="currentTab" color="primary">
          <v-tab value="ranking">
            <v-icon class="mr-2">mdi-trophy</v-icon>
            Domain Ranking
          </v-tab>
          <v-tab value="provider-ranking">
            <v-icon class="mr-2">mdi-account-network</v-icon>
            Provider Rankings
          </v-tab>
          <v-tab value="domain-dashboard">
            <v-icon class="mr-2">mdi-chart-box</v-icon>
            Domain Dashboard
          </v-tab>
          <v-tab value="state-ranking">
            <v-icon class="mr-2">mdi-map-marker</v-icon>
            State Ranking
          </v-tab>
          <v-tab value="comparison">
            <v-icon class="mr-2">mdi-compare</v-icon>
            Compare Domains
          </v-tab>
        </v-tabs>
      </v-col>
    </v-row>

    <!-- Loading -->
    <v-row v-if="loading">
      <v-col cols="12">
        <UiParentCard>
          <div class="d-flex justify-center align-center py-8">
            <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
          </div>
        </UiParentCard>
      </v-col>
    </v-row>

    <!-- Error -->
    <v-row v-else-if="error">
      <v-col cols="12">
        <UiParentCard>
          <v-alert type="error" variant="tonal" class="mb-0">
            {{ error }}
          </v-alert>
        </UiParentCard>
      </v-col>
    </v-row>

    <!-- TAB: Ranking -->
    <div v-if="currentTab === 'ranking'">
      <!-- Sort Selector -->
      <v-row class="mb-4">
        <v-col cols="12" class="d-flex justify-end">
          <v-select
            :model-value="currentSortBy"
            @update:model-value="changeSortBy"
            :items="sortOptions"
            item-title="label"
            item-value="value"
            label="Sort By"
            variant="outlined"
            density="compact"
            hide-details
            style="width: 200px"
            prepend-inner-icon="mdi-sort"
          />
        </v-col>
      </v-row>

      <div v-if="rankingData">
      <!-- Global Stats Cards -->
      <v-row class="mb-4">
        <v-col cols="12" sm="6" md="3">
          <v-card elevation="2" class="h-100">
            <v-card-text>
              <div class="d-flex align-center justify-space-between mb-2">
                <div class="text-h6 text-medium-emphasis">Total Domains</div>
                <v-icon color="primary" size="32">mdi-domain</v-icon>
              </div>
              <div class="text-h3 font-weight-bold text-primary">
                {{ globalStats.totalDomains }}
              </div>
              <div class="text-caption text-medium-emphasis mt-1">
                Active domains
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" sm="6" md="3">
          <v-card elevation="2" class="h-100">
            <v-card-text>
              <div class="d-flex align-center justify-space-between mb-2">
                <div class="text-h6 text-medium-emphasis">Total Requests</div>
                <v-icon color="success" size="32">mdi-chart-line</v-icon>
              </div>
              <div class="text-h3 font-weight-bold text-success">
                {{ formatNumber(globalStats.totalRequests) }}
              </div>
              <div class="text-caption text-medium-emphasis mt-1">
                Across all domains
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" sm="6" md="3">
          <v-card elevation="2" class="h-100">
            <v-card-text>
              <div class="d-flex align-center justify-space-between mb-2">
                <div class="text-h6 text-medium-emphasis">Avg Success Rate</div>
                <v-icon color="info" size="32">mdi-check-circle</v-icon>
              </div>
              <div class="text-h3 font-weight-bold text-info">
                {{ globalStats.avgSuccessRate.toFixed(1) }}%
              </div>
              <div class="text-caption text-medium-emphasis mt-1">
                Average across domains
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" sm="6" md="3">
          <v-card elevation="2" class="h-100">
            <v-card-text>
              <div class="d-flex align-center justify-space-between mb-2">
                <div class="text-h6 text-medium-emphasis">Avg Speed</div>
                <v-icon color="warning" size="32">mdi-speedometer</v-icon>
              </div>
              <div class="text-h3 font-weight-bold text-warning">
                {{ globalStats.avgSpeed > 0 ? globalStats.avgSpeed.toFixed(1) : 'N/A' }}
              </div>
              <div class="text-caption text-medium-emphasis mt-1">
                Mbps average
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Global Charts -->
      <v-row class="mb-4">
        <!-- Top Domains by Volume (Bar Chart) -->
        <v-col cols="12" md="6">
          <UiParentCard>
            <apexchart
              v-if="formattedRanking.length > 0"
              type="bar"
              height="300"
              :options="{
                chart: {
                  type: 'bar',
                  fontFamily: 'inherit',
                  toolbar: { show: false }
                },
                title: {
                  text: 'Top Domains by Volume',
                  align: 'left',
                  style: { fontSize: '16px', fontWeight: 600 }
                },
                plotOptions: {
                  bar: {
                    horizontal: true,
                    borderRadius: 4,
                    dataLabels: { position: 'top' }
                  }
                },
                dataLabels: {
                  enabled: true,
                  formatter: function(val: number) {
                    return formatNumber(val);
                  },
                  offsetX: 30
                },
                xaxis: {
                  categories: formattedRanking.slice(0, 5).map(r => r.domain.name)
                },
                colors: ['#1976d2']
              }"
              :series="[{ 
                name: 'Requests', 
                data: formattedRanking.slice(0, 5).map(r => r.metrics.total_requests) 
              }]"
            />
            <div v-else class="text-center py-8">
              <v-icon size="64" color="grey">mdi-chart-bar</v-icon>
              <p class="text-h6 mt-4 text-medium-emphasis">No data available</p>
            </div>
          </UiParentCard>
        </v-col>

        <!-- Success Rate Distribution (Donut Chart) -->
        <v-col cols="12" md="6">
          <UiParentCard>
            <apexchart
              v-if="formattedRanking.length > 0"
              type="donut"
              height="300"
              :options="{
                chart: {
                  type: 'donut',
                  fontFamily: 'inherit'
                },
                title: {
                  text: 'Success Rate Distribution',
                  align: 'left',
                  style: { fontSize: '16px', fontWeight: 600 }
                },
                labels: ['Excellent (≥95%)', 'Good (90-95%)', 'Fair (80-90%)', 'Poor (<80%)'],
                colors: ['#4caf50', '#8bc34a', '#ffc107', '#f44336'],
                legend: { position: 'bottom' },
                dataLabels: {
                  enabled: true,
                  formatter: function(val: number) {
                    return val.toFixed(0) + '%';
                  }
                }
              }"
              :series="[
                formattedRanking.filter(r => r.metrics.success_rate >= 95).length,
                formattedRanking.filter(r => r.metrics.success_rate >= 90 && r.metrics.success_rate < 95).length,
                formattedRanking.filter(r => r.metrics.success_rate >= 80 && r.metrics.success_rate < 90).length,
                formattedRanking.filter(r => r.metrics.success_rate < 80).length
              ]"
            />
            <div v-else class="text-center py-8">
              <v-icon size="64" color="grey">mdi-chart-donut</v-icon>
              <p class="text-h6 mt-4 text-medium-emphasis">No data available</p>
            </div>
          </UiParentCard>
        </v-col>
      </v-row>

      <!-- Domain Coverage (Bar Chart) + Speed Comparison (Bar Chart) -->
      <v-row class="mb-4">
        <!-- Reports per Domain -->
        <v-col cols="12" md="6">
          <UiParentCard>
            <apexchart
              v-if="formattedRanking.length > 0"
              type="bar"
              height="300"
              :options="{
                chart: {
                  type: 'bar',
                  fontFamily: 'inherit',
                  toolbar: { show: false }
                },
                title: {
                  text: 'Reports per Domain',
                  align: 'left',
                  style: { fontSize: '16px', fontWeight: 600 }
                },
                plotOptions: {
                  bar: {
                    borderRadius: 4,
                    columnWidth: '60%'
                  }
                },
                dataLabels: { enabled: false },
                xaxis: {
                  categories: formattedRanking.map(r => r.domain.name),
                  labels: {
                    rotate: -45,
                    style: { fontSize: '11px' }
                  }
                },
                yaxis: {
                  title: { text: 'Number of Reports' }
                },
                colors: ['#ff9800']
              }"
              :series="[{ 
                name: 'Reports', 
                data: formattedRanking.map(r => r.coverage.total_reports) 
              }]"
            />
            <div v-else class="text-center py-8">
              <v-icon size="64" color="grey">mdi-chart-bar</v-icon>
              <p class="text-h6 mt-4 text-medium-emphasis">No data available</p>
            </div>
          </UiParentCard>
        </v-col>

        <!-- Average Speed Comparison -->
        <v-col cols="12" md="6">
          <UiParentCard>
            <apexchart
              v-if="formattedRanking.filter(r => r.metrics.avg_speed > 0).length > 0"
              type="bar"
              height="300"
              :options="{
                chart: {
                  type: 'bar',
                  fontFamily: 'inherit',
                  toolbar: { show: false }
                },
                title: {
                  text: 'Average Speed by Domain',
                  align: 'left',
                  style: { fontSize: '16px', fontWeight: 600 }
                },
                plotOptions: {
                  bar: {
                    borderRadius: 4,
                    columnWidth: '60%'
                  }
                },
                dataLabels: {
                  enabled: true,
                  formatter: function(val: number) {
                    return val.toFixed(0) + ' Mbps';
                  }
                },
                xaxis: {
                  categories: formattedRanking.filter(r => r.metrics.avg_speed > 0).map(r => r.domain.name),
                  labels: {
                    rotate: -45,
                    style: { fontSize: '11px' }
                  }
                },
                yaxis: {
                  title: { text: 'Speed (Mbps)' }
                },
                colors: ['#9c27b0']
              }"
              :series="[{ 
                name: 'Avg Speed', 
                data: formattedRanking.filter(r => r.metrics.avg_speed > 0).map(r => r.metrics.avg_speed) 
              }]"
            />
            <div v-else class="text-center py-8">
              <v-icon size="64" color="grey">mdi-speedometer</v-icon>
              <p class="text-h6 mt-4 text-medium-emphasis">No speed data available</p>
            </div>
          </UiParentCard>
        </v-col>
      </v-row>

      <!-- Top 3 Podium -->
      <v-row class="mb-4" v-if="topThree.length >= 3">
        <v-col cols="12">
          <UiParentCard title="🏆 Top 3 Domains">
            <v-row>
              <!-- 2nd Place -->
              <v-col cols="12" md="4" class="order-md-1">
                <v-card elevation="4" class="h-100" color="grey-lighten-4">
                  <v-card-text class="text-center">
                    <v-icon size="48" color="grey">mdi-medal</v-icon>
                    <div class="text-h5 font-weight-bold mt-2">#2</div>
                    <div class="text-h6 mt-2">{{ topThree[1].domain.name }}</div>
                    <v-divider class="my-3"></v-divider>
                    <div class="d-flex justify-space-between mb-2">
                      <span class="text-caption">Score:</span>
                      <span class="font-weight-bold">{{ topThree[1].formattedScore }}</span>
                    </div>
                    <div class="d-flex justify-space-between mb-2">
                      <span class="text-caption">Requests:</span>
                      <span class="font-weight-bold">{{ topThree[1].formattedRequests }}</span>
                    </div>
                    <div class="d-flex justify-space-between">
                      <span class="text-caption">Success:</span>
                      <span class="font-weight-bold">{{ topThree[1].formattedSuccessRate }}</span>
                    </div>
                    <v-btn
                      color="primary"
                      variant="tonal"
                      size="small"
                      class="mt-3"
                      @click="viewDomainDashboard(topThree[1].domain.id)"
                    >
                      View Dashboard
                    </v-btn>
                  </v-card-text>
                </v-card>
              </v-col>

              <!-- 1st Place -->
              <v-col cols="12" md="4" class="order-md-0">
                <v-card elevation="8" class="h-100" color="warning-lighten-4">
                  <v-card-text class="text-center">
                    <v-icon size="64" color="warning">mdi-trophy</v-icon>
                    <div class="text-h4 font-weight-bold mt-2">👑 #1</div>
                    <div class="text-h5 mt-2">{{ topThree[0].domain.name }}</div>
                    <v-divider class="my-3"></v-divider>
                    <div class="d-flex justify-space-between mb-2">
                      <span class="text-caption">Score:</span>
                      <span class="font-weight-bold text-h6">{{ topThree[0].formattedScore }}</span>
                    </div>
                    <div class="d-flex justify-space-between mb-2">
                      <span class="text-caption">Requests:</span>
                      <span class="font-weight-bold">{{ topThree[0].formattedRequests }}</span>
                    </div>
                    <div class="d-flex justify-space-between">
                      <span class="text-caption">Success:</span>
                      <span class="font-weight-bold">{{ topThree[0].formattedSuccessRate }}</span>
                    </div>
                    <v-btn
                      color="warning"
                      variant="flat"
                      size="small"
                      class="mt-3"
                      @click="viewDomainDashboard(topThree[0].domain.id)"
                    >
                      View Dashboard
                    </v-btn>
                  </v-card-text>
                </v-card>
              </v-col>

              <!-- 3rd Place -->
              <v-col cols="12" md="4" class="order-md-2">
                <v-card elevation="4" class="h-100" color="orange-lighten-4">
                  <v-card-text class="text-center">
                    <v-icon size="48" color="orange">mdi-medal</v-icon>
                    <div class="text-h5 font-weight-bold mt-2">#3</div>
                    <div class="text-h6 mt-2">{{ topThree[2].domain.name }}</div>
                    <v-divider class="my-3"></v-divider>
                    <div class="d-flex justify-space-between mb-2">
                      <span class="text-caption">Score:</span>
                      <span class="font-weight-bold">{{ topThree[2].formattedScore }}</span>
                    </div>
                    <div class="d-flex justify-space-between mb-2">
                      <span class="text-caption">Requests:</span>
                      <span class="font-weight-bold">{{ topThree[2].formattedRequests }}</span>
                    </div>
                    <div class="d-flex justify-space-between">
                      <span class="text-caption">Success:</span>
                      <span class="font-weight-bold">{{ topThree[2].formattedSuccessRate }}</span>
                    </div>
                    <v-btn
                      color="primary"
                      variant="tonal"
                      size="small"
                      class="mt-3"
                      @click="viewDomainDashboard(topThree[2].domain.id)"
                    >
                      View Dashboard
                    </v-btn>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </UiParentCard>
        </v-col>
      </v-row>

      <!-- Full Ranking Table -->
      <v-row>
        <v-col cols="12">
          <UiChildCard title="Complete Ranking">
            <v-table fixed-header height="600px">
              <thead>
                <tr>
                  <th class="text-center" style="width: 80px;">Rank</th>
                  <th class="text-left">Domain</th>
                  <th class="text-right">Score</th>
                  <th class="text-right">Total Requests</th>
                  <th class="text-right">Success Rate</th>
                  <th class="text-right">Avg Speed</th>
                  <th class="text-center">Providers</th>
                  <th class="text-center">States</th>
                  <th class="text-center">Reports</th>
                  <th class="text-center">Period</th>
                  <th class="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in formattedRanking" :key="item.domain.id">
                  <td class="text-center">
                    <v-chip
                      :color="getMedalColor(item.rank)"
                      variant="flat"
                      size="small"
                    >
                      <v-icon v-if="item.rank <= 3" size="small" class="mr-1">{{ getMedalIcon(item.rank) }}</v-icon>
                      {{ item.rank }}
                    </v-chip>
                  </td>
                  <td>
                    <div class="font-weight-medium">{{ item.domain.name }}</div>
                    <div class="text-caption text-medium-emphasis">{{ item.domain.slug }}</div>
                  </td>
                  <td class="text-right">
                    <v-chip color="primary" variant="tonal" size="small">
                      {{ item.formattedScore }}
                    </v-chip>
                  </td>
                  <td class="text-right font-weight-medium">
                    {{ item.formattedRequests }}
                  </td>
                  <td class="text-right">
                    <v-chip 
                      :color="item.metrics.success_rate >= 90 ? 'success' : item.metrics.success_rate >= 70 ? 'warning' : 'error'"
                      variant="tonal"
                      size="small"
                    >
                      {{ item.formattedSuccessRate }}
                    </v-chip>
                  </td>
                  <td class="text-right">{{ item.formattedSpeed }}</td>
                  <td class="text-center">
                    <v-chip size="small" variant="outlined">
                      {{ item.metrics.unique_providers }}
                    </v-chip>
                  </td>
                  <td class="text-center">
                    <v-chip size="small" variant="outlined">
                      {{ item.metrics.unique_states }}
                    </v-chip>
                  </td>
                  <td class="text-center">{{ item.coverage.total_reports }}</td>
                  <td class="text-center">
                    <div class="text-caption">{{ item.formattedPeriod }}</div>
                    <div class="text-caption text-medium-emphasis">{{ item.coverage.days_covered }} days</div>
                  </td>
                  <td class="text-center">
                    <v-btn
                      icon
                      size="small"
                      variant="text"
                      color="primary"
                      @click="viewDomainDashboard(item.domain.id)"
                      title="View Dashboard"
                    >
                      <v-icon>mdi-chart-box</v-icon>
                    </v-btn>
                  </td>
                </tr>
              </tbody>
            </v-table>
            
            <div v-if="formattedRanking.length === 0" class="text-center py-8">
              <v-icon size="64" color="grey">mdi-chart-box-outline</v-icon>
              <p class="text-h6 mt-4 text-medium-emphasis">No ranking data available</p>
            </div>
          </UiChildCard>
        </v-col>
      </v-row>
      </div>
    </div>

    <!-- TAB: Provider Rankings -->
    <div v-if="currentTab === 'provider-ranking'">
      <ProviderRankingTable />
    </div>

    <!-- TAB: Domain Dashboard -->
    <div v-if="currentTab === 'domain-dashboard'">
      <!-- Domain Selector -->
      <v-row class="mb-4">
        <v-col cols="12">
          <UiParentCard>
            <v-row>
              <v-col cols="12" md="6">
                <v-select
                  v-model="selectedDomainId"
                  :items="domainOptions"
                  label="Select Domain"
                  variant="outlined"
                  prepend-inner-icon="mdi-domain"
                  hint="Choose a domain to view its detailed dashboard"
                  persistent-hint
                  clearable
                >
                  <template v-slot:item="{ props, item }">
                    <v-list-item v-bind="props">
                      <template v-slot:prepend>
                        <v-icon color="primary">mdi-domain</v-icon>
                      </template>
                      <v-list-item-title>{{ item.raw.title }}</v-list-item-title>
                    </v-list-item>
                  </template>
                </v-select>
              </v-col>
              <v-col cols="12" md="6" v-if="selectedDomainId">
                <v-select
                  v-model="selectedReportId"
                  :items="reportSelectOptions"
                  item-title="reportDate"
                  item-value="id"
                  label="Select Report"
                  variant="outlined"
                  density="compact"
                  :loading="reportsLoading"
                  prepend-inner-icon="mdi-calendar"
                >
                  <template v-slot:item="{ props, item }">
                    <v-list-item v-bind="props">
                      <template v-slot:prepend>
                        <v-chip :color="item.raw.statusColor" size="x-small" variant="tonal"></v-chip>
                      </template>
                      <template v-slot:subtitle>
                        <span class="text-caption" v-if="item.raw.id !== 'all'">ID: {{ item.raw.id }} | Version: {{ item.raw.data_version }}</span>
                        <span class="text-caption" v-else>Combined data from all reports</span>
                      </template>
                    </v-list-item>
                  </template>
                </v-select>
              </v-col>
            </v-row>
            <v-row v-if="selectedDomainId && displayInfo">
              <v-col cols="12">
                <v-alert color="info" variant="tonal" density="compact">
                  <v-icon start>mdi-information</v-icon>
                  {{ displayInfo }}
                </v-alert>
              </v-col>
            </v-row>
          </UiParentCard>
        </v-col>
      </v-row>

      <!-- Period and Date Filters (only when "All Reports Combined" is selected) -->
      <v-row v-if="selectedDomainId && selectedReportId === 'all'" class="mb-4">
        <v-col cols="12">
          <v-card variant="outlined" class="pa-3">
            <div class="text-caption text-medium-emphasis mb-2">
              <v-icon size="small" class="mr-1">mdi-filter</v-icon>
              Filter by Period or Date Range
            </div>
            <v-row>
              <v-col cols="12" md="3">
                <v-select
                  v-model="domainDashboardPeriod"
                  :items="domainDashboardPeriodOptions"
                  label="Period"
                  clearable
                  variant="outlined"
                  density="compact"
                  prepend-inner-icon="mdi-calendar-range"
                  @update:model-value="onDomainDashboardPeriodChange"
                />
              </v-col>

              <v-col cols="12" sm="6" md="4">
                <USDatePicker
                  v-model="domainDashboardDateFrom"
                  label="Start Date"
                  prepend-inner-icon="mdi-calendar-start"
                />
              </v-col>

              <v-col cols="12" sm="6" md="4">
                <USDatePicker
                  v-model="domainDashboardDateTo"
                  label="End Date"
                  prepend-inner-icon="mdi-calendar-end"
                />
              </v-col>
            </v-row>
          </v-card>
        </v-col>
      </v-row>

      <!-- Empty State -->
      <v-row v-if="!selectedDomainId">
        <v-col cols="12">
          <UiParentCard>
            <div class="text-center py-12">
              <v-icon size="80" color="grey">mdi-chart-box-outline</v-icon>
              <h3 class="text-h5 mt-4 mb-2">Select a domain</h3>
              <p class="text-medium-emphasis">
                Choose a domain from the dropdown above to view its detailed dashboard
              </p>
            </div>
          </UiParentCard>
        </v-col>
      </v-row>

      <!-- Loading -->
      <v-row v-else-if="domainLoading">
        <v-col cols="12">
          <UiParentCard>
            <div class="d-flex justify-center align-center py-8">
              <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
            </div>
          </UiParentCard>
        </v-col>
      </v-row>

      <!-- Error -->
      <v-row v-else-if="domainError">
        <v-col cols="12">
          <UiParentCard>
            <v-alert type="error" variant="tonal" class="mb-0">
              {{ domainError }}
            </v-alert>
          </UiParentCard>
        </v-col>
      </v-row>

      <!-- Dashboard Content -->
      <div v-else-if="selectedDomainId && (reportData || aggregatedData)">
        <!-- Top Cards -->
        <v-row class="mb-4">
          <!-- Total Requests -->
          <v-col cols="12" sm="6" md="3">
            <v-card elevation="2" class="h-100">
              <v-card-text>
                <div class="d-flex align-center justify-space-between mb-2">
                  <div class="text-h6 text-medium-emphasis">Total Requests</div>
                  <v-icon color="primary" size="32">mdi-chart-line</v-icon>
                </div>
                <div class="text-h3 font-weight-bold text-primary">
                  {{ formatNumber(topCards.totalRequests) }}
                </div>
                <div class="text-caption text-medium-emphasis mt-1">
                  All time requests
                </div>
              </v-card-text>
            </v-card>
          </v-col>

          <!-- Success Rate -->
          <v-col cols="12" sm="6" md="3">
            <v-card elevation="2" class="h-100">
              <v-card-text>
                <div class="d-flex align-center justify-space-between mb-2">
                  <div class="text-h6 text-medium-emphasis">Success Rate</div>
                  <v-icon color="success" size="32">mdi-check-circle</v-icon>
                </div>
                <div class="text-h3 font-weight-bold text-success">
                  {{ formatPercentage(topCards.successRate) }}
                </div>
                <div class="text-caption text-medium-emphasis mt-1">
                  Successful requests
                </div>
              </v-card-text>
            </v-card>
          </v-col>

          <!-- Daily Average -->
          <v-col cols="12" sm="6" md="3">
            <v-card elevation="2" class="h-100">
              <v-card-text>
                <div class="d-flex align-center justify-space-between mb-2">
                  <div class="text-h6 text-medium-emphasis">Daily Average</div>
                  <v-icon color="info" size="32">mdi-calendar-today</v-icon>
                </div>
                <div class="text-h3 font-weight-bold text-info">
                  {{ formatDecimal(topCards.dailyAverage) }}
                </div>
                <div class="text-caption text-medium-emphasis mt-1">
                  Average per day
                </div>
              </v-card-text>
            </v-card>
          </v-col>

          <!-- Unique Providers -->
          <v-col cols="12" sm="6" md="3">
            <v-card elevation="2" class="h-100">
              <v-card-text>
                <div class="d-flex align-center justify-space-between mb-2">
                  <div class="text-h6 text-medium-emphasis">Unique Providers</div>
                  <v-icon color="warning" size="32">mdi-domain</v-icon>
                </div>
                <div class="text-h3 font-weight-bold text-warning">
                  {{ topCards.uniqueProviders }}
                </div>
                <div class="text-caption text-medium-emphasis mt-1">
                  Different providers
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- Charts Row 1 -->
        <v-row class="mb-4">
          <!-- Provider Distribution -->
          <v-col cols="12" md="6">
            <UiParentCard>
              <div v-if="providerChartData.series.length > 0">
                <apexchart
                  type="donut"
                  height="350"
                  :options="{
                    chart: {
                      type: 'donut',
                      fontFamily: 'inherit',
                      height: 350
                    },
                    title: {
                      text: 'Provider Distribution',
                      align: 'left',
                      style: {
                        fontSize: '18px',
                        fontWeight: 600
                      }
                    },
                    labels: providerChartData.labels,
                    responsive: [{
                      breakpoint: 480,
                      options: {
                        chart: { width: 300 },
                        legend: { position: 'bottom' }
                      }
                    }],
                    plotOptions: {
                      pie: {
                        donut: {
                          labels: {
                            show: true,
                            total: {
                              show: true,
                              label: 'Total',
                              fontSize: '20px',
                              fontWeight: 600
                            }
                          }
                        }
                      }
                    },
                    legend: {
                      position: 'bottom'
                    },
                    dataLabels: {
                      enabled: true,
                      formatter: function(val: number) {
                        return val.toFixed(1) + '%';
                      }
                    }
                  }"
                  :series="providerChartData.series"
                />
              </div>
              <div v-else class="text-center py-8">
                <v-icon size="64" color="grey">mdi-chart-donut</v-icon>
                <p class="text-h6 mt-4 text-medium-emphasis">No provider data available</p>
              </div>
            </UiParentCard>
          </v-col>

          <!-- Top States -->
          <v-col cols="12" md="6">
            <UiParentCard>
              <div v-if="topStatesChartData.data.length > 0">
                <apexchart
                  type="bar"
                  height="350"
                  :options="{
                    chart: {
                      type: 'bar',
                      fontFamily: 'inherit',
                      toolbar: { show: false }
                    },
                    title: {
                      text: 'Top States by Requests',
                      align: 'left',
                      style: {
                        fontSize: '18px',
                        fontWeight: 600
                      }
                    },
                    plotOptions: {
                      bar: {
                        horizontal: true,
                        borderRadius: 4,
                        dataLabels: { position: 'top' }
                      }
                    },
                    dataLabels: {
                      enabled: true,
                      formatter: function(val: number) {
                        if (val >= 1000000) {
                          return (val / 1000000).toFixed(1) + 'M';
                        }
                        if (val >= 1000) {
                          return (val / 1000).toFixed(1) + 'K';
                        }
                        return val.toString();
                      },
                      offsetX: 30
                    },
                    xaxis: {
                      categories: topStatesChartData.categories
                    },
                    colors: ['#1976d2']
                  }"
                  :series="[{ name: 'Requests', data: topStatesChartData.data }]"
                />
              </div>
              <div v-else class="text-center py-8">
                <v-icon size="64" color="grey">mdi-chart-bar</v-icon>
                <p class="text-h6 mt-4 text-medium-emphasis">No state data available</p>
              </div>
            </UiParentCard>
          </v-col>
        </v-row>

        <!-- Provider Distribution Table -->
        <v-row class="mb-4" v-if="providerDistributionTable.length > 0">
          <v-col cols="12">
            <UiParentCard title="Provider Distribution Details">
              <v-table>
                <thead>
                  <tr>
                    <th class="text-left">Provider</th>
                    <th class="text-left">Technology</th>
                    <th class="text-right">Total Requests</th>
                    <th class="text-center">Percentage</th>
                    <th class="text-right">Avg Speed</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="provider in providerDistributionTable" :key="provider.provider_id">
                    <td class="font-weight-medium">{{ provider.name }}</td>
                    <td>
                      <v-chip
                        :color="getTechColor(provider.technology)"
                        variant="tonal"
                        size="small"
                      >
                        {{ provider.technology }}
                      </v-chip>
                    </td>
                    <td class="text-right font-weight-medium">
                      {{ formatNumber(provider.total_count) }}
                    </td>
                    <td class="text-center">
                      <v-chip
                        :color="provider.percentage >= 20 ? 'success' : provider.percentage >= 10 ? 'info' : 'default'"
                        variant="tonal"
                        size="small"
                      >
                        {{ formatPercentage(provider.percentage) }}
                      </v-chip>
                    </td>
                    <td class="text-right">{{ provider.avg_speed.toFixed(0) }} ms</td>
                  </tr>
                </tbody>
              </v-table>
            </UiParentCard>
          </v-col>
        </v-row>

        <!-- Charts Row 2 -->
        <v-row>
          <!-- Average Speed by State -->
          <v-col cols="12" md="6">
            <UiParentCard>
              <div v-if="speedByStateChartData.data.length > 0">
                <apexchart
                  type="bar"
                  height="350"
                  :options="{
                    chart: {
                      type: 'bar',
                      fontFamily: 'inherit',
                      toolbar: { show: false }
                    },
                    title: {
                      text: 'Average Speed by State',
                      align: 'left',
                      style: {
                        fontSize: '18px',
                        fontWeight: 600
                      }
                    },
                    plotOptions: {
                      bar: {
                        horizontal: false,
                        borderRadius: 8,
                        columnWidth: '55%',
                        distributed: false
                      }
                    },
                    dataLabels: {
                      enabled: false
                    },
                    xaxis: {
                      categories: speedByStateChartData.categories,
                      labels: {
                        style: {
                          fontSize: '12px'
                        }
                      }
                    },
                    yaxis: {
                      title: {
                        text: 'Average Speed (Mbps)'
                      }
                    },
                    colors: ['#4caf50'],
                    grid: {
                      show: true,
                      borderColor: '#f0f0f0'
                    }
                  }"
                  :series="[{ name: 'Avg Speed (Mbps)', data: speedByStateChartData.data }]"
                />
              </div>
              <div v-else class="text-center py-8">
                <v-icon size="64" color="grey">mdi-speedometer</v-icon>
                <p class="text-h6 mt-4 text-medium-emphasis">No speed data available</p>
              </div>
            </UiParentCard>
          </v-col>

          <!-- Technology Distribution -->
          <v-col cols="12" md="6">
            <UiParentCard>
              <div v-if="technologyChartData.series.length > 0">
                <apexchart
                  type="donut"
                  height="350"
                  :options="{
                    chart: {
                      type: 'donut',
                      fontFamily: 'inherit',
                      height: 350
                    },
                    title: {
                      text: 'Technology Distribution',
                      align: 'left',
                      style: {
                        fontSize: '18px',
                        fontWeight: 600
                      }
                    },
                    labels: technologyChartData.labels,
                    responsive: [{
                      breakpoint: 480,
                      options: {
                        chart: { width: 300 },
                        legend: { position: 'bottom' }
                      }
                    }],
                    plotOptions: {
                      pie: {
                        donut: {
                          labels: {
                            show: true,
                            total: {
                              show: true,
                              label: 'Total',
                              fontSize: '20px',
                              fontWeight: 600
                            }
                          }
                        }
                      }
                    },
                    legend: {
                      position: 'bottom'
                    },
                    dataLabels: {
                      enabled: true,
                      formatter: function(val: number) {
                        return val.toFixed(1) + '%';
                      }
                    }
                  }"
                  :series="technologyChartData.series"
                />
              </div>
              <div v-else class="text-center py-8">
                <v-icon size="64" color="grey">mdi-chart-donut</v-icon>
                <p class="text-h6 mt-4 text-medium-emphasis">No technology data available</p>
              </div>
            </UiParentCard>
          </v-col>
        </v-row>

        <!-- Technology Distribution Table -->
        <v-row class="mb-4" v-if="technologyDistributionTable.length > 0">
          <v-col cols="12">
            <UiParentCard title="Technology Distribution Details">
              <v-table>
                <thead>
                  <tr>
                    <th class="text-left">Technology</th>
                    <th class="text-right">Total Requests</th>
                    <th class="text-center">Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(tech, index) in technologyDistributionTable" :key="index">
                    <td>
                      <v-chip
                        :color="getTechColor(tech.technology)"
                        variant="tonal"
                        size="small"
                      >
                        {{ tech.technology }}
                      </v-chip>
                    </td>
                    <td class="text-right font-weight-medium">
                      {{ formatNumber(tech.total_count) }}
                    </td>
                    <td class="text-center">
                      <v-chip
                        :color="tech.percentage >= 30 ? 'success' : tech.percentage >= 15 ? 'info' : 'default'"
                        variant="tonal"
                        size="small"
                      >
                        {{ formatPercentage(tech.percentage) }}
                      </v-chip>
                    </td>
                  </tr>
                </tbody>
              </v-table>
            </UiParentCard>
          </v-col>
        </v-row>
      </div>
    </div>

    <!-- TAB: State Ranking -->
    <div v-if="currentTab === 'state-ranking'">
      <!-- Filters -->
      <v-row class="mb-4">
        <v-col cols="12">
          <UiParentCard title="State Ranking Filters">
            <v-row>
              <v-col cols="12" md="4">
                <v-select
                  v-model="selectedStateId"
                  :items="stateOptions"
                  label="Select State"
                  variant="outlined"
                  prepend-inner-icon="mdi-map-marker"
                  hint="Select a state to view provider rankings"
                  persistent-hint
                  clearable
                  :loading="statesLoading"
                  :disabled="statesLoading"
                >
                  <template v-slot:item="{ props, item }">
                    <v-list-item v-bind="props">
                      <template v-slot:prepend>
                        <v-icon color="primary">mdi-map-marker</v-icon>
                      </template>
                      <v-list-item-title>{{ item.raw.title }}</v-list-item-title>
                    </v-list-item>
                  </template>
                </v-select>
                <v-alert
                  v-if="statesError"
                  type="error"
                  variant="tonal"
                  density="compact"
                  class="mt-2"
                >
                  {{ statesError }}
                </v-alert>
              </v-col>
              <v-col cols="12" md="3" v-if="selectedStateId">
                <v-select
                  v-model="stateRankingFilters.period"
                  :items="[
                    { value: 'today', title: 'Today' },
                    { value: 'yesterday', title: 'Yesterday' },
                    { value: 'last_week', title: 'Last Week' },
                    { value: 'last_month', title: 'Last Month' },
                    { value: 'last_year', title: 'Last Year' },
                    { value: 'all_time', title: 'All Time' }
                  ]"
                  label="Period"
                  variant="outlined"
                  prepend-inner-icon="mdi-calendar"
                />
              </v-col>
              <v-col cols="12" md="2" v-if="selectedStateId">
                <v-select
                  v-model="stateRankingFilters.sort_by"
                  :items="[
                    { value: 'total_requests', title: 'Total Requests' },
                    { value: 'success_rate', title: 'Success Rate' },
                    { value: 'avg_speed', title: 'Avg Speed' },
                    { value: 'total_reports', title: 'Total Reports' }
                  ]"
                  label="Sort By"
                  variant="outlined"
                  prepend-inner-icon="mdi-sort"
                  density="compact"
                />
              </v-col>
              <v-col cols="12" md="2" v-if="selectedStateId">
                <v-switch
                  v-model="stateRankingFilters.aggregate_by_provider"
                  label="Aggregate by Provider"
                  color="primary"
                  density="compact"
                  hide-details
                >
                  <template v-slot:prepend>
                    <v-tooltip text="When enabled, combines all domains for a provider into one entry.">
                      <template v-slot:activator="{ props }">
                        <v-icon v-bind="props" size="small">mdi-information-outline</v-icon>
                      </template>
                    </v-tooltip>
                  </template>
                </v-switch>
              </v-col>
              <v-col cols="12" md="2" v-if="selectedStateId">
                <v-btn
                  color="primary"
                  variant="outlined"
                  block
                  @click="clearStateRankingFilters(); updateStateRankingURL(); loadRankingByState()"
                >
                  Clear Filters
                </v-btn>
              </v-col>
            </v-row>
            
            <!-- Date Range Filters -->
            <v-row v-if="selectedStateId" class="mt-2">
              <v-col cols="12">
                <v-card variant="outlined" class="pa-3">
                  <div class="text-caption text-medium-emphasis mb-2">
                    <v-icon size="small" class="mr-1">mdi-calendar-range</v-icon>
                    Custom Date Range (Optional)
                  </div>
                  <v-row>
                    <v-col cols="12" sm="6" md="4">
                      <USDatePicker
                        :model-value="stateRankingFilters.date_from ?? null"
                        label="Start Date"
                        prepend-inner-icon="mdi-calendar-start"
                        @update:model-value="async (value: string | null | undefined) => { 
                          updateStateRankingFilters({ date_from: value ?? null }); 
                          await nextTick();
                          onStateRankingDateChange();
                        }"
                      />
                    </v-col>

                    <v-col cols="12" sm="6" md="4">
                      <USDatePicker
                        :model-value="stateRankingFilters.date_to ?? null"
                        label="End Date"
                        prepend-inner-icon="mdi-calendar-end"
                        @update:model-value="async (value: string | null | undefined) => { 
                          updateStateRankingFilters({ date_to: value ?? null }); 
                          await nextTick();
                          onStateRankingDateChange();
                        }"
                      />
                    </v-col>
                  </v-row>
                </v-card>
              </v-col>
            </v-row>
          </UiParentCard>
        </v-col>
      </v-row>

      <!-- Empty State -->
      <v-row v-if="!selectedStateId">
        <v-col cols="12">
          <UiParentCard>
            <div class="text-center py-12">
              <v-icon size="80" color="grey">mdi-map-marker-outline</v-icon>
              <h3 class="text-h5 mt-4 mb-2">Select a State</h3>
              <p class="text-medium-emphasis">
                Choose a state from the dropdown above to view provider rankings for that state
              </p>
            </div>
          </UiParentCard>
        </v-col>
      </v-row>

      <!-- Loading -->
      <v-row v-else-if="stateRankingLoading">
        <v-col cols="12">
          <UiParentCard>
            <div class="d-flex justify-center align-center py-8">
              <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
            </div>
          </UiParentCard>
        </v-col>
      </v-row>

      <!-- Error -->
      <v-row v-else-if="stateRankingError">
        <v-col cols="12">
          <UiParentCard>
            <v-alert type="error" variant="tonal" class="mb-0">
              {{ stateRankingError }}
            </v-alert>
          </UiParentCard>
        </v-col>
      </v-row>

      <!-- Ranking Table -->
      <v-row v-else-if="selectedStateId && formattedStateRanking.length > 0">
        <v-col cols="12">
          <UiParentCard :title="`Provider Rankings - ${getStateNameById(selectedStateId)}`">
            <v-alert
              type="info"
              variant="tonal"
              class="mb-4"
              density="compact"
            >
              <v-icon start>mdi-information</v-icon>
              Showing {{ stateRankingTotalEntries }} {{ isStateRankingAggregated ? 'provider' : 'domain-provider' }} ranking(s) for {{ getStateNameById(selectedStateId) }}
              <span v-if="isStateRankingAggregated" class="ml-2">
                <v-chip size="x-small" color="primary" variant="tonal">Aggregated by Provider</v-chip>
              </span>
            </v-alert>

            <v-table>
              <thead>
                <tr>
                  <th class="text-left">Rank</th>
                  <th class="text-left" v-if="!isStateRankingAggregated">Domain</th>
                  <th class="text-left">Provider</th>
                  <th class="text-right">Total Requests</th>
                  <th class="text-right" v-if="!isStateRankingAggregated">% of Domain</th>
                  <th class="text-right" v-if="!isStateRankingAggregated">Provider Total</th>
                  <th class="text-right" v-if="!isStateRankingAggregated">
                    <div>% of Provider</div>
                    <div class="text-caption text-medium-emphasis">(row/provider)</div>
                  </th>
                  <th class="text-right" v-if="isStateRankingAggregated">% of State</th>
                  <th class="text-right" v-if="isStateRankingAggregated">Domains</th>
                  <th class="text-right">Success Rate</th>
                  <th class="text-right">Avg Speed</th>
                  <th class="text-center">Reports</th>
                  <th class="text-center">Period</th>
                  <th class="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, index) in formattedStateRanking" :key="isStateRankingAggregated ? `provider-${item.provider_id}` : `domain-${('domain_id' in item) ? item.domain_id : index}-provider-${item.provider_id}`">
                  <td>
                    <v-chip
                      :color="item.rank <= 3 ? 'primary' : 'default'"
                      variant="flat"
                      size="small"
                    >
                      <v-icon v-if="item.rank === 1" size="small" class="mr-1">mdi-trophy</v-icon>
                      <v-icon v-else-if="item.rank === 2" size="small" class="mr-1">mdi-medal</v-icon>
                      <v-icon v-else-if="item.rank === 3" size="small" class="mr-1">mdi-medal-outline</v-icon>
                      {{ item.rank }}
                    </v-chip>
                  </td>
                  <!-- Domain column (only when NOT aggregated) -->
                  <td v-if="!isStateRankingAggregated && 'domain_name' in item">
                    <div class="font-weight-medium">{{ item.domain_name }}</div>
                    <div class="text-caption text-medium-emphasis">{{ item.domain_slug }}</div>
                  </td>
                  <!-- Provider column -->
                  <td>
                    <div class="font-weight-medium">{{ item.provider_name }}</div>
                    <v-chip
                      v-if="'technology' in item && item.technology"
                      size="x-small"
                      variant="outlined"
                      class="mt-1"
                    >
                      {{ item.technology }}
                    </v-chip>
                  </td>
                  <!-- Total Requests -->
                  <td class="text-right font-weight-medium">
                    {{ item.formattedRequests }}
                  </td>
                  <!-- Percentage of Domain column (only when NOT aggregated) -->
                  <td class="text-right" v-if="!isStateRankingAggregated && 'formattedPercentage' in item">
                    <v-chip color="primary" variant="tonal" size="small">
                      {{ item.formattedPercentage }}
                    </v-chip>
                  </td>
                  <!-- Provider Total Requests column (only when NOT aggregated) -->
                  <td class="text-right" v-if="!isStateRankingAggregated && 'formattedProviderTotalRequests' in item">
                    <div class="font-weight-medium">{{ item.formattedProviderTotalRequests }}</div>
                    <div class="text-caption text-medium-emphasis">All domains</div>
                  </td>
                  <!-- Percentage of Provider in State column (only when NOT aggregated) -->
                  <td class="text-right" v-if="!isStateRankingAggregated && 'formattedPercentageOfProvider' in item">
                    <v-tooltip text="Percentage that this domain+provider row represents of the provider's total in this state">
                      <template v-slot:activator="{ props }">
                        <v-chip v-bind="props" color="info" variant="tonal" size="small">
                          {{ item.formattedPercentageOfProvider }}
                        </v-chip>
                      </template>
                    </v-tooltip>
                    <div class="text-caption text-medium-emphasis mt-1">of provider</div>
                  </td>
                  <!-- Percentage of State column (only when aggregated) -->
                  <td class="text-right" v-if="isStateRankingAggregated && 'formattedPercentage' in item">
                    <v-chip color="primary" variant="tonal" size="small">
                      {{ item.formattedPercentage }}
                    </v-chip>
                  </td>
                  <!-- Domains column (only when aggregated) -->
                  <td class="text-right" v-if="isStateRankingAggregated && 'formattedDomains' in item">
                    <v-tooltip :text="item.formattedDomains || ''">
                      <template v-slot:activator="{ props }">
                        <v-chip
                          v-bind="props"
                          color="info"
                          variant="tonal"
                          size="small"
                        >
                          {{ ('domainsCount' in item ? item.domainsCount : 0) }} domain(s)
                        </v-chip>
                      </template>
                    </v-tooltip>
                  </td>
                  <!-- Success Rate -->
                  <td class="text-right">
                    <v-chip
                      :color="item.avg_success_rate >= 90 ? 'success' : item.avg_success_rate >= 70 ? 'warning' : 'error'"
                      variant="tonal"
                      size="small"
                    >
                      {{ item.formattedSuccessRate }}
                    </v-chip>
                  </td>
                  <!-- Avg Speed -->
                  <td class="text-right">{{ item.formattedSpeed }}</td>
                  <!-- Reports -->
                  <td class="text-center">
                    <v-chip size="small" variant="outlined">
                      {{ item.total_reports }}
                    </v-chip>
                  </td>
                  <!-- Period -->
                  <td class="text-center">
                    <div class="text-caption">{{ item.period_start }} to {{ item.period_end }}</div>
                    <div class="text-caption text-medium-emphasis">{{ item.days_covered }} days</div>
                  </td>
                  <!-- Actions -->
                  <td class="text-center">
                    <v-btn
                      v-if="!isStateRankingAggregated && 'domain_id' in item"
                      icon
                      size="small"
                      variant="text"
                      color="primary"
                      @click="viewDomainStateDashboard(item.domain_id, selectedStateId!)"
                      title="View Domain State Dashboard"
                    >
                      <v-icon>mdi-eye</v-icon>
                    </v-btn>
                    <span v-else class="text-medium-emphasis text-caption">-</span>
                  </td>
                </tr>
              </tbody>
            </v-table>
          </UiParentCard>
        </v-col>
      </v-row>

      <!-- No Data -->
      <v-row v-else-if="selectedStateId && formattedStateRanking.length === 0">
        <v-col cols="12">
          <UiParentCard>
            <div class="text-center py-12">
              <v-icon size="64" color="grey">mdi-database-off</v-icon>
              <h3 class="text-h6 mt-4 mb-2">No Data Available</h3>
              <p class="text-medium-emphasis">
                No provider rankings found for {{ getStateNameById(selectedStateId) }} with the selected filters.
              </p>
            </div>
          </UiParentCard>
        </v-col>
      </v-row>
    </div>

    <!-- TAB: Comparison -->
    <div v-if="currentTab === 'comparison'">
      <!-- Selection Panel -->
      <v-row class="mb-6">
        <v-col cols="12">
          <UiChildCard title="Select Domains to Compare">
            <v-form @submit.prevent="compare">
              <v-row>
                <v-col cols="12" md="6">
                  <v-select
                    v-model="selectedDomainIds"
                    :items="domainOptions"
                    label="Select Domains (minimum 2)"
                    variant="outlined"
                    multiple
                    chips
                    closable-chips
                    hint="The first domain will be used as the baseline"
                    persistent-hint
                  />
                </v-col>
                
                <v-col cols="12" md="3">
                  <v-text-field
                    v-model="dateFrom"
                    label="From Date (Optional)"
                    type="date"
                    variant="outlined"
                    clearable
                  />
                </v-col>
                
                <v-col cols="12" md="3">
                  <v-text-field
                    v-model="dateTo"
                    label="To Date (Optional)"
                    type="date"
                    variant="outlined"
                    clearable
                  />
                </v-col>
              </v-row>
              
              <v-row>
                <v-col cols="12">
                  <div class="d-flex gap-2">
                    <v-btn
                      type="submit"
                      color="primary"
                      prepend-icon="mdi-compare"
                      :disabled="selectedDomainIds.length < 2"
                      :loading="comparisonLoading"
                    >
                      Compare Domains
                    </v-btn>
                    
                    <v-btn
                      variant="outlined"
                      @click="clearComparison"
                      prepend-icon="mdi-refresh"
                    >
                      Clear
                    </v-btn>
                  </div>
                </v-col>
              </v-row>
            </v-form>
          </UiChildCard>
        </v-col>
      </v-row>

      <!-- Comparison Loading -->
      <v-row v-if="comparisonLoading">
        <v-col cols="12">
          <UiParentCard>
            <div class="d-flex justify-center align-center py-8">
              <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
            </div>
          </UiParentCard>
        </v-col>
      </v-row>

      <!-- Comparison Error -->
      <v-row v-else-if="comparisonError">
        <v-col cols="12">
          <UiParentCard>
            <v-alert type="error" variant="tonal" class="mb-0">
              {{ comparisonError }}
            </v-alert>
          </UiParentCard>
        </v-col>
      </v-row>

      <!-- Comparison Results -->
      <div v-else-if="comparisonData && comparisonData.domains">
        <!-- Comparison Cards -->
        <v-row>
          <v-col 
            v-for="(item, index) in comparisonData.domains" 
            :key="item.domain.id"
            cols="12"
            :md="comparisonData.domains.length === 2 ? 6 : comparisonData.domains.length === 3 ? 4 : 3"
          >
            <v-card 
              elevation="4" 
              :class="{ 'border-primary': index === 0 }"
              class="h-100"
            >
              <v-card-title class="d-flex align-center justify-space-between">
                <div>
                  {{ item.domain.name }}
                  <v-chip 
                    v-if="index === 0" 
                    color="primary" 
                    size="x-small" 
                    class="ml-2"
                  >
                    Baseline
                  </v-chip>
                </div>
              </v-card-title>
              
              <v-card-text>
                <!-- Métricas -->
                <v-list density="compact">
                  <!-- Total Requests -->
                  <v-list-item>
                    <template v-slot:prepend>
                      <v-icon color="primary">mdi-chart-line</v-icon>
                    </template>
                    <v-list-item-title>Total Requests</v-list-item-title>
                    <template v-slot:append>
                      <div class="d-flex align-center gap-2">
                        <span class="font-weight-bold">{{ formatNumber(item.metrics.total_requests) }}</span>
                        <v-chip 
                          v-if="item.comparison"
                          :color="getDiffColor(item.comparison.requests_diff)"
                          size="x-small"
                          variant="tonal"
                        >
                          <v-icon size="x-small">{{ getDiffIcon(item.comparison.requests_diff) }}</v-icon>
                          {{ item.comparison.requests_diff_label }}
                        </v-chip>
                      </div>
                    </template>
                  </v-list-item>
                  
                  <v-divider class="my-2"></v-divider>
                  
                  <!-- Success Rate -->
                  <v-list-item>
                    <template v-slot:prepend>
                      <v-icon color="success">mdi-check-circle</v-icon>
                    </template>
                    <v-list-item-title>Success Rate</v-list-item-title>
                    <template v-slot:append>
                      <div class="d-flex align-center gap-2">
                        <span class="font-weight-bold">{{ item.metrics.success_rate.toFixed(1) }}%</span>
                        <v-chip 
                          v-if="item.comparison"
                          :color="getDiffColor(item.comparison.success_diff)"
                          size="x-small"
                          variant="tonal"
                        >
                          <v-icon size="x-small">{{ getDiffIcon(item.comparison.success_diff) }}</v-icon>
                          {{ item.comparison.success_diff_label }}
                        </v-chip>
                      </div>
                    </template>
                  </v-list-item>
                  
                  <v-divider class="my-2"></v-divider>
                  
                  <!-- Average Speed -->
                  <v-list-item>
                    <template v-slot:prepend>
                      <v-icon color="info">mdi-speedometer</v-icon>
                    </template>
                    <v-list-item-title>Average Speed</v-list-item-title>
                    <template v-slot:append>
                      <div class="d-flex align-center gap-2">
                        <span class="font-weight-bold">{{ item.metrics.avg_speed.toFixed(1) }} Mbps</span>
                        <v-chip 
                          v-if="item.comparison"
                          :color="getDiffColor(item.comparison.speed_diff)"
                          size="x-small"
                          variant="tonal"
                        >
                          <v-icon size="x-small">{{ getDiffIcon(item.comparison.speed_diff) }}</v-icon>
                          {{ item.comparison.speed_diff_label }}
                        </v-chip>
                      </div>
                    </template>
                  </v-list-item>
                  
                  <v-divider class="my-2" v-if="item.metrics.unique_providers"></v-divider>
                  
                  <!-- Unique Providers -->
                  <v-list-item v-if="item.metrics.unique_providers">
                    <template v-slot:prepend>
                      <v-icon color="warning">mdi-domain</v-icon>
                    </template>
                    <v-list-item-title>Unique Providers</v-list-item-title>
                    <template v-slot:append>
                      <span class="font-weight-bold">{{ item.metrics.unique_providers }}</span>
                    </template>
                  </v-list-item>
                  
                  <v-divider class="my-2" v-if="item.metrics.unique_states"></v-divider>
                  
                  <!-- Unique States -->
                  <v-list-item v-if="item.metrics.unique_states">
                    <template v-slot:prepend>
                      <v-icon color="secondary">mdi-map-marker</v-icon>
                    </template>
                    <v-list-item-title>Unique States</v-list-item-title>
                    <template v-slot:append>
                      <span class="font-weight-bold">{{ item.metrics.unique_states }}</span>
                    </template>
                  </v-list-item>
                </v-list>
              </v-card-text>
              
              <v-card-actions>
                <v-btn
                  variant="text"
                  color="primary"
                  @click="viewDomainDashboard(item.domain.id)"
                  prepend-icon="mdi-chart-box"
                  block
                >
                  View Dashboard
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>

        <!-- Provider Data Section -->
        <v-row v-if="comparisonData.provider_data">
          <v-col cols="12">
            <v-card elevation="4">
              <v-card-title class="d-flex align-center">
                <v-icon start color="primary">mdi-account-network</v-icon>
                Provider Overview
              </v-card-title>

              <v-card-text>
                <!-- Stats Summary -->
                <v-row class="mb-4">
                  <v-col cols="12" md="6">
                    <v-card variant="tonal" color="primary">
                      <v-card-text class="text-center">
                        <div class="text-h4 font-weight-bold">
                          {{ comparisonData.provider_data.unique_providers_count }}
                        </div>
                        <div class="text-caption">Total Unique Providers</div>
                      </v-card-text>
                    </v-card>
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-card variant="tonal" color="primary">
                      <v-card-text class="text-center">
                        <div class="text-h4 font-weight-bold">
                          {{ comparisonData.provider_data.common_providers.length }}
                        </div>
                        <div class="text-caption">Common Providers (in all domains)</div>
                      </v-card-text>
                    </v-card>
                  </v-col>
                </v-row>

                <!-- All Providers (Aggregated Data) -->
                <div v-if="comparisonData.provider_data.common_providers.length > 0">
                  <h3 class="text-h6 mb-3">
                    <v-icon start size="small">mdi-chart-bar</v-icon>
                    All Providers in Selected Domains
                  </h3>
                  <v-alert color="primary" variant="tonal" density="compact" class="mb-3">
                    Aggregated data for all providers across {{ comparisonData.total_compared }} selected domains
                  </v-alert>
                  <v-table density="compact">
                    <thead>
                      <tr>
                        <th class="text-left">Rank</th>
                        <th class="text-left">Provider</th>
                        <th class="text-left">Technology</th>
                        <th class="text-right">Total Requests</th>
                        <th class="text-right">Avg Speed</th>
                        <th class="text-center">Appearances</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr 
                        v-for="(provider, index) in comparisonData.provider_data.common_providers" 
                        :key="provider.provider_id"
                      >
                        <td class="font-weight-bold">#{{ index + 1 }}</td>
                        <td class="font-weight-medium">{{ provider.provider_name }}</td>
                        <td>
                          <v-chip
                            size="small"
                            variant="tonal"
                            :color="getTechColor(provider.technology)"
                          >
                            {{ provider.technology }}
                          </v-chip>
                        </td>
                        <td class="text-right font-weight-medium">
                          {{ provider.total_requests.toLocaleString() }}
                        </td>
                        <td class="text-right">{{ provider.avg_speed.toFixed(0) }} ms</td>
                        <td class="text-center">
                          <v-chip 
                            size="small" 
                            variant="tonal" 
                            :color="provider.appearances >= comparisonData.total_compared * 20 ? 'success' : 'info'"
                          >
                            {{ provider.appearances }} reports
                          </v-chip>
                        </td>
                      </tr>
                    </tbody>
                  </v-table>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </div>

      <!-- Empty State -->
      <v-row v-else-if="!comparisonLoading && !comparisonError">
        <v-col cols="12">
          <UiParentCard>
            <div class="text-center py-12">
              <v-icon size="80" color="grey">mdi-compare</v-icon>
              <h3 class="text-h5 mt-4 mb-2">Select domains to compare</h3>
              <p class="text-medium-emphasis">
                Choose at least 2 domains from the selector above to see a detailed comparison
              </p>
            </div>
          </UiParentCard>
        </v-col>
      </v-row>
    </div>
  </div>
</template>

<style scoped>
.border-primary {
  border: 2px solid rgb(var(--v-theme-primary)) !important;
}
</style>
