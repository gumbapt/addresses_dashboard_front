<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import UiChildCard from '@/components/shared/UiChildCard.vue';
import DomainGroupSelector from '@/components/DomainGroupSelector.vue';

// Define authentication and permissions middleware
definePageMeta({
  middleware: ['auth', 'permissions']
});

// Use the domains composable
const {
  formattedDomains,
  pagination,
  loading,
  error,
  loadDomains,
  nextPage,
  prevPage,
  goToPage,
  changePerPage,
  canGoNext,
  canGoPrev,
  pageNumbers,
  createDomain,
  updateDomain,
  deleteDomain,
  regenerateApiKey
} = useDomains();

// Use domain groups for selector
const { formattedGroups } = useDomainGroups();

// Check permissions
const { hasPermission } = usePermissions();
const { user } = useAuth();

// Computed: is super admin
const isSuperAdmin = computed(() => user.value?.is_super_admin === true);

// Notifications
const notification = useNotification();

// Reactive states for filters
const search = ref('');
const selectedStatus = ref('all');
const showAddDialog = ref(false);
const showEditDialog = ref(false);
const showDeleteDialog = ref(false);
const showApiKeyDialog = ref(false);
const selectedDomain = ref<any>(null);

// Domain form states
const domainForm = ref({
  domain_group_id: null as number | null, // NEW
  name: '',
  domain_url: '',
  site_id: '',
  timezone: 'UTC',
  wordpress_version: '',
  plugin_version: '',
  is_active: true
});

// State for saving
const saving = ref(false);
const saveError = ref<string | null>(null);

// Available filters
const statusOptions = [
  { value: 'all', label: 'All Status' },
  { value: 'Ativo', label: 'Active' },
  { value: 'Inativo', label: 'Inactive' }
];

// Common timezones
const timezoneOptions = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Sao_Paulo',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo',
  'Australia/Sydney'
];

// Computed to filter domains
const filteredDomains = computed(() => {
  return formattedDomains.value.filter(domain => {
    const matchesSearch = domain.name.toLowerCase().includes(search.value.toLowerCase()) ||
                         domain.domain_url.toLowerCase().includes(search.value.toLowerCase());
    const matchesStatus = selectedStatus.value === 'all' || 
                         (selectedStatus.value === 'Ativo' ? domain.is_active : !domain.is_active);
    
    return matchesSearch && matchesStatus;
  });
});

// Action functions
const addDomain = () => {
  if (hasPermission('domain-create') || isSuperAdmin.value) {
    domainForm.value = {
      domain_group_id: null, // NEW
      name: '',
      domain_url: '',
      site_id: '',
      timezone: 'UTC',
      wordpress_version: '',
      plugin_version: '',
      is_active: true
    };
    showAddDialog.value = true;
  }
};

const editDomain = (domain: any) => {
  if (hasPermission('domain-update') || isSuperAdmin.value) {
    selectedDomain.value = { ...domain };
    domainForm.value = {
      domain_group_id: domain.domain_group_id || null, // NEW
      name: domain.name,
      domain_url: domain.domain_url,
      site_id: domain.site_id,
      timezone: domain.timezone,
      wordpress_version: domain.wordpress_version || '',
      plugin_version: domain.plugin_version || '',
      is_active: domain.is_active
    };
    showEditDialog.value = true;
  }
};

const selectDomainToDelete = (domain: any) => {
  if (hasPermission('domain-delete')) {
    selectedDomain.value = domain;
    showDeleteDialog.value = true;
  }
};

const showApiKey = (domain: any) => {
  selectedDomain.value = domain;
  showApiKeyDialog.value = true;
};

const saveDomain = async () => {
  saving.value = true;
  saveError.value = null;
  
  try {
    if (selectedDomain.value) {
      // Editing existing domain
      const result = await updateDomain(selectedDomain.value.id, domainForm.value);
      
      if (result.success) {
        showEditDialog.value = false;
        notification.success('Domain updated successfully');
        await loadDomains(pagination.value?.current_page || 1, pagination.value?.per_page || 15);
      } else {
        saveError.value = result.error || 'Failed to update domain';
        notification.error(result.error || 'Failed to update domain');
      }
    } else {
      // Creating new domain
      const result = await createDomain(domainForm.value);
      
      if (result.success) {
        showAddDialog.value = false;
        notification.success('Domain created successfully');
        await loadDomains(pagination.value?.current_page || 1, pagination.value?.per_page || 15);
      } else {
        saveError.value = result.error || 'Failed to create domain';
        notification.error(result.error || 'Failed to create domain');
      }
    }
  } catch (error) {
    saveError.value = error instanceof Error ? error.message : 'Unexpected error';
    notification.error(error instanceof Error ? error.message : 'Unexpected error');
  } finally {
    saving.value = false;
  }
};

