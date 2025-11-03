<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import UiParentCard from '@/components/shared/UiParentCard.vue';

// Define middleware
definePageMeta({
  middleware: ['auth', 'permissions']
});

const route = useRoute();
const domainId = computed(() => parseInt(route.params.id as string));

// Use composables
const { 
  reportData,
  aggregatedData,
  loading, 
  error, 
  loadDashboardStats,
  loadAggregatedStats,
  providerChartData, 
  topStatesChartData, 
  speedByStateChartData, 
  technologyChartData, 
  topCards
} = useDomainDashboard();
const { formattedReports, loading: reportsLoading, loadReports } = useReports();
const { domains: allDomains, loadDomains } = useDomains();

// States
const selectedReportId = ref<number | string>('all');
const showAllReports = ref(false);

// Domain info
const currentDomain = computed(() => {
  if (!allDomains.value || !Array.isArray(allDomains.value)) return null;
  return allDomains.value.find((d: any) => d.id === domainId.value);
});

// Reports do domínio
const domainReports = computed(() => {
  return formattedReports.value.filter((r: any) => r.domain_id === domainId.value);
});

// Opções do seletor de reports
const reportSelectOptions = computed(() => {
  const options = [
    { id: 'all', reportDate: 'All Reports Combined', statusColor: 'primary', data_version: 'Aggregated' }
  ];
  return [...options, ...domainReports.value];
});

// Report selecionado
const selectedReport = computed(() => {
  if (selectedReportId.value === 'all') {
    return { 
      id: 'all', 
      reportDate: 'All Reports Combined', 
      statusLabel: 'Aggregated'
    };
  }
  return domainReports.value.find((r: any) => r.id === selectedReportId.value);
});

// Info para display
const displayInfo = computed(() => {
  if (selectedReportId.value === 'all' && aggregatedData.value) {
    return `Showing aggregated data from ${domainReports.value.length} report(s)`;
  }
  if (selectedReport.value && selectedReportId.value !== 'all') {
    return `Report Date: ${selectedReport.value.reportDate} | Status: ${selectedReport.value.statusLabel}`;
  }
  return '';
});

// Load data
onMounted(async () => {
  await loadDomains();
  await loadReports({ domain_id: domainId.value, per_page: 100 });
  
  // Auto-load aggregated data
  await loadAggregatedStats(domainId.value);
  selectedReportId.value = 'all';
});

// Watch to load data when report changes
watch(selectedReportId, async (newId) => {
  if (newId === 'all') {
    showAllReports.value = false;
    await loadAggregatedStats(domainId.value);
  } else if (newId) {
    showAllReports.value = false;
    await loadDashboardStats(newId as number);
  }
});

// Chart configurations
const providerChartOptions = computed(() => ({
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
  labels: providerChartData.value.labels,
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
}));

const topStatesChartOptions = computed(() => ({
  chart: {
    type: 'bar',
    fontFamily: 'inherit',
    height: 350,
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
    categories: topStatesChartData.value.categories,
    labels: {
      style: {
        fontSize: '12px'
      }
    }
  },
  yaxis: {
    title: {
      text: 'Number of Requests'
    }
  },
  colors: ['#1976d2'],
  grid: {
    show: true,
    borderColor: '#f0f0f0'
  }
}));

