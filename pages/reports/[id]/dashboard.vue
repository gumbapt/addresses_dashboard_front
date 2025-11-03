<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import UiParentCard from '@/components/shared/UiParentCard.vue';

// Define middleware
definePageMeta({
  middleware: ['auth', 'permissions']
});

const route = useRoute();
const reportId = computed(() => parseInt(route.params.id as string));

// Use composables
const { reportData, loading, error, loadDashboardStats, providerChartData, topStatesChartData, speedByStateChartData, technologyChartData, topCards } = useDomainDashboard();

// Report and Domain info
const currentDomain = computed(() => {
  return reportData.value?.domain;
});

const reportDate = computed(() => {
  if (!reportData.value) return '';
  return new Date(reportData.value.report_date).toLocaleDateString('en-US');
});

// Load data
onMounted(async () => {
  await loadDashboardStats(reportId.value);
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

// Back to domain reports list
const goBack = () => {
  if (reportData.value?.domain_id) {
    navigateTo(`/domains/${reportData.value.domain_id}/reports`);
  } else {
    navigateTo('/reports');
  }
};
</script>

<template>
  <div>
    <!-- Header -->
    <v-row class="mb-4">
      <v-col cols="12">
        <div class="d-flex align-center justify-space-between">
          <div>
            <v-btn
              variant="text"
              prepend-icon="mdi-arrow-left"
              @click="goBack"
              class="mb-2"
            >
              Back to Reports
            </v-btn>
            <h1 class="text-h4 font-weight-bold">{{ currentDomain?.name || 'Report Dashboard' }}</h1>
            <p class="text-body-1 text-medium-emphasis">
              Report Date: {{ reportDate }} | Analytics and statistics
            </p>
          </div>
        </div>
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
    <div v-else-if="reportData">
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
</template>
