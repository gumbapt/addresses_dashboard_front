<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import UiChildCard from '@/components/shared/UiChildCard.vue';
import type { ReportFilters } from '~/types/api';

// Definir middleware de autenticação e permissões
definePageMeta({
  middleware: ['auth', 'permissions']
});

// Usar o composable de reports
const {
  formattedReports,
  meta,
  loading,
  error,
  loadReports,
  loadReport,
  nextPage,
  prevPage,
  goToPage,
  changePerPage,
  canGoNext,
  canGoPrev,
  pageNumbers
} = useReports();

// Usar composable de domains para filtro
const { domains: allDomains, loadDomains } = useDomains();

// Verificar permissões
const { hasPermission } = usePermissions();

// Notificações
const notification = useNotification();

// Estados reativos para filtros
const filters = ref<ReportFilters>({
  domain_id: undefined,
  status: undefined,
  start_date: undefined,
  end_date: undefined,
  page: 1,
  per_page: 15
});

// Estados para diálogos
const showDetailDialog = ref(false);
const selectedReport = ref<any>(null);
const detailLoading = ref(false);

// Status disponíveis
const statusOptions = [
  { value: undefined, label: 'All Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'processed', label: 'Processed' },
  { value: 'failed', label: 'Failed' }
];

// Computed para opções de domínio
const domainOptions = computed(() => {
  const options = [{ value: undefined, label: 'All Domains' }];
  
  if (allDomains.value && Array.isArray(allDomains.value)) {
    allDomains.value.forEach((domain: any) => {
      options.push({
        value: domain.id,
        label: domain.name
      });
    });
  }
  
  return options;
});

// Função para aplicar filtros
const applyFilters = () => {
  filters.value.page = 1; // Reset para primeira página ao aplicar filtros
  loadReports(filters.value);
};

// Função para limpar filtros
const clearFilters = () => {
  filters.value = {
    domain_id: undefined,
    status: undefined,
    start_date: undefined,
    end_date: undefined,
    page: 1,
    per_page: 15
  };
  applyFilters();
};

// Função para ver detalhes do report
const viewReportDetails = async (report: any) => {
  showDetailDialog.value = true;
  detailLoading.value = true;
  
  try {
    const fullReport = await loadReport(report.id);
    if (fullReport) {
      selectedReport.value = fullReport;
    } else {
      notification.error('Failed to load report details');
      showDetailDialog.value = false;
    }
  } catch (error) {
    notification.error('Error loading report details');
    showDetailDialog.value = false;
  } finally {
    detailLoading.value = false;
  }
};

// Função para formatar JSON
const formatJSON = (data: any): string => {
  if (!data) return 'N/A';
  return JSON.stringify(data, null, 2);
};

// Função para exportar report (futura implementação)
const exportReport = (report: any) => {
  notification.info('Export feature coming soon');
};

// Funções de navegação com filtros
const handleNextPage = () => {
  nextPage(filters.value);
  filters.value.page = (filters.value.page || 1) + 1;
};

const handlePrevPage = () => {
  prevPage(filters.value);
  filters.value.page = Math.max(1, (filters.value.page || 1) - 1);
};

const handleGoToPage = (page: number) => {
  goToPage(page, filters.value);
  filters.value.page = page;
};

const handleChangePerPage = (perPage: number) => {
  changePerPage(perPage, filters.value);
  filters.value.per_page = perPage;
  filters.value.page = 1;
};

// Carregar dados quando a página for montada
onMounted(() => {
  loadDomains(); // Carregar domains para o filtro
  loadReports(filters.value); // Carregar reports
});
</script>

<template>
  <div>
    <!-- Header -->
    <v-row class="mb-4">
      <v-col cols="12">
        <div class="d-flex align-center justify-space-between">
          <div>
            <h1 class="text-h4 font-weight-bold">Reports</h1>
            <p class="text-body-1 text-medium-emphasis">
              View and manage all domain reports
            </p>
          </div>
        </div>
      </v-col>
    </v-row>

    <!-- Filtros -->
    <v-row class="mb-6">
      <v-col cols="12">
        <UiChildCard title="Filters">
          <v-form @submit.prevent="applyFilters">
            <v-row>
              <v-col cols="12" md="6" lg="3">
                <v-select
                  v-model="filters.domain_id"
                  :items="domainOptions"
                  item-title="label"
                  item-value="value"
                  label="Domain"
                  variant="outlined"
                  density="compact"
                  clearable
                />
              </v-col>
              
              <v-col cols="12" md="6" lg="3">
                <v-select
                  v-model="filters.status"
                  :items="statusOptions"
                  item-title="label"
                  item-value="value"
                  label="Status"
                  variant="outlined"
                  density="compact"
                  clearable
                />
              </v-col>
              
              <v-col cols="12" md="6" lg="3">
                <v-text-field
                  v-model="filters.start_date"
                  label="Start Date"
                  type="date"
                  variant="outlined"
                  density="compact"
                  clearable
                />
              </v-col>
              
              <v-col cols="12" md="6" lg="3">
                <v-text-field
                  v-model="filters.end_date"
                  label="End Date"
                  type="date"
                  variant="outlined"
                  density="compact"
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
                    prepend-icon="mdi-filter"
                  >
                    Apply Filters
                  </v-btn>
                  
                  <v-btn
                    variant="outlined"
                    @click="clearFilters"
                    prepend-icon="mdi-refresh"
                  >
                    Clear Filters
                  </v-btn>
                  
                  <v-chip
                    v-if="meta"
                    color="primary"
                    variant="tonal"
                    class="ml-auto"
                  >
                    {{ meta.total }} reports found
                  </v-chip>
                </div>
              </v-col>
            </v-row>
          </v-form>
        </UiChildCard>
      </v-col>
    </v-row>

    <!-- Loading -->
    <v-row v-if="loading">
      <v-col cols="12">
        <UiChildCard>
          <div class="d-flex justify-center align-center py-8">
            <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
          </div>
        </UiChildCard>
      </v-col>
    </v-row>

    <!-- Erro -->
    <v-row v-else-if="error">
      <v-col cols="12">
        <UiChildCard>
          <v-alert type="error" variant="tonal" class="mb-0">
            {{ error }}
          </v-alert>
        </UiChildCard>
      </v-col>
    </v-row>

    <!-- Tabela de Reports -->
    <v-row v-else>
      <v-col cols="12">
        <UiChildCard title="Reports List">
          <v-table fixed-header height="600px">
            <thead>
              <tr>
                <th class="text-left">ID</th>
                <th class="text-left">Domain</th>
                <th class="text-left">Report Date</th>
                <th class="text-left">Status</th>
                <th class="text-left">Data Version</th>
                <th class="text-left">Created At</th>
                <th class="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="report in formattedReports" :key="report.id">
                <td>
                  <div class="font-weight-medium">#{{ report.id }}</div>
                </td>
                <td>
                  <div class="font-weight-medium">{{ report.domainName }}</div>
                  <div class="text-caption text-medium-emphasis">ID: {{ report.domain_id }}</div>
                </td>
                <td>{{ report.reportDate }}</td>
                <td>
                  <v-chip
                    :color="report.statusColor"
                    variant="tonal"
                    size="small"
                  >
                    {{ report.statusLabel }}
                  </v-chip>
                </td>
                <td>
                  <v-chip size="small" variant="outlined">
                    {{ report.data_version }}
                  </v-chip>
                </td>
                <td>{{ report.createdDate }}</td>
                <td>
                  <div class="d-flex justify-center gap-1">
                    <v-btn
                      icon
                      size="small"
                      variant="text"
                      color="info"
                      @click="viewReportDetails(report)"
                      title="View Details"
                    >
                      <v-icon>mdi-eye</v-icon>
                    </v-btn>
                    <v-btn
                      icon
                      size="small"
                      variant="text"
                      color="primary"
                      @click="exportReport(report)"
                      title="Export"
                    >
                      <v-icon>mdi-download</v-icon>
                    </v-btn>
                  </div>
                </td>
              </tr>
            </tbody>
          </v-table>

          <!-- Info sobre total (quando não há paginação ou só uma página) -->
          <div v-if="meta && meta.last_page === 1" class="d-flex justify-end mt-4">
            <div class="text-body-2 text-medium-emphasis">
              Total: {{ meta.total }} reports
            </div>
          </div>

          <!-- Paginação (quando há múltiplas páginas) -->
          <div v-if="meta && meta.last_page > 1" class="d-flex align-center justify-space-between mt-4">
            <div class="text-body-2 text-medium-emphasis">
              Showing {{ meta.from }} to {{ meta.to }} of {{ meta.total }} reports
            </div>
            
            <div class="d-flex align-center gap-2">
              <!-- Itens por página -->
              <v-select
                :model-value="filters.per_page"
                @update:model-value="handleChangePerPage"
                :items="[10, 15, 25, 50, 100]"
                variant="outlined"
                density="compact"
                hide-details
                style="width: 80px"
              />
              
              <!-- Navegação -->
              <v-btn
                icon
                variant="text"
                :disabled="!canGoPrev"
                @click="handlePrevPage"
                title="Previous page"
              >
                <v-icon>mdi-chevron-left</v-icon>
              </v-btn>
              
              <!-- Números das páginas -->
              <div class="d-flex gap-1">
                <v-btn
                  v-for="page in pageNumbers"
                  :key="page"
                  :color="page === meta.current_page ? 'primary' : undefined"
                  variant="text"
                  size="small"
                  @click="handleGoToPage(page)"
                >
                  {{ page }}
                </v-btn>
              </div>
              
              <v-btn
                icon
                variant="text"
                :disabled="!canGoNext"
                @click="handleNextPage"
                title="Next page"
              >
                <v-icon>mdi-chevron-right</v-icon>
              </v-btn>
            </div>
          </div>
        </UiChildCard>
      </v-col>
    </v-row>

    <!-- Dialog: Report Details -->
    <v-dialog v-model="showDetailDialog" max-width="900px" scrollable>
      <v-card>
        <v-card-title>
          <span class="text-h5">Report Details #{{ selectedReport?.id }}</span>
        </v-card-title>
        
        <v-card-text>
          <div v-if="detailLoading" class="d-flex justify-center py-8">
            <v-progress-circular indeterminate color="primary"></v-progress-circular>
          </div>
          
          <div v-else-if="selectedReport">
            <v-row>
              <v-col cols="12" md="6">
                <div class="mb-4">
                  <div class="text-subtitle-2 text-medium-emphasis mb-1">Domain</div>
                  <div class="text-h6">{{ selectedReport.domain?.name || 'N/A' }}</div>
                </div>
              </v-col>
              
              <v-col cols="12" md="6">
                <div class="mb-4">
                  <div class="text-subtitle-2 text-medium-emphasis mb-1">Report Date</div>
                  <div class="text-h6">{{ new Date(selectedReport.report_date).toLocaleDateString() }}</div>
                </div>
              </v-col>
              
              <v-col cols="12" md="6">
                <div class="mb-4">
                  <div class="text-subtitle-2 text-medium-emphasis mb-1">Status</div>
                  <v-chip :color="getStatusColor(selectedReport.status)" variant="tonal">
                    {{ getStatusLabel(selectedReport.status) }}
                  </v-chip>
                </div>
              </v-col>
              
              <v-col cols="12" md="6">
                <div class="mb-4">
                  <div class="text-subtitle-2 text-medium-emphasis mb-1">Data Version</div>
                  <v-chip variant="outlined">{{ selectedReport.data_version }}</v-chip>
                </div>
              </v-col>
              
              <v-col v-if="selectedReport.error_message" cols="12">
                <v-alert type="error" variant="tonal">
                  <div class="text-subtitle-2 mb-1">Error Message</div>
                  <div>{{ selectedReport.error_message }}</div>
                </v-alert>
              </v-col>
              
              <v-col cols="12">
                <v-expansion-panels>
                  <v-expansion-panel v-if="selectedReport.raw_data">
                    <v-expansion-panel-title>
                      <v-icon class="mr-2">mdi-file-code</v-icon>
                      Raw Data
                    </v-expansion-panel-title>
                    <v-expansion-panel-text>
                      <pre class="text-caption">{{ formatJSON(selectedReport.raw_data) }}</pre>
                    </v-expansion-panel-text>
                  </v-expansion-panel>
                  
                  <v-expansion-panel v-if="selectedReport.processed_data">
                    <v-expansion-panel-title>
                      <v-icon class="mr-2">mdi-file-check</v-icon>
                      Processed Data
                    </v-expansion-panel-title>
                    <v-expansion-panel-text>
                      <pre class="text-caption">{{ formatJSON(selectedReport.processed_data) }}</pre>
                    </v-expansion-panel-text>
                  </v-expansion-panel>
                </v-expansion-panels>
              </v-col>
              
              <v-col cols="12">
                <v-divider class="my-4"></v-divider>
                <div class="text-caption text-medium-emphasis">
                  <div>Created: {{ new Date(selectedReport.created_at).toLocaleString() }}</div>
                  <div>Updated: {{ new Date(selectedReport.updated_at).toLocaleString() }}</div>
                </div>
              </v-col>
            </v-row>
          </div>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="showDetailDialog = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
pre {
  background-color: #f5f5f5;
  padding: 12px;
  border-radius: 4px;
  overflow-x: auto;
  max-height: 400px;
}
</style>