const confirmDelete = async () => {
  if (selectedDomain.value) {
    saving.value = true;
    saveError.value = null;
    
    try {
      const result = await deleteDomain(selectedDomain.value.id);
      
      if (result.success) {
        showDeleteDialog.value = false;
        selectedDomain.value = null;
        notification.success('Domain deleted successfully');
        await loadDomains(pagination.value?.current_page || 1, pagination.value?.per_page || 15);
      } else {
        saveError.value = result.error || 'Failed to delete domain';
        notification.error(result.error || 'Failed to delete domain');
      }
    } catch (error) {
      saveError.value = error instanceof Error ? error.message : 'Unexpected error';
      notification.error(error instanceof Error ? error.message : 'Unexpected error');
    } finally {
      saving.value = false;
    }
  }
};

const handleRegenerateApiKey = async () => {
  if (selectedDomain.value) {
    saving.value = true;
    
    try {
      const result = await regenerateApiKey(selectedDomain.value.id);
      
      if (result.success) {
        notification.success('API key regenerated successfully');
        selectedDomain.value.api_key = result.data?.api_key;
        await loadDomains(pagination.value?.current_page || 1, pagination.value?.per_page || 15);
      } else {
        notification.error(result.error || 'Failed to regenerate API key');
      }
    } catch (error) {
      notification.error(error instanceof Error ? error.message : 'Unexpected error');
    } finally {
      saving.value = false;
    }
  }
};

const copyApiKey = (apiKey: string) => {
  navigator.clipboard.writeText(apiKey);
  notification.success('API key copied to clipboard');
};

const clearFilters = () => {
  search.value = '';
  selectedStatus.value = 'all';
};

// Load domains when page is mounted
onMounted(() => {
  loadDomains();
});
</script>

