<template>
  <div class="provider-rankings">
    <!-- Filters Row 1 -->
    <v-row class="mb-4">
      <v-col cols="12" md="2">
        <v-select
          v-model="localFilters.provider_id"
          :items="providerOptions"
          label="Provider"
          clearable
          variant="outlined"
          density="compact"
          @update:model-value="onFilterChange"
        >
          <template #prepend-inner>
            <v-icon size="small">mdi-account-network</v-icon>
          </template>
        </v-select>
      </v-col>

      <v-col cols="12" md="2">
        <v-select
          v-model="localFilters.technology"
          :items="technologyOptions"
          label="Technology"
          clearable
          variant="outlined"
          density="compact"
          @update:model-value="onFilterChange"
        >
          <template #prepend-inner>
            <v-icon size="small">mdi-network</v-icon>
          </template>
        </v-select>
      </v-col>

      <v-col cols="12" md="2">
        <v-select
          v-model="localFilters.period"
          :items="periodOptions"
          label="Period"
          clearable
          variant="outlined"
          density="compact"
          @update:model-value="onFilterChange"
        >
          <template #prepend-inner>
            <v-icon size="small">mdi-calendar-range</v-icon>
          </template>
        </v-select>
      </v-col>

      <v-col cols="12" md="2">
        <v-select
          v-model="localSortBy"
          :items="sortOptions"
          label="Sort By"
          variant="outlined"
          density="compact"
          @update:model-value="onSortChange"
        >
          <template #prepend-inner>
            <v-icon size="small">mdi-sort</v-icon>
          </template>
        </v-select>
      </v-col>

      <v-col cols="12" md="2">
        <v-card variant="outlined" class="pa-2">
          <div class="d-flex align-center ga-2">
            <v-icon size="small" color="primary">mdi-group</v-icon>
            <v-switch
              v-model="localFilters.aggregate_by_provider"
              label="Aggregate by Provider"
              color="primary"
              density="compact"
              hide-details
              @update:model-value="onFilterChange"
            />
          </div>
          <v-tooltip location="top">
            <template v-slot:activator="{ props }">
              <v-icon 
                v-bind="props" 
                size="x-small" 
                color="grey" 
                class="ml-1"
              >
                mdi-information-outline
              </v-icon>
            </template>
            <span>When enabled, aggregates all technologies of the same provider for each domain</span>
          </v-tooltip>
        </v-card>
      </v-col>

      <v-col cols="12" md="2">
        <v-btn
          block
          variant="outlined"
          color="grey"
          @click="onClearFilters"
        >
          <v-icon start>mdi-filter-off</v-icon>
          Clear Filters
        </v-btn>
      </v-col>
    </v-row>

    <!-- Filters Row 2: Date Range -->
    <v-row class="mb-4">
      <v-col cols="12">
        <v-card variant="outlined" class="pa-3">
          <div class="text-caption text-medium-emphasis mb-2">
            <v-icon size="small" class="mr-1">mdi-calendar-range</v-icon>
            Custom Date Range (Optional)
          </div>
          <v-row>
            <v-col cols="12" sm="6" md="4">
              <v-text-field
                v-model="localFilters.date_from"
                label="Data de Início"
                type="date"
                variant="outlined"
                density="compact"
                clearable
                prepend-inner-icon="mdi-calendar-start"
                @update:model-value="onDateChange"
              />
            </v-col>

            <v-col cols="12" sm="6" md="4">
              <v-text-field
                v-model="localFilters.date_to"
                label="Data de Fim"
                type="date"
                variant="outlined"
                density="compact"
                clearable
                prepend-inner-icon="mdi-calendar-end"
                @update:model-value="onDateChange"
              />
            </v-col>
            <v-col cols="12" md="4" class="d-flex align-center">
              <v-alert
                v-if="localFilters.date_from || localFilters.date_to"
                type="info"
                variant="tonal"
                density="compact"
                class="mb-0"
              >
                <div class="text-caption">
                  <v-icon size="small" class="mr-1">mdi-information</v-icon>
                  <span v-if="localFilters.date_from && localFilters.date_to">
                    Período: {{ formatDate(localFilters.date_from) }} até {{ formatDate(localFilters.date_to) }}
                  </span>
                  <span v-else-if="localFilters.date_from">
                    A partir de: {{ formatDate(localFilters.date_from) }}
                  </span>
                  <span v-else-if="localFilters.date_to">
                    Até: {{ formatDate(localFilters.date_to) }}
                  </span>
                </div>
              </v-alert>
            </v-col>
          </v-row>
        </v-card>
      </v-col>
    </v-row>

    <!-- Global Stats Badge (when provider is selected) -->
    <v-row v-if="globalStats" class="mb-4">
      <v-col cols="12">
        <v-alert
          color="primary"
          variant="tonal"
          border="start"
          prominent
        >
          <v-alert-title class="text-h6 mb-2">
            <v-icon start size="small">mdi-chart-line</v-icon>
            {{ getSelectedProviderName() }} Global Statistics
          </v-alert-title>
          <div class="d-flex flex-wrap ga-4">
            <div>
              <strong>Provider Requests:</strong> 
              {{ globalStats.provider_total_requests.toLocaleString() }}
            </div>
            <div>
              <strong>Global Requests:</strong> 
              {{ globalStats.global_total_requests.toLocaleString() }}
            </div>
            <div>
              <strong>Percentage of Global:</strong> 
              <v-chip 
                color="primary"
                variant="tonal" 
                size="small"
                class="ml-1"
              >
                {{ globalStats.percentage_of_global.toFixed(2) }}%
              </v-chip>
            </div>
          </div>
        </v-alert>
      </v-col>
    </v-row>

    <!-- Aggregated Stats Header -->
    <v-row v-if="aggregatedStats" class="mb-4">
      <v-col cols="12" md="3">
        <v-card variant="tonal" color="primary">
          <v-card-text class="text-center">
            <div class="text-h4 font-weight-bold">
              {{ aggregatedStats.total_requests.toLocaleString() }}
            </div>
            <div class="text-caption text-medium-emphasis">Total Requests</div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="3">
        <v-card variant="tonal" color="primary">
          <v-card-text class="text-center">
            <div class="text-h4 font-weight-bold">
              {{ aggregatedStats.avg_speed.toFixed(0) }} ms
            </div>
            <div class="text-caption text-medium-emphasis">Avg Speed</div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="3">
        <v-card variant="tonal" color="primary">
          <v-card-text class="text-center">
            <div class="text-h4 font-weight-bold">
              {{ aggregatedStats.unique_domains }}
            </div>
            <div class="text-caption text-medium-emphasis">Unique Domains</div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="3">
        <v-card variant="tonal" color="primary">
          <v-card-text class="text-center">
            <div class="text-h4 font-weight-bold">
              {{ aggregatedStats.unique_providers }}
            </div>
            <div class="text-caption text-medium-emphasis">Unique Providers</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Loading -->
    <v-alert v-if="loading" type="info" variant="tonal">
      <v-progress-circular indeterminate size="20" class="mr-2"></v-progress-circular>
      Loading rankings...
    </v-alert>

    <!-- Error -->
    <v-alert v-else-if="error" type="error" variant="tonal">
      {{ error }}
    </v-alert>

    <!-- Table -->
    <v-card v-else>
      <v-card-title class="d-flex align-center justify-space-between">
        <span>🏆 Provider Rankings</span>
        <v-chip color="primary" variant="tonal">
          {{ totalEntries }} entries
        </v-chip>
      </v-card-title>

      <v-table fixed-header height="600px">
        <thead>
          <tr>
            <th class="text-left">Rank</th>
            <th class="text-left">Domain</th>
            <th class="text-left">Provider</th>
            <th class="text-left">Technology</th>
            <th class="text-right">Provider Requests</th>
            <th class="text-right">Domain Total</th>
            <th class="text-center">% of Domain</th>
            <th class="text-right">Avg Speed</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in formattedRankings" :key="`${item.domain_id}-${item.provider_id}`">
            <!-- Rank -->
            <td class="font-weight-bold">
              <span v-if="item.hasMedal" class="mr-2">{{ item.medalEmoji }}</span>
              #{{ item.rank }}
            </td>

            <!-- Domain -->
            <td>
              <div class="font-weight-medium">{{ item.domain_name }}</div>
              <div class="text-caption text-medium-emphasis">{{ item.domain_slug }}</div>
            </td>

            <!-- Provider -->
            <td>{{ item.provider_name }}</td>

            <!-- Technology -->
            <td>
              <div v-if="item.technology" class="d-flex flex-wrap ga-1">
                <template v-if="hasMultipleTechnologies(item.technology)">
                  <v-chip
                    v-for="(tech, index) in getTechnologies(item.technology)"
                    :key="index"
                    :color="getTechColor(tech)"
                    variant="tonal"
                    size="x-small"
                    class="mr-1 mb-1"
                  >
                    {{ tech.trim() }}
                  </v-chip>
                  <v-tooltip location="top">
                    <template v-slot:activator="{ props }">
                      <v-icon 
                        v-bind="props" 
                        size="x-small" 
                        color="primary" 
                        class="ml-1"
                      >
                        mdi-information
                      </v-icon>
                    </template>
                    <span>Multiple technologies aggregated</span>
                  </v-tooltip>
                </template>
                <v-chip
                  v-else
                  :color="item.techColor"
                  variant="tonal"
                  size="small"
                >
                  {{ item.technology }}
                </v-chip>
              </div>
              <span v-else class="text-medium-emphasis">Unknown</span>
            </td>

            <!-- Provider Requests -->
            <td class="text-right font-weight-medium">
              {{ item.requestsFormatted }}
            </td>

            <!-- Domain Total -->
            <td class="text-right text-medium-emphasis">
              {{ item.domainTotalFormatted }}
            </td>

            <!-- Percentage of Domain -->
            <td class="text-center">
              <v-chip
                :color="item.percentageColor"
                variant="tonal"
                size="small"
              >
                {{ item.percentageFormatted }}%
              </v-chip>
            </td>

            <!-- Avg Speed -->
            <td class="text-right">{{ item.avgSpeedFormatted }} ms</td>
          </tr>
        </tbody>
      </v-table>

      <!-- Pagination Controls -->
      <v-card-actions v-if="pagination" class="justify-space-between pa-4">
        <div class="d-flex align-center">
          <span class="text-caption text-medium-emphasis">
            Showing {{ pagination.from }} to {{ pagination.to }} of {{ pagination.total }} entries
          </span>
        </div>

        <div class="d-flex align-center ga-2">
          <!-- Per Page Selector -->
          <v-select
            :model-value="localFilters.per_page"
            :items="perPageOptions"
            @update:model-value="onPerPageChange"
            density="compact"
            variant="outlined"
            hide-details
            style="width: 100px"
          />

          <!-- Pagination Buttons -->
          <v-btn
            icon="mdi-chevron-left"
            size="small"
            variant="text"
            :disabled="pagination.current_page === 1"
            @click="onPreviousPage"
          />

          <v-chip variant="tonal" color="primary">
            {{ pagination.current_page }} / {{ pagination.last_page }}
          </v-chip>

          <v-btn
            icon="mdi-chevron-right"
            size="small"
            variant="text"
            :disabled="pagination.current_page === pagination.last_page"
            @click="onNextPage"
          />
        </div>
      </v-card-actions>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import { useRoute } from 'vue-router';
