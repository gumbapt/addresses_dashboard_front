# 🏆 Provider Rankings - Vue 3 + Nuxt 3 Implementation Guide

## 📋 Overview

Sistema de rankings de Providers adaptado para **Vue 3 + Nuxt 3 + Vuetify 3 + TypeScript**.

**Backend Status:** ✅ 100% pronto e testado (8 testes passando)  
**API Base:** `http://localhost:8007/api/admin/reports/global/provider-ranking`

---

## 🏗️ Architecture Pattern

```
Page Component (Vuetify UI)
    ↓ uses
Composable (State Management)
    ↓ calls
Service (Business Logic)
    ↓ calls
Repository (API Client)
    ↓ HTTP
Backend API
```

---

## Step 1: TypeScript Interfaces

**File:** `types/api.d.ts`

```typescript
// Provider Ranking Types
export interface ProviderRanking {
  rank: number;
  domain_id: number;
  domain_name: string;
  domain_slug: string;
  provider_id: number;
  provider_name: string;
  technology: string | null;
  total_requests: number;
  avg_success_rate: number;
  avg_speed: number;
  total_reports: number;
  period_start: string;
  period_end: string;
  days_covered: number;
}

export interface ProviderRankingFilters {
  provider_id?: number | null;
  technology?: string | null;
  date_from?: string | null;
  date_to?: string | null;
  sort_by?: 'total_requests' | 'success_rate' | 'avg_speed' | 'total_reports';
  limit?: number;
}

export interface ProviderRankingResponse {
  success: boolean;
  data: {
    ranking: ProviderRanking[];
    total_entries: number;
    filters: ProviderRankingFilters;
  };
  message?: string;
}

export interface Provider {
  id: number;
  name: string;
  slug?: string;
}
```

---

## Step 2: Repository (API Layer)

**File:** `infrastructure/repositories/ProviderRankingRepository.ts`

```typescript
import { ApiClient } from '~/infrastructure/http/ApiClient';
import type { ProviderRankingResponse, ProviderRankingFilters } from '~/types/api';

export class ProviderRankingRepository {
  private apiClient: ApiClient;

  constructor() {
    this.apiClient = new ApiClient();
  }

  /**
   * Get provider rankings with filters
   */
  async getRankings(filters?: ProviderRankingFilters): Promise<ProviderRankingResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters?.provider_id) {
        queryParams.append('provider_id', filters.provider_id.toString());
      }
      if (filters?.technology) {
        queryParams.append('technology', filters.technology);
      }
      if (filters?.date_from) {
        queryParams.append('date_from', filters.date_from);
      }
      if (filters?.date_to) {
        queryParams.append('date_to', filters.date_to);
      }
      if (filters?.sort_by) {
        queryParams.append('sort_by', filters.sort_by);
      }
      if (filters?.limit) {
        queryParams.append('limit', filters.limit.toString());
      }
      
      const url = `/reports/global/provider-ranking${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      console.log('🔍 ProviderRankingRepository - URL:', url);
      
      const response = await this.apiClient.get<ProviderRankingResponse>(url);
      console.log('🔍 ProviderRankingRepository - Response:', response);
      
      return response;
    } catch (error) {
      console.error('ProviderRankingRepository - getRankings error:', error);
      throw error;
    }
  }
}
```

---

## Step 3: Service (Business Logic)

**File:** `services/ProviderRankingService.ts`

```typescript
import { ProviderRankingRepository } from '~/infrastructure/repositories/ProviderRankingRepository';
import type { 
  ProviderRanking,
  ProviderRankingFilters,
  ApiResponse 
} from '~/types/api';

export class ProviderRankingService {
  private providerRankingRepository: ProviderRankingRepository;

  constructor() {
    this.providerRankingRepository = new ProviderRankingRepository();
  }

  /**
   * Get provider rankings
   */
  async getProviderRankings(filters?: ProviderRankingFilters): Promise<ApiResponse<{
    rankings: ProviderRanking[];
    totalEntries: number;
    filters: ProviderRankingFilters;
  }>> {
    try {
      console.log('🔍 ProviderRankingService - getProviderRankings filters:', filters);
      const response = await this.providerRankingRepository.getRankings(filters);
      console.log('🔍 ProviderRankingService - response:', response);
      
      if (response.success && response.data) {
        return {
          success: true,
          data: {
            rankings: response.data.ranking || [],
            totalEntries: response.data.total_entries || 0,
            filters: response.data.filters || {}
          }
        };
      }
      
      return {
        success: false,
        error: 'Failed to fetch provider rankings'
      };
    } catch (error) {
      console.error('ProviderRankingService - getProviderRankings error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch provider rankings'
      };
    }
  }