<template>
  <div>
    <!-- Header -->
    <v-row class="mb-4">
      <v-col cols="12">
        <div class="d-flex align-center justify-space-between">
          <div>
            <h1 class="text-h4 font-weight-bold">Domains</h1>
            <p class="text-body-1 text-medium-emphasis">
              Manage all domains and their configurations
            </p>
          </div>
          <v-btn
            v-if="hasPermission('domain-create')"
            color="primary"
            prepend-icon="mdi-plus"
            @click="addDomain"
            size="large"
          >
            Add Domain
          </v-btn>
        </div>
      </v-col>
    </v-row>

    <!-- Filters -->
    <v-row class="mb-6">
      <v-col cols="12">
        <UiChildCard title="Filters">
          <v-row>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="search"
                label="Search by name or URL"
                prepend-inner-icon="mdi-magnify"
                variant="outlined"
                density="compact"
                clearable
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-select
                v-model="selectedStatus"
                :items="statusOptions"
                item-title="label"
                item-value="value"
                label="Status"
                variant="outlined"
                density="compact"
              />
            </v-col>
          </v-row>
          <v-row>
            <v-col cols="12">
              <div class="d-flex gap-2">
                <v-btn
                  variant="outlined"
                  @click="clearFilters"
                  prepend-icon="mdi-refresh"
                >
                  Clear Filters
                </v-btn>
                <v-chip
                  color="primary"
                  variant="tonal"
                  class="ml-auto"
                >
                  {{ filteredDomains.length }} domains found
                </v-chip>
              </div>
            </v-col>
          </v-row>
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

    <!-- Error -->
    <v-row v-else-if="error">
      <v-col cols="12">
        <UiChildCard>
          <v-alert type="error" variant="tonal" class="mb-0">
            {{ error }}
          </v-alert>
        </UiChildCard>
      </v-col>
    </v-row>

    <!-- Domains Table -->
    <v-row v-else>
      <v-col cols="12">
        <UiChildCard title="Domains List">
          <v-table fixed-header height="600px">
            <thead>
              <tr>
                <th class="text-left">Name</th>
                <th class="text-left">Group</th>
                <th class="text-left">Domain URL</th>
                <th class="text-left">Site ID</th>
                <th class="text-left">Status</th>
                <th class="text-left">Timezone</th>
                <th class="text-left">Created At</th>
                <th class="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="domain in filteredDomains" :key="domain.id">
                <td>
                  <div class="font-weight-medium">{{ domain.name }}</div>
                  <div class="text-caption text-medium-emphasis">{{ domain.slug }}</div>
                </td>
                <td>
                  <v-chip
                    v-if="domain.domainGroup"
                    color="primary"
                    variant="tonal"
                    size="small"
                    prepend-icon="mdi-folder"
                  >
                    {{ domain.domainGroup.name }}
                  </v-chip>
                  <span v-else class="text-medium-emphasis text-caption">
                    No group
                  </span>
                </td>
                <td>
                  <a :href="`https://${domain.domain_url}`" target="_blank" class="text-primary">
                    {{ domain.domain_url }}
                  </a>
                </td>
                <td>{{ domain.site_id }}</td>
                <td>
                  <v-chip
                    :color="domain.statusColor"
                    variant="tonal"
                    size="small"
                  >
                    {{ domain.is_active ? 'Active' : 'Inactive' }}
                  </v-chip>
                </td>
                <td>{{ domain.timezone }}</td>
                <td>{{ domain.createdDate }}</td>
                <td>
                  <div class="d-flex justify-center gap-1">
                    <v-btn
                      icon
                      size="small"
                      variant="text"
                      color="success"
                      @click="navigateTo(`/domains/${domain.id}/dashboard`)"
                      title="View Dashboard"
                    >
                      <v-icon>mdi-chart-box</v-icon>
                    </v-btn>
                    <v-btn
                      icon
                      size="small"
                      variant="text"
                      color="info"
                      @click="showApiKey(domain)"
                      title="View API Key"
                    >
                      <v-icon>mdi-key</v-icon>
                    </v-btn>
                    <v-btn
                      v-if="hasPermission('domain-update')"
                      icon
                      size="small"
                      variant="text"
                      color="primary"
                      @click="editDomain(domain)"
                      title="Edit"
                    >
                      <v-icon>mdi-pencil</v-icon>
                    </v-btn>
                    <v-btn
                      v-if="hasPermission('domain-delete')"
                      icon
                      size="small"
                      variant="text"
                      color="error"
                      @click="selectDomainToDelete(domain)"
                      title="Delete"
                    >
                      <v-icon>mdi-delete</v-icon>
                    </v-btn>
                  </div>
                </td>
              </tr>
            </tbody>
          </v-table>

          <!-- Info about total (when there is no pagination) -->
          <div v-if="pagination && pagination.last_page === 1" class="d-flex justify-end mt-4">
            <div class="text-body-2 text-medium-emphasis">
              Total: {{ pagination.total }} domains
            </div>
          </div>

          <!-- Pagination (when there are multiple pages) -->
          <div v-if="pagination && pagination.last_page > 1" class="d-flex align-center justify-space-between mt-4">
            <div class="text-body-2 text-medium-emphasis">
              Showing {{ pagination.from }} to {{ pagination.to }} of {{ pagination.total }} domains
            </div>
            
            <div class="d-flex align-center gap-2">
              <!-- Items per page -->
              <v-select
                :model-value="pagination.per_page"
                @update:model-value="changePerPage"
                :items="[10, 15, 25, 50]"
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
                @click="prevPage"
                title="Previous page"
              >
                <v-icon>mdi-chevron-left</v-icon>
              </v-btn>
              
              <!-- Page numbers -->
              <div class="d-flex gap-1">
                <v-btn
                  v-for="page in pageNumbers"
                  :key="page"
                  :color="page === pagination.current_page ? 'primary' : undefined"
                  variant="text"
                  size="small"
                  @click="goToPage(page)"
                >
                  {{ page }}
                </v-btn>
              </div>
              
              <v-btn
                icon
                variant="text"
                :disabled="!canGoNext"
                @click="nextPage"
                title="Next page"
              >
                <v-icon>mdi-chevron-right</v-icon>
              </v-btn>
            </div>
          </div>
        </UiChildCard>
      </v-col>
    </v-row>

    <!-- Dialog: Create Domain -->
    <v-dialog v-model="showAddDialog" max-width="700px" scrollable>
      <v-card>
        <v-card-title>Create Domain</v-card-title>
        <v-card-text>
          <v-form>
            <v-row>
              <v-col cols="12">
                <DomainGroupSelector
                  v-model="domainForm.domain_group_id"
                  label="Domain Group (Optional)"
                  hint="Organize domains into groups"
                  :error="saveError && saveError.includes('limit') ? saveError : ''"
                />
              </v-col>
              
              <v-col cols="12">
                <v-text-field
                  v-model="domainForm.name"
                  label="Name"
                  variant="outlined"
                  required
                  placeholder="Ex: SmarterHome ISP"
                  hint="Slug will be auto-generated"
                />
              </v-col>
              
              <v-col cols="12">
                <v-text-field
                  v-model="domainForm.domain_url"
                  label="Domain URL"
                  variant="outlined"
                  required
                  placeholder="api.example.com"
                  hint="Without http:// or https://"
                />
              </v-col>
              
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="domainForm.site_id"
                  label="Site ID (Optional)"
                  variant="outlined"
                  placeholder="wp-prod-example-001"
                />
              </v-col>
              
              <v-col cols="12" md="6">
                <v-select
                  v-model="domainForm.timezone"
                  :items="timezoneOptions"
                  label="Timezone"
                  variant="outlined"
                />
              </v-col>
              
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="domainForm.wordpress_version"
                  label="WordPress Version (Optional)"
                  variant="outlined"
                  placeholder="6.8.3"
                />
              </v-col>
              
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="domainForm.plugin_version"
                  label="Plugin Version (Optional)"
                  variant="outlined"
                  placeholder="2.0.0"
                />
              </v-col>
              
              <v-col cols="12">
                <v-switch
                  v-model="domainForm.is_active"
                  label="Active"
                  color="primary"
                  hide-details
                />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-alert v-if="saveError" type="error" variant="tonal" density="compact" class="mr-4">
            {{ saveError }}
          </v-alert>
          <v-btn @click="showAddDialog = false" :disabled="saving">Cancel</v-btn>
          <v-btn color="primary" @click="saveDomain" :loading="saving" :disabled="saving">Create</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog: Edit Domain -->
    <v-dialog v-model="showEditDialog" max-width="700px" scrollable>
      <v-card>
        <v-card-title>Edit Domain: {{ selectedDomain?.name }}</v-card-title>
        <v-card-text>
          <v-form>
            <v-row>
              <v-col cols="12">
                <DomainGroupSelector
                  v-model="domainForm.domain_group_id"
                  label="Domain Group (Optional)"
                  hint="Change group assignment"
                  :error="saveError && saveError.includes('limit') ? saveError : ''"
                />
              </v-col>
              
              <v-col cols="12">
                <v-text-field
                  v-model="domainForm.name"
                  label="Name"
                  variant="outlined"
                  required
                />
              </v-col>
              
              <v-col cols="12">
                <v-text-field
                  v-model="domainForm.domain_url"
                  label="Domain URL"
                  variant="outlined"
                  required
                />
              </v-col>
              
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="domainForm.site_id"
                  label="Site ID"
                  variant="outlined"
                />
              </v-col>
              
              <v-col cols="12" md="6">
                <v-select
                  v-model="domainForm.timezone"
                  :items="timezoneOptions"
                  label="Timezone"
                  variant="outlined"
                />
              </v-col>
              
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="domainForm.wordpress_version"
                  label="WordPress Version"
                  variant="outlined"
                />
              </v-col>
              
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="domainForm.plugin_version"
                  label="Plugin Version"
                  variant="outlined"
                />
              </v-col>
              
              <v-col cols="12">
                <v-switch
                  v-model="domainForm.is_active"
                  label="Active"
                  color="primary"
                  hide-details
                />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-alert v-if="saveError" type="error" variant="tonal" density="compact" class="mr-4">
            {{ saveError }}
          </v-alert>
          <v-btn @click="showEditDialog = false" :disabled="saving">Cancel</v-btn>
          <v-btn color="primary" @click="saveDomain" :loading="saving" :disabled="saving">Save Changes</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog: Delete Domain -->
    <v-dialog v-model="showDeleteDialog" max-width="400px">
      <v-card>
        <v-card-title>Confirm Deletion</v-card-title>
        <v-card-text>
          <p>Are you sure you want to delete this domain?</p>
          <p><strong>{{ selectedDomain?.name }}</strong></p>
          <v-alert v-if="saveError" type="error" variant="tonal" density="compact" class="mt-4">
            {{ saveError }}
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="showDeleteDialog = false" :disabled="saving">Cancel</v-btn>
          <v-btn color="error" @click="confirmDelete" :loading="saving" :disabled="saving">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog: API Key -->
    <v-dialog v-model="showApiKeyDialog" max-width="600px">
      <v-card>
        <v-card-title>API Key: {{ selectedDomain?.name }}</v-card-title>
        <v-card-text>
          <div v-if="selectedDomain">
            <v-alert type="info" variant="tonal" class="mb-4">
              <div class="text-subtitle-2">Keep this key secure!</div>
              <div class="text-caption">This key grants access to the domain's API.</div>
            </v-alert>
            
            <v-text-field
              :model-value="selectedDomain.api_key"
              label="API Key"
              variant="outlined"
              readonly
              append-inner-icon="mdi-content-copy"
              @click:append-inner="copyApiKey(selectedDomain.api_key)"
            />
            
            <div class="mt-4">
              <v-btn
                v-if="hasPermission('domain-update')"
                color="warning"
                variant="tonal"
                prepend-icon="mdi-refresh"
                @click="handleRegenerateApiKey"
                :loading="saving"
              >
                Regenerate API Key
              </v-btn>
            </div>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="showApiKeyDialog = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