import type { ProviderRankingFilters } from '~/types/api';

const route = useRoute();

const {
  formattedRankings,
  totalEntries,
  pagination,
  availableProviders,
  aggregatedStats,
  globalStats,
  filters,
  loading,
  error,
  localSortBy,
  loadProviderRankings,
  updateFilters,
  clearFilters,
  goToPage,
  changePerPage,
  changeLocalSort
} = useProviderRankings();

// Local filters for UI - initialize from URL query params
const localFilters = ref<ProviderRankingFilters>({ 
  ...filters.value,
  date_from: (route.query.date_from as string) || null,
  date_to: (route.query.date_to as string) || null
});

// Provider options - dynamically populated from availableProviders
const providerOptions = computed(() => {
  if (!availableProviders.value || availableProviders.value.length === 0) {
    return [];
  }
  return availableProviders.value.map(p => ({
    title: `${p.name} (${p.total_requests.toLocaleString()} requests)`,
    value: p.id
  }));
});

const periodOptions = [
  { title: '📅 Today', value: 'today' },
  { title: '📅 Yesterday', value: 'yesterday' },
  { title: '📅 Last Week', value: 'last_week' },
  { title: '📅 Last Month', value: 'last_month' },
  { title: '📅 Last Year', value: 'last_year' },
  { title: '📅 All Time', value: 'all_time' }
];

