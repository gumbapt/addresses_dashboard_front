<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import UiChildCard from '@/components/shared/UiChildCard.vue';

// Define middleware
definePageMeta({
  middleware: ['auth', 'permissions']
});

// Use composables
const { rankingData, loading, error, currentSortBy, formattedRanking, topThree, globalStats, loadRanking } = useGlobalRanking();
const { comparisonData, loading: comparisonLoading, error: comparisonError, loadComparison, formatNumber: formatNumberComp, getDiffColor, getDiffIcon } = useDomainComparison();
const { domains: allDomains, loadDomains } = useDomains();

// States
const currentTab = ref('ranking');
const selectedDomainIds = ref<number[]>([]);
const dateFrom = ref<string>('');
const dateTo = ref<string>('');

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
});

// Function to change sorting
const changeSortBy = (sortBy: string) => {
  loadRanking(sortBy);
};

// Function to navigate to domain dashboard
const viewDomainDashboard = (domainId: number) => {
  navigateTo(`/domains/${domainId}/dashboard`);
};

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
</script>

<template>
  <div>
    <!-- Header -->
    <v-row class="mb-4">
      <v-col cols="12">
        <h1 class="text-h4 font-weight-bold">Global Dashboard</h1>
        <p class="text-body-1 text-medium-emphasis">
          Comprehensive platform analytics and domain comparison
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

        <!-- Comparison Summary Table -->
        <v-row class="mt-4" v-if="comparisonData.domains.length > 1">
          <v-col cols="12">
            <UiChildCard title="Comparison Summary">
              <v-alert type="info" variant="tonal" class="mb-4">
                <div class="text-subtitle-2">
                  Baseline: {{ comparisonData.domains[0].domain.name }}
                </div>
                <div class="text-caption">
                  All percentages show difference compared to this domain
                </div>
              </v-alert>
              
              <v-table>
                <thead>
                  <tr>
                    <th class="text-left">Domain</th>
                    <th class="text-right">Total Requests</th>
                    <th class="text-right">Success Rate</th>
                    <th class="text-right">Avg Speed</th>
                    <th class="text-center">Difference</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in comparisonData.domains" :key="item.domain.id">
                    <td>
                      <div class="font-weight-medium">{{ item.domain.name }}</div>
                      <div class="text-caption text-medium-emphasis">{{ item.domain.slug }}</div>
                    </td>
                    <td class="text-right">{{ formatNumber(item.metrics.total_requests) }}</td>
                    <td class="text-right">{{ item.metrics.success_rate.toFixed(1) }}%</td>
                    <td class="text-right">{{ item.metrics.avg_speed.toFixed(1) }} Mbps</td>
                    <td class="text-center">
                      <div v-if="item.comparison" class="d-flex justify-center gap-1 flex-wrap">
                        <v-chip
                          :color="getDiffColor(item.comparison.requests_diff)"
                          size="small"
                          variant="tonal"
                        >
                          <v-icon size="small">{{ getDiffIcon(item.comparison.requests_diff) }}</v-icon>
                          {{ item.comparison.requests_diff_label }}
                        </v-chip>
                        <v-chip
                          :color="getDiffColor(item.comparison.success_diff)"
                          size="small"
                          variant="tonal"
                        >
                          <v-icon size="small">{{ getDiffIcon(item.comparison.success_diff) }}</v-icon>
                          {{ item.comparison.success_diff_label }}
                        </v-chip>
                        <v-chip
                          :color="getDiffColor(item.comparison.speed_diff)"
                          size="small"
                          variant="tonal"
                        >
                          <v-icon size="small">{{ getDiffIcon(item.comparison.speed_diff) }}</v-icon>
                          {{ item.comparison.speed_diff_label }}
                        </v-chip>
                      </div>
                      <v-chip v-else size="small" variant="outlined">
                        Baseline
                      </v-chip>
                    </td>
                  </tr>
                </tbody>
              </v-table>
            </UiChildCard>
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