const speedByStateChartOptions = computed(() => ({
  chart: {
    type: 'bar',
    fontFamily: 'inherit',
    height: 350,
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
    categories: speedByStateChartData.value.categories,
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
}));

const technologyChartOptions = computed(() => ({
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
  labels: technologyChartData.value.labels,
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
}));

// Formatar números
const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

const formatPercentage = (num: number): string => {
  return num.toFixed(1) + '%';
};

const formatDecimal = (num: number): string => {
  return num.toFixed(2);
};

// Back to domains list
const goBack = () => {
  navigateTo('/domains');
};

// Toggle to show all reports
const toggleShowAll = () => {
  showAllReports.value = !showAllReports.value;
};
</script>

<template>
  <div>
    <!-- Header com Seletor de Reports -->
    <v-row class="mb-4">
      <v-col cols="12">
        <div class="d-flex align-center justify-space-between flex-wrap gap-4">
          <div class="flex-grow-1">
            <v-btn
              variant="text"
              prepend-icon="mdi-arrow-left"
              @click="goBack"
              class="mb-2"
            >
              Back to Domains
            </v-btn>
            <h1 class="text-h4 font-weight-bold">{{ currentDomain?.name || 'Domain Dashboard' }}</h1>
            <p class="text-body-1 text-medium-emphasis" v-if="displayInfo">
              {{ displayInfo }}
            </p>
          </div>
          
          <!-- Seletor de Report -->
          <div class="d-flex gap-2 align-center" style="min-width: 300px;">
            <v-select
              v-model="selectedReportId"
              :items="reportSelectOptions"
              item-title="reportDate"
              item-value="id"
              label="Select Report"
              variant="outlined"
              density="compact"
              hide-details
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
            
            <v-btn
              icon
              variant="outlined"
              @click="toggleShowAll"
              title="View all reports"
            >
              <v-icon>{{ showAllReports ? 'mdi-view-dashboard' : 'mdi-view-list' }}</v-icon>
            </v-btn>
          </div>
        </div>
      </v-col>
    </v-row>

    <!-- View: All Reports -->
    <div v-if="showAllReports">
      <v-row>
        <v-col cols="12">
          <UiParentCard title="All Reports">
            <v-row v-if="domainReports.length === 0">
              <v-col cols="12">
                <v-alert type="info" variant="tonal">
                  No reports available for this domain yet.
                </v-alert>
              </v-col>
            </v-row>
            
            <v-row v-else>
              <v-col
                v-for="report in domainReports"
                :key="report.id"
                cols="12"
                sm="6"
                md="4"
                lg="3"
              >
                <v-card
                  elevation="2"
                  hover
                  class="h-100"
                  :class="{ 'border-primary': selectedReportId === report.id }"
                  @click="selectedReportId = report.id"
                  style="cursor: pointer;"
                >
                  <v-card-text>
                    <div class="d-flex align-center justify-space-between mb-3">
                      <v-chip
                        :color="report.statusColor"
                        variant="tonal"
                        size="small"
                      >
                        {{ report.statusLabel }}
                      </v-chip>
                    </div>
                    
                    <div class="mb-2">
                      <div class="text-overline text-medium-emphasis">Date</div>
                      <div class="text-h6">{{ report.reportDate }}</div>
                    </div>
                    
                    <div class="mb-2">
                      <div class="text-overline text-medium-emphasis">Report ID</div>
                      <div class="text-body-2">#{{ report.id }}</div>
                    </div>
                    
                    <div>
                      <div class="text-overline text-medium-emphasis">Version</div>
                      <v-chip variant="outlined" size="x-small">
                        {{ report.data_version }}
                      </v-chip>
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </UiParentCard>
        </v-col>
      </v-row>
    </div>

    <!-- View: Dashboard do Report Selecionado -->
    <div v-else>
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

      <!-- Dashboard Content -->
      <div v-else-if="reportData || aggregatedData">
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
                  :options="providerChartOptions"
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
                  :options="topStatesChartOptions"
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

        <!-- Charts Row 2 -->
        <v-row>
          <!-- Average Speed by State -->
          <v-col cols="12" md="6">
            <UiParentCard>
              <div v-if="speedByStateChartData.data.length > 0">
                <apexchart
                  type="bar"
                  height="350"
                  :options="speedByStateChartOptions"
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
                  :options="technologyChartOptions"
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
      </div>
    </div>
  </div>
</template>

<style scoped>
.border-primary {
  border: 2px solid rgb(var(--v-theme-primary)) !important;
}
</style>