const technologyOptions = [
  { title: '🔵 Fiber', value: 'Fiber' },
  { title: '🟢 Cable', value: 'Cable' },
  { title: '🟡 DSL', value: 'DSL' },
  { title: '🟣 Mobile', value: 'Mobile' },
  { title: '🔴 Satellite', value: 'Satellite' }
];

const sortOptions = [
  { title: '📊 Provider Requests', value: 'total_requests' },
  { title: '📊 Domain Total', value: 'domain_total' },
  { title: '📈 % of Domain', value: 'percentage' },
  { title: '⚡ Avg Speed', value: 'avg_speed' }
];

const perPageOptions = [
  { title: '15 per page', value: 15 },
  { title: '25 per page', value: 25 },
  { title: '50 per page', value: 50 },
  { title: '100 per page', value: 100 }
];

// Helper to get selected provider name
const getSelectedProviderName = () => {
  if (!localFilters.value.provider_id) return '';
  const provider = availableProviders.value.find(p => p.id === localFilters.value.provider_id);
  return provider ? provider.name : '';
};

// Update URL query parameters
const updateURL = () => {
  const query: Record<string, string> = {};
  
  if (localFilters.value.date_from) {
    query.date_from = localFilters.value.date_from;
  }
  if (localFilters.value.date_to) {
    query.date_to = localFilters.value.date_to;
  }
  
  navigateTo({
    query: Object.keys(query).length > 0 ? query : {}
  }, { replace: true });
};

