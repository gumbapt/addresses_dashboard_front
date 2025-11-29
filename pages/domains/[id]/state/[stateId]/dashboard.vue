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
const stateId = computed(() => parseInt(route.params.stateId as string));

// Use composables
const { 
  stats,
  loading, 
  error, 
  fetchStats,
  providerChartData, 
  topCitiesChartData, 
  technologyChartData,
  dailyTrendsChartData,
  topCards
} = useDomainStateStats();
const { domains: allDomains, loadDomains } = useDomains();
const { states: allStates, fetchStates } = useStates();

// States
const selectedPeriod = ref<'today' | 'yesterday' | 'last_week' | 'last_month' | 'last_year' | 'all_time' | null>('last_month');
const dateFrom = ref<string>('');
const dateTo = ref<string>('');
const sortBy = ref<'total_count' | 'total_requests' | 'success_rate' | 'avg_speed'>('total_count');

// Domain info
const currentDomain = computed(() => {
  if (!allDomains.value || !Array.isArray(allDomains.value)) return null;
  return allDomains.value.find((d: any) => d.id === domainId.value);
});

// State info
const currentState = computed(() => {
  if (!allStates.value || !Array.isArray(allStates.value)) return null;
  return allStates.value.find((s: any) => s.id === stateId.value);
});

// Load data
onMounted(async () => {
  await loadDomains();
  await fetchStates();
  await loadStats();
});

// Watch for filter changes
watch([selectedPeriod, dateFrom, dateTo, sortBy], () => {
  loadStats();
});

const loadStats = async () => {
  const filters: any = {
    state_id: stateId.value,
    sort_by: sortBy.value
  };
  
  // Se período customizado, usar apenas date_from e date_to (sem period)
  if (dateFrom.value && dateTo.value) {
    filters.date_from = dateFrom.value;
    filters.date_to = dateTo.value;
    // Não incluir 'period' quando usar datas customizadas
  } else if (selectedPeriod.value) {
    filters.period = selectedPeriod.value;
  }
  
  await fetchStats(domainId.value, filters);
};

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

