<template>
  <div class="provider-rankings">
    <!-- Filters Row 1 -->
    <v-row class="mb-4">
      <v-col cols="12" md="3">
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

      <v-col cols="12" md="3">
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

      <v-col cols="12" md="3">
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

      <v-col cols="12" md="3">
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

    <!-- Period Indicator -->
    <v-row v-if="localFilters.period" class="mb-4">
      <v-col cols="12">
        <v-chip
          color="primary"
          variant="tonal"
          size="large"
        >
          <v-icon start size="small">mdi-calendar-check</v-icon>
          {{ getPeriodLabel(localFilters.period) }}
        </v-chip>
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
            <th class="text-center">Success Rate</th>
            <th class="text-right">Avg Speed</th>
            <th class="text-center">Period</th>
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
              <v-chip
                v-if="item.technology"
                :color="item.techColor"
                variant="tonal"
                size="small"
              >
                {{ item.technology }}
              </v-chip>
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

            <!-- Success Rate -->
            <td class="text-center">
              <v-chip
                :color="item.successRateColor"
                variant="flat"
                size="small"
              >
                {{ item.successRateFormatted }}%
              </v-chip>
            </td>

            <!-- Avg Speed -->
            <td class="text-right">{{ item.avgSpeedFormatted }} ms</td>

            <!-- Period -->
            <td class="text-center">
              <span class="text-caption">{{ item.days_covered }} days</span>
            </td>
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
import { ref, onMounted } from 'vue';
import type { ProviderRankingFilters } from '~/types/api';

const {
  formattedRankings,
  totalEntries,
  pagination,
  filters,
  loading,
  error,
  loadProviderRankings,
  updateFilters,
  clearFilters,
  goToPage,
  changePerPage
} = useProviderRankings();

// Local filters for UI
const localFilters = ref<ProviderRankingFilters>({ ...filters.value });

// Options
const providerOptions = [
  { title: 'Earthlink', value: 5 },
  { title: 'AT&T', value: 6 },
  { title: 'Verizon', value: 7 },
  { title: 'Comcast', value: 8 },
  { title: 'HughesNet', value: 9 },
  { title: 'Cox', value: 10 },
  { title: 'GeoLinks', value: 11 },
  { title: 'Spectrum', value: 15 },
  { title: 'T-Mobile', value: 12 },
  { title: 'Frontier', value: 13 },
  { title: 'CenturyLink', value: 14 }
];

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

const perPageOptions = [
  { title: '15 per page', value: 15 },
  { title: '25 per page', value: 25 },
  { title: '50 per page', value: 50 },
  { title: '100 per page', value: 100 }
];

// Helper to get period label
const getPeriodLabel = (period: string | null | undefined) => {
  const labels: Record<string, string> = {
    'today': 'Today',
    'yesterday': 'Yesterday',
    'last_week': 'Last 7 Days',
    'last_month': 'Last 30 Days',
    'last_year': 'Last 365 Days',
    'all_time': 'All Time'
  };
  return period ? labels[period] || period : '';
};

const onFilterChange = () => {
  // Reset to page 1 when filters change
  localFilters.value.page = 1;
  updateFilters(localFilters.value);
  loadProviderRankings();
};

const onClearFilters = () => {
  clearFilters();
  localFilters.value = { ...filters.value };
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

onMounted(() => {
  loadProviderRankings();
});
</script>

<style scoped>
.provider-rankings {
  width: 100%;
}
</style>