const onFilterChange = () => {
  // Reset to page 1 when filters change
  localFilters.value.page = 1;
  updateFilters(localFilters.value);
  updateURL();
  loadProviderRankings();
};

const onDateChange = () => {
  // When dates change, clear period to avoid conflicts
  if (localFilters.value.date_from || localFilters.value.date_to) {
    localFilters.value.period = null;
  }
  onFilterChange();
};

const onSortChange = (newSort: string) => {
  changeLocalSort(newSort);
};

const onClearFilters = () => {
  clearFilters();
  localFilters.value = { ...filters.value };
  localFilters.value.aggregate_by_provider = false; // Reset aggregate toggle
  localFilters.value.date_from = null;
  localFilters.value.date_to = null;
  changeLocalSort('total_requests'); // Reset sort to default
  updateURL();
  loadProviderRankings();
};

const onPreviousPage = () => {
  if (pagination.value && pagination.value.current_page > 1) {
    goToPage(pagination.value.current_page - 1);
  }
};

const onNextPage = () => {
  if (pagination.value && pagination.value.current_page < pagination.value.last_page) {
    goToPage(pagination.value.current_page + 1);
  }
};

const onPerPageChange = (newPerPage: number) => {
  localFilters.value.per_page = newPerPage;
  changePerPage(newPerPage);
};

// Helper functions for technology display
const hasMultipleTechnologies = (technology: string | null): boolean => {
  if (!technology) return false;
  return technology.includes(',');
};

const getTechnologies = (technology: string): string[] => {
  if (!technology) return [];
  return technology.split(',').map(t => t.trim()).filter(t => t.length > 0);
};

const getTechColor = (technology: string) => {
  const techMap: Record<string, string> = {
    'Fiber': 'blue',
    'Cable': 'green',
    'DSL': 'orange',
    'Mobile': 'purple',
    'Satellite': 'red',
    'Unknown': 'grey'
  };
  return techMap[technology] || 'grey';
};

// Helper function to format date for display
const formatDate = (dateString: string | null): string => {
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

// Watch for URL query parameter changes
watch(() => route.query, (newQuery) => {
  if (newQuery.date_from !== localFilters.value.date_from || 
      newQuery.date_to !== localFilters.value.date_to) {
    localFilters.value.date_from = (newQuery.date_from as string) || null;
    localFilters.value.date_to = (newQuery.date_to as string) || null;
    updateFilters(localFilters.value);
    loadProviderRankings();
  }
}, { immediate: false });

onMounted(() => {
  // Initialize filters from URL if present
  if (localFilters.value.date_from || localFilters.value.date_to) {
    updateFilters(localFilters.value);
  }
  loadProviderRankings();
});
</script>

<style scoped>
.provider-rankings {
  width: 100%;
}
</style>