const topCitiesChartOptions = computed(() => ({
  chart: {
    type: 'bar',
    fontFamily: 'inherit',
    height: Math.max(400, (topCitiesChartData.value.categories.length || 5) * 50),
    toolbar: { show: false }
  },
  title: {
    text: 'Distribution of Requests by City',
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
      barHeight: '70%',
      distributed: topCitiesChartData.value.colors.length > 0
    }
  },
  dataLabels: {
    enabled: true,
    formatter: function(val: number, opts: any) {
      const index = opts.dataPointIndex;
      const percentage = topCitiesChartData.value.percentages[index];
      if (percentage !== undefined) {
        return `${val.toLocaleString()} (${percentage.toFixed(1)}%)`;
      }
      return val.toLocaleString();
    },
    style: {
      fontSize: '11px',
      fontWeight: 600,
      colors: ['#fff']
    }
  },
  xaxis: {
    title: {
      text: 'Number of Requests'
    },
    labels: {
      formatter: function(val: number) {
        return val.toLocaleString();
      }
    }
  },
  yaxis: {
    categories: topCitiesChartData.value.categories,
    labels: {
      style: {
        fontSize: '12px'
      },
      maxWidth: 150
    }
  },
  colors: topCitiesChartData.value.colors.length > 0 
    ? topCitiesChartData.value.colors 
    : ['#3B82F6', '#2563EB', '#1D4ED8', '#1E40AF', '#1E3A8A', '#172554'],
  grid: {
    show: true,
    borderColor: '#f0f0f0',
    xaxis: {
      lines: {
        show: true
      }
    },
    yaxis: {
      lines: {
        show: false
      }
    }
  },
  tooltip: {
    y: {
      formatter: function(val: number, opts: any) {
        const index = opts.dataPointIndex;
        const percentage = topCitiesChartData.value.percentages[index];
        if (percentage !== undefined) {
          return `${val.toLocaleString()} requisições (${percentage.toFixed(1)}%)`;
        }
        return `${val.toLocaleString()} requisições`;
      }
    }
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

const dailyTrendsChartOptions = computed(() => ({
  chart: {
    type: 'line',
    fontFamily: 'inherit',
    height: 350,
    toolbar: { show: false }
  },
  title: {
    text: 'Daily Trends',
    align: 'left',
    style: {
      fontSize: '18px',
      fontWeight: 600
    }
  },
  dataLabels: {
    enabled: false
  },
  xaxis: {
    categories: dailyTrendsChartData.value.categories,
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
  colors: ['#4caf50'],
  grid: {
    show: true,
    borderColor: '#f0f0f0'
  },
  stroke: {
    curve: 'smooth',
    width: 3
  }
}));

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

const formatPercentage = (num: number): string => {
  return num.toFixed(1) + '%';
};

const formatDecimal = (num: number): string => {
  return num.toFixed(2);
};

// Back to domains list
const goBack = () => {
  navigateTo('/dashboard?tab=state-ranking');
};
</script>

<template>
  <div>
    <!-- Header -->
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
              Back to State Ranking
            </v-btn>
            <h1 class="text-h4 font-weight-bold">
              {{ currentDomain?.name || 'Domain' }} - {{ currentState?.name || 'State' }} ({{ currentState?.code }})
            </h1>
            <p class="text-body-1 text-medium-emphasis" v-if="stats">
              Period: {{ stats.period.date_from }} to {{ stats.period.date_to }} | 
              {{ stats.period.days_covered }} days | {{ stats.period.total_reports }} reports
            </p>
          </div>
        </div>
      </v-col>
    </v-row>

    <!-- Filters -->
    <v-row class="mb-4">
      <v-col cols="12">
        <UiParentCard title="Filters">
          <v-row>
            <v-col cols="12" md="3">
              <v-select
                v-model="selectedPeriod"
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
                density="compact"
                prepend-inner-icon="mdi-calendar"
                @update:model-value="() => { dateFrom = ''; dateTo = ''; }"
              />
            </v-col>
            <v-col cols="12" md="2">
              <v-text-field
                v-model="dateFrom"
                label="Date From"
                type="date"
                variant="outlined"
                density="compact"
                clearable
                prepend-inner-icon="mdi-calendar-start"
                @update:model-value="() => { if (dateFrom && dateTo) selectedPeriod = null; }"
              />
            </v-col>
            <v-col cols="12" md="2">
              <v-text-field
                v-model="dateTo"
                label="Date To"
                type="date"
                variant="outlined"
                density="compact"
                clearable
                prepend-inner-icon="mdi-calendar-end"
                @update:model-value="() => { if (dateFrom && dateTo) selectedPeriod = null; }"
              />
            </v-col>
            <v-col cols="12" md="3">
              <v-select
                v-model="sortBy"
                :items="[
                  { value: 'total_count', title: 'Total Requests' },
                  { value: 'success_rate', title: 'Success Rate' },
                  { value: 'avg_speed', title: 'Avg Speed' }
                ]"
                label="Sort By"
                variant="outlined"
                density="compact"
                prepend-inner-icon="mdi-sort"
              />
            </v-col>
          </v-row>
        </UiParentCard>
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

    <!-- Dashboard Content -->
    <div v-else-if="stats">
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

      <!-- Cities Chart Row -->
      <v-row class="mb-4" v-if="topCitiesChartData.data.length > 0">
        <v-col cols="12">
          <UiParentCard title="Distribution of Requests by City">
            <apexchart
              type="bar"
              :height="Math.max(400, (topCitiesChartData.categories.length || 5) * 50)"
              :options="topCitiesChartOptions"
              :series="[{ name: 'Requests', data: topCitiesChartData.data }]"
            />
            
            <!-- Cities List Below Chart -->
            <div class="mt-4">
              <v-divider class="mb-4"></v-divider>
              <div class="text-subtitle-2 text-medium-emphasis mb-3">City Rankings</div>
              <v-row>
                <v-col 
                  v-for="(city, index) in topCitiesChartData.raw_data" 
                  :key="city.city_id"
                  cols="12" 
                  sm="6" 
                  md="4"
                  lg="3"
                >
                  <v-card variant="outlined" class="h-100">
                    <v-card-text class="pa-3">
                      <div class="d-flex align-center mb-2">
                        <v-chip 
                          :color="index < 3 ? 'primary' : 'default'"
                          variant="flat"
                          size="small"
                          class="mr-2"
                        >
                          #{{ index + 1 }}
                        </v-chip>
                        <div class="font-weight-medium text-body-2">{{ city.name }}</div>
                      </div>
                      <div class="text-h6 text-primary font-weight-bold">
                        {{ city.total_requests.toLocaleString() }}
                      </div>
                      <div class="text-caption text-medium-emphasis" v-if="'percentage' in city">
                        {{ (city as any).percentage.toFixed(1) }}% of total
                      </div>
                      <div class="text-caption text-medium-emphasis mt-1">
                        {{ 'report_count' in city ? city.report_count : 0 }} report(s)
                      </div>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>
            </div>
          </UiParentCard>
        </v-col>
      </v-row>

      <!-- Charts Row 2: Daily Trends -->
      <v-row class="mb-4" v-if="dailyTrendsChartData.data.length > 0">
        <v-col cols="12">
          <UiParentCard>
            <apexchart
              type="line"
              height="350"
              :options="dailyTrendsChartOptions"
              :series="[{ name: 'Requests', data: dailyTrendsChartData.data }]"
            />
          </UiParentCard>
        </v-col>
      </v-row>

      <!-- Provider Distribution Table -->
      <v-row class="mb-4" v-if="stats.provider_distribution.length > 0">
        <v-col cols="12">
          <UiParentCard title="Provider Distribution">
            <v-table>
              <thead>
                <tr>
                  <th class="text-left">Provider</th>
                  <th class="text-right">Total Requests</th>
                  <th class="text-right">Percentage</th>
                  <th class="text-right">Success Rate</th>
                  <th class="text-right">Avg Speed (Mbps)</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="provider in stats.provider_distribution" :key="provider.provider_id">
                  <td>
                    <div class="font-weight-medium">{{ provider.name }}</div>
                    <div class="text-caption text-medium-emphasis">{{ provider.slug }}</div>
                  </td>
                  <td class="text-right font-weight-medium">
                    {{ provider.total_count.toLocaleString() }}
                  </td>
                  <td class="text-right">
                    <v-chip color="primary" variant="tonal" size="small">
                      {{ provider.percentage.toFixed(1) }}%
                    </v-chip>
                  </td>
                  <td class="text-right">
                    <v-chip
                      :color="provider.avg_success_rate >= 90 ? 'success' : provider.avg_success_rate >= 70 ? 'warning' : 'error'"
                      variant="tonal"
                      size="small"
                    >
                      {{ provider.avg_success_rate.toFixed(1) }}%
                    </v-chip>
                  </td>
                  <td class="text-right">{{ provider.avg_speed.toFixed(2) }}</td>
                </tr>
              </tbody>
            </v-table>
          </UiParentCard>
        </v-col>
      </v-row>

      <!-- Top Cities and Zip Codes -->
      <v-row>
        <!-- Top Cities -->
        <v-col cols="12" md="6" v-if="stats.top_cities.length > 0">
          <UiParentCard title="Top Cities">
            <v-table>
              <thead>
                <tr>
                  <th class="text-left">City</th>
                  <th class="text-right">Total Requests</th>
                  <th class="text-right">Reports</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="city in stats.top_cities" :key="city.city_id">
                  <td class="font-weight-medium">{{ city.name }}</td>
                  <td class="text-right">{{ city.total_requests.toLocaleString() }}</td>
                  <td class="text-right">{{ city.report_count }}</td>
                </tr>
              </tbody>
            </v-table>
          </UiParentCard>
        </v-col>

        <!-- Top Zip Codes -->
        <v-col cols="12" md="6" v-if="stats.top_zip_codes.length > 0">
          <UiParentCard title="Top Zip Codes">
            <v-table>
              <thead>
                <tr>
                  <th class="text-left">Zip Code</th>
                  <th class="text-right">Total Requests</th>
                  <th class="text-right">Reports</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="zip in stats.top_zip_codes" :key="zip.zip_code_id">
                  <td class="font-weight-medium">{{ zip.code }}</td>
                  <td class="text-right">{{ zip.total_requests.toLocaleString() }}</td>
                  <td class="text-right">{{ zip.report_count }}</td>
                </tr>
              </tbody>
            </v-table>
          </UiParentCard>
        </v-col>
      </v-row>
    </div>
  </div>
</template>