  /**
   * Get top provider by ID
   */
  async getTopProviderDomain(providerId: number): Promise<ApiResponse<ProviderRanking | null>> {
    try {
      const response = await this.providerRankingRepository.getRankings({
        provider_id: providerId,
        limit: 1
      });
      
      if (response.success && response.data.ranking.length > 0) {
        return {
          success: true,
          data: response.data.ranking[0]
        };
      }
      
      return {
        success: true,
        data: null
      };
    } catch (error) {
      console.error('ProviderRankingService - getTopProviderDomain error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch top provider domain'
      };
    }
  }
}
```

---

## Step 4: Composable (State Management)

**File:** `composables/useProviderRankings.ts`

```typescript
import { ref, computed } from 'vue';
import { ProviderRankingService } from '~/services/ProviderRankingService';
import type { ProviderRanking, ProviderRankingFilters } from '~/types/api';

export const useProviderRankings = () => {
  // Reactive state
  const rankings = ref<ProviderRanking[]>([]);
  const totalEntries = ref(0);
  const filters = ref<ProviderRankingFilters>({
    technology: null,
    provider_id: null,
    sort_by: 'total_requests',
    limit: 20
  });
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Service instance
  const providerRankingService = new ProviderRankingService();

  // Computed: formatted rankings
  const formattedRankings = computed(() => {
    return rankings.value.map(ranking => ({
      ...ranking,
      requestsFormatted: ranking.total_requests.toLocaleString(),
      successRateFormatted: ranking.avg_success_rate.toFixed(1),
      avgSpeedFormatted: ranking.avg_speed.toFixed(0),
      successRateColor: ranking.avg_success_rate >= 90 ? 'success' : 
                       ranking.avg_success_rate >= 70 ? 'warning' : 'error',
      techColor: getTechColor(ranking.technology),
      hasMedal: ranking.rank <= 3,
      medalEmoji: ranking.rank === 1 ? '🥇' : ranking.rank === 2 ? '🥈' : ranking.rank === 3 ? '🥉' : ''
    }));
  });

  // Helper function
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

  /**
   * Load provider rankings
   */
  const loadProviderRankings = async (customFilters?: ProviderRankingFilters) => {
    loading.value = true;
    error.value = null;

    try {
      const filtersToUse = customFilters || filters.value;
      const result = await providerRankingService.getProviderRankings(filtersToUse);

      if (result.success && result.data) {
        rankings.value = result.data.rankings;
        totalEntries.value = result.data.totalEntries;
      } else {
        error.value = result.error || 'Failed to load provider rankings';
        rankings.value = [];
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unexpected error';
      rankings.value = [];
    } finally {
      loading.value = false;
    }
  };

  /**
   * Get top domain for specific provider
   */
  const getTopProviderDomain = async (providerId: number) => {
    const result = await providerRankingService.getTopProviderDomain(providerId);
    return result;
  };

  /**
   * Update filters
   */
  const updateFilters = (newFilters: Partial<ProviderRankingFilters>) => {
    filters.value = { ...filters.value, ...newFilters };
  };

  /**
   * Clear filters
   */
  const clearFilters = () => {
    filters.value = {
      technology: null,
      provider_id: null,
      sort_by: 'total_requests',
      limit: 20
    };
  };

  return {
    // State
    rankings,
    formattedRankings,
    totalEntries,
    filters,
    loading,
    error,

    // Actions
    loadProviderRankings,
    getTopProviderDomain,
    updateFilters,
    clearFilters
  };
};
```

---

## Step 5: Main Component - Provider Rankings Table

**File:** `components/ProviderRankingTable.vue`

```vue
<template>
  <div class="provider-rankings">
    <!-- Filters -->
    <v-row class="mb-4">
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
          v-model="localFilters.sort_by"
          :items="sortOptions"
          label="Sort By"
          variant="outlined"
          density="compact"
          @update:model-value="onFilterChange"
        >
          <template #prepend-inner>
            <v-icon size="small">mdi-sort</v-icon>
          </template>
        </v-select>
      </v-col>

      <v-col cols="12" md="3">
        <v-select
          v-model="localFilters.limit"
          :items="limitOptions"
          label="Limit"
          variant="outlined"
          density="compact"
          @update:model-value="onFilterChange"
        >
          <template #prepend-inner>
            <v-icon size="small">mdi-format-list-numbered</v-icon>
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
            <th class="text-right">Requests</th>
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

            <!-- Requests -->
            <td class="text-right font-weight-medium">
              {{ item.requestsFormatted }}
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
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import type { ProviderRankingFilters } from '~/types/api';

const {
  formattedRankings,
  totalEntries,
  filters,
  loading,
  error,
  loadProviderRankings,
  updateFilters,
  clearFilters
} = useProviderRankings();

// Local filters for UI
const localFilters = ref<ProviderRankingFilters>({ ...filters.value });

// Options
const technologyOptions = [
  { title: '🔵 Fiber', value: 'Fiber' },
  { title: '🟢 Cable', value: 'Cable' },
  { title: '🟡 DSL', value: 'DSL' },
  { title: '🟣 Mobile', value: 'Mobile' },
  { title: '🔴 Satellite', value: 'Satellite' }
];

const sortOptions = [
  { title: '📊 Most Requests', value: 'total_requests' },
  { title: '✅ Best Success Rate', value: 'success_rate' },
  { title: '⚡ Fastest Speed', value: 'avg_speed' },
  { title: '📈 Most Reports', value: 'total_reports' }
];

const limitOptions = [
  { title: 'Top 10', value: 10 },
  { title: 'Top 20', value: 20 },
  { title: 'Top 50', value: 50 },
  { title: 'Top 100', value: 100 }
];

const onFilterChange = () => {
  updateFilters(localFilters.value);
  loadProviderRankings();
};

const onClearFilters = () => {
  clearFilters();
  localFilters.value = { ...filters.value };
  loadProviderRankings();
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
```

---

## Step 6: Top Provider Card Component

**File:** `components/TopProviderCard.vue`

```vue
<template>
  <v-card v-if="topDomain" class="top-provider-card" elevation="2">
    <!-- Header -->
    <v-card-title class="d-flex align-center justify-space-between bg-gradient">
      <span class="text-white">{{ providerName }}</span>
      <v-chip
        v-if="topDomain.technology"
        :color="techColor"
        variant="flat"
        size="small"
      >
        {{ topDomain.technology }}
      </v-chip>
    </v-card-title>

    <v-card-text>
      <!-- Top Domain -->
      <div class="mb-4">
        <div class="text-caption text-medium-emphasis">🥇 Top Domain</div>
        <div class="text-h6 font-weight-bold">{{ topDomain.domain_name }}</div>
      </div>

      <!-- Stats Grid -->
      <v-row dense>
        <v-col cols="6">
          <div class="stat-item">
            <div class="text-caption text-medium-emphasis">Requests</div>
            <div class="text-h6">{{ topDomain.total_requests.toLocaleString() }}</div>
          </div>
        </v-col>
        <v-col cols="6">
          <div class="stat-item">
            <div class="text-caption text-medium-emphasis">Success Rate</div>
            <div class="text-h6">{{ topDomain.avg_success_rate.toFixed(1) }}%</div>
          </div>
        </v-col>
        <v-col cols="6">
          <div class="stat-item">
            <div class="text-caption text-medium-emphasis">Avg Speed</div>
            <div class="text-h6">{{ topDomain.avg_speed.toFixed(0) }} ms</div>
          </div>
        </v-col>
        <v-col cols="6">
          <div class="stat-item">
            <div class="text-caption text-medium-emphasis">Reports</div>
            <div class="text-h6">{{ topDomain.total_reports }}</div>
          </div>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>

  <v-card v-else-if="loading" class="top-provider-card">
    <v-card-text class="text-center">
      <v-progress-circular indeterminate></v-progress-circular>
      <div class="mt-2">Loading...</div>
    </v-card-text>
  </v-card>

  <v-card v-else class="top-provider-card">
    <v-card-text class="text-center text-medium-emphasis">
      No data available
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import type { ProviderRanking } from '~/types/api';

interface Props {
  providerName: string;
  providerId: number;
}

const props = defineProps<Props>();

const { getTopProviderDomain } = useProviderRankings();

const topDomain = ref<ProviderRanking | null>(null);
const loading = ref(true);

const techColor = computed(() => {
  const techMap: Record<string, string> = {
    'Fiber': 'blue',
    'Cable': 'green',
    'DSL': 'orange',
    'Mobile': 'purple',
    'Satellite': 'red'
  };
  return topDomain.value?.technology ? techMap[topDomain.value.technology] || 'grey' : 'grey';
});

const loadTopDomain = async () => {
  loading.value = true;
  const result = await getTopProviderDomain(props.providerId);
  
  if (result.success && result.data) {
    topDomain.value = result.data;
  }
  
  loading.value = false;
};

onMounted(() => {
  loadTopDomain();
});
</script>

<style scoped>
.bg-gradient {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-item {
  padding: 8px;
  background: #f5f5f5;
  border-radius: 8px;
}
</style>
```

---

## Step 7: Main Page

**File:** `pages/provider-rankings/index.vue`

```vue
<template>
  <div>
    <!-- Header -->
    <v-row class="mb-4">
      <v-col cols="12">
        <div class="d-flex align-center justify-space-between">
          <div>
            <h1 class="text-h4 font-weight-bold">🏆 Provider Rankings</h1>
            <p class="text-body-1 text-medium-emphasis">
              Rankings de providers por domínio, tecnologia e performance
            </p>
          </div>
        </div>
      </v-col>
    </v-row>

    <!-- Tabs -->
    <v-row class="mb-4">
      <v-col cols="12">
        <v-tabs v-model="activeTab" color="primary">
          <v-tab value="all">All Rankings</v-tab>
          <v-tab value="top">Top Providers</v-tab>
          <v-tab value="technology">By Technology</v-tab>
        </v-tabs>
      </v-col>
    </v-row>

    <!-- Content -->
    <v-window v-model="activeTab">
      <!-- All Rankings Tab -->
      <v-window-item value="all">
        <ProviderRankingTable />
      </v-window-item>

      <!-- Top Providers Tab -->
      <v-window-item value="top">
        <v-row>
          <v-col cols="12">
            <h3 class="mb-4">Top Providers Quick View</h3>
          </v-col>
          <v-col
            v-for="provider in topProviders"
            :key="provider.id"
            cols="12"
            sm="6"
            md="3"
          >
            <TopProviderCard
              :provider-name="provider.name"
              :provider-id="provider.id"
            />
          </v-col>
        </v-row>
      </v-window-item>

      <!-- By Technology Tab -->
      <v-window-item value="technology">
        <TechnologyBreakdown />
      </v-window-item>
    </v-window>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import ProviderRankingTable from '~/components/ProviderRankingTable.vue';
import TopProviderCard from '~/components/TopProviderCard.vue';
import TechnologyBreakdown from '~/components/TechnologyBreakdown.vue';

definePageMeta({
  layout: 'full',
  middleware: 'auth'
});

const activeTab = ref('all');

// Top providers to showcase
const topProviders = [
  { id: 15, name: 'Spectrum' },
  { id: 6, name: 'AT&T' },
  { id: 7, name: 'Verizon' },
  { id: 8, name: 'Comcast' },
  { id: 5, name: 'Earthlink' },
  { id: 9, name: 'HughesNet' }
];
</script>
```

---

## Step 8: Technology Breakdown Component

**File:** `components/TechnologyBreakdown.vue`

```vue
<template>
  <v-row>
    <v-col
      v-for="tech in technologies"
      :key="tech.value"
      cols="12"
      sm="6"
      md="3"
    >
      <v-card :class="`tech-card tech-${tech.value.toLowerCase()}`" elevation="2">
        <!-- Header -->
        <div :class="`tech-header tech-header-${tech.value.toLowerCase()}`">
          <h3 class="text-center">{{ tech.label }}</h3>
        </div>

        <!-- Rankings -->
        <v-card-text v-if="loading" class="text-center">
          <v-progress-circular indeterminate size="32"></v-progress-circular>
        </v-card-text>

        <v-list v-else-if="techRankings[tech.value]" density="compact">
          <v-list-item
            v-for="item in techRankings[tech.value]"
            :key="item.rank"
            class="tech-list-item"
          >
            <template #prepend>
              <div class="rank-badge">
                #{{ item.rank }}
              </div>
            </template>

            <v-list-item-title class="font-weight-medium">
              {{ item.domain_name }}
            </v-list-item-title>

            <v-list-item-subtitle>
              {{ item.provider_name }}
            </v-list-item-subtitle>

            <v-list-item-subtitle class="text-caption">
              {{ item.total_requests.toLocaleString() }} req •
              {{ item.avg_success_rate.toFixed(1) }}%
            </v-list-item-subtitle>
          </v-list-item>
        </v-list>

        <v-card-text v-else class="text-center text-medium-emphasis">
          No data available
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import type { ProviderRanking } from '~/types/api';

const { loadProviderRankings } = useProviderRankings();
const { ProviderRankingService } = await import('~/services/ProviderRankingService');
const providerRankingService = new ProviderRankingService();

const technologies = [
  { label: '🔵 Fiber', value: 'Fiber' },
  { label: '🟢 Cable', value: 'Cable' },
  { label: '🟡 DSL', value: 'DSL' },
  { label: '🟣 Mobile', value: 'Mobile' }
];

const techRankings = ref<Record<string, ProviderRanking[]>>({});
const loading = ref(true);

const loadAllTechnologies = async () => {
  loading.value = true;
  const results: Record<string, ProviderRanking[]> = {};

  for (const tech of technologies) {
    const result = await providerRankingService.getProviderRankings({
      technology: tech.value,
      limit: 5
    });

    if (result.success && result.data) {
      results[tech.value] = result.data.rankings;
    }
  }

  techRankings.value = results;
  loading.value = false;
};

onMounted(() => {
  loadAllTechnologies();
});
</script>

<style scoped>
.tech-header {
  padding: 16px;
  color: white;
  font-weight: 600;
}

.tech-header-fiber { background: #2196f3; }
.tech-header-cable { background: #4caf50; }
.tech-header-dsl { background: #ff9800; }
.tech-header-mobile { background: #9c27b0; }

.rank-badge {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #667eea;
  color: white;
  border-radius: 50%;
  font-weight: bold;
  font-size: 12px;
}

.tech-list-item {
  border-bottom: 1px solid #f0f0f0;
}

.tech-list-item:last-child {
  border-bottom: none;
}
</style>
```

---

## 📚 Complete Implementation Checklist

### Files to Create
- [ ] `types/api.d.ts` - Add Provider Ranking interfaces
- [ ] `infrastructure/repositories/ProviderRankingRepository.ts`
- [ ] `services/ProviderRankingService.ts`
- [ ] `composables/useProviderRankings.ts`
- [ ] `components/ProviderRankingTable.vue`
- [ ] `components/TopProviderCard.vue`
- [ ] `components/TechnologyBreakdown.vue`
- [ ] `pages/provider-rankings/index.vue`

### Add to Sidebar Menu
**File:** `components/Layout/Full/vertical-sidebar/sidebarItem.ts`

```typescript
{
  title: 'Provider Rankings',
  icon: TrophyIcon, // or any icon you prefer
  to: '/provider-rankings',
  chip: 'New',
  chipColor: 'success'
}
```

---

## 🚀 Quick Start Commands

```bash
# 1. Add TypeScript interfaces to types/api.d.ts
# 2. Create Repository
# 3. Create Service
# 4. Create Composable
# 5. Create Components
# 6. Create Page
# 7. Add to menu
# 8. Test at http://localhost:3000/provider-rankings
```

---

## 🎯 Testing

### Test Cases
1. **Load All Rankings** - Should show table with all providers
2. **Filter by Technology** - Should filter by Fiber/Cable/DSL/Mobile
3. **Sort by Different Criteria** - Should sort by requests/success/speed
4. **Change Limit** - Should show Top 10/20/50/100
5. **View Top Providers** - Should show cards for major providers
6. **Technology Breakdown** - Should show rankings per technology

---

## ⚡ Performance Tips

1. **Cache Results:** Use computed properties for formatted data
2. **Debounce Filters:** Add debounce to filter changes
3. **Lazy Load Tabs:** Only load data when tab is activated
4. **Virtual Scrolling:** For large tables (100+ items)

---

**Tempo Estimado:** 3-4 horas  
**Complexidade:** Média  
**Backend:** ✅ 100% Pronto

**Next Steps:** Copy files and test! 🚀

