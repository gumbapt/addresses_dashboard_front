<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import UiChildCard from '@/components/shared/UiChildCard.vue';
import BatchDomainSelector from '@/components/BatchDomainSelector.vue';
import { useConfirmDialog } from '~/composables/useConfirmDialog';
import type { DomainGroup, CreateDomainGroupRequest, UpdateDomainGroupRequest } from '~/types/api';

// Define authentication and permissions middleware
definePageMeta({
  middleware: ['auth', 'permissions']
});

// Use domain groups composable
const {
  formattedGroups,
  pagination,
  loading,
  error,
  loadDomainGroups,
  createDomainGroup,
  updateDomainGroup,
  deleteDomainGroup,
  getGroupDomains,
  addDomainsToGroup,
  removeDomainsFromGroup
} = useDomainGroups();

// Check permissions
const { hasPermission } = usePermissions();
const { user } = useAuth();
const confirmDialog = useConfirmDialog();

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
const showDomainsDialog = ref(false);
const showBatchAddDialog = ref(false); // NEW: For batch adding domains
const selectedGroup = ref<any>(null);

// Form states
const groupForm = ref<CreateDomainGroupRequest>({
  name: '',
  description: '',
  is_active: true,
  max_domains: null,
  settings: {}
});

// Domain list for selected group
const groupDomains = ref<any[]>([]);
const loadingDomains = ref(false);

// State for saving
const saving = ref(false);
const saveError = ref<string | null>(null);

// Available filters
const statusOptions = [
  { value: 'all', label: 'All Status' },
  { value: true, label: 'Active' },
  { value: false, label: 'Inactive' }
];

// Computed to filter groups
const filteredGroups = computed(() => {
  return formattedGroups.value.filter((group: any) => {
    const matchesSearch = group.name.toLowerCase().includes(search.value.toLowerCase()) ||
                         (group.description && group.description.toLowerCase().includes(search.value.toLowerCase()));
    const matchesStatus = selectedStatus.value === 'all' || group.is_active === selectedStatus.value;
    
    return matchesSearch && matchesStatus;
  });
});

// Action functions
const addGroup = () => {
  if (!isSuperAdmin.value) {
    notification.warning('Only Super Admins can create domain groups');
    return;
  }
  
  // Clear selected group (important for create vs edit logic)
  selectedGroup.value = null;
  
  // Reset form
  groupForm.value = {
    name: '',
    description: '',
    is_active: true,
    max_domains: null,
    settings: {}
  };
  
  showAddDialog.value = true;
};

const editGroup = (group: any) => {
  if (!isSuperAdmin.value) {
    notification.warning('Only Super Admins can edit domain groups');
    return;
  }
  
  selectedGroup.value = { ...group };
  
  // Fill form with group data
  groupForm.value = {
    name: group.name,
    description: group.description || '',
    is_active: group.is_active,
    max_domains: group.max_domains,
    settings: group.settings || {}
  };
  
  showEditDialog.value = true;
};

const deleteGroup = async (group: any) => {
  if (!isSuperAdmin.value) {
    notification.warning('Only Super Admins can delete domain groups');
    return;
  }
  
  // Use custom confirm dialog
  const confirmed = await confirmDialog.danger(
    `<p>Are you sure you want to delete the group <strong>"${group.name}"</strong>?</p>` +
    `<p class="mt-2">This action cannot be undone.</p>` +
    (group.domainsCount > 0 ? `<p class="mt-2 text-warning"><strong>⚠️ Warning:</strong> This group contains ${group.domainsCount} domain(s). They will become ungrouped.</p>` : ''),
    '🗑️ Delete Domain Group'
  );
  
  if (!confirmed) return;
  
  // Proceed with deletion
  selectedGroup.value = group;
  await confirmDelete();
};

const viewGroupDomains = async (group: any) => {
  selectedGroup.value = group;
  showDomainsDialog.value = true;
  
  // Load the domains
  await loadGroupDomainsData(group.id);
};

const manageDomains = (group: any) => {
  selectedGroup.value = group;
  showBatchAddDialog.value = true;
};

const handleBatchAddSuccess = async () => {
  // Reload groups and domains
  await loadDomainGroups();
  
  if (selectedGroup.value) {
    // Reload the specific group's domains
    await loadGroupDomainsData(selectedGroup.value.id);
  }
  
  showBatchAddDialog.value = false;
};

const loadGroupDomainsData = async (groupId: number) => {
  loadingDomains.value = true;
  
  try {
    console.log('🔍 Loading domains for group ID:', groupId);
    const result = await getGroupDomains(groupId);
    console.log('🔍 Result from getGroupDomains:', result);
    
    if (result.success && result.data) {
      // API returns: { success: true, data: Domain[] } after service processes it
      const domains = result.data;
      console.log('🔍 Setting groupDomains to:', domains);
      groupDomains.value = domains;
    } else {
      console.error('❌ Failed:', result);
      groupDomains.value = [];
    }
  } catch (error) {
    console.error('❌ Error:', error);
    groupDomains.value = [];
  } finally {
    loadingDomains.value = false;
  }
};

// Save group (create or update)
const saveGroup = async () => {
  saving.value = true;
  saveError.value = null;
  
  try {
    let result;
    
    console.log('🔍 saveGroup - selectedGroup:', selectedGroup.value);
    console.log('🔍 saveGroup - mode:', selectedGroup.value ? 'UPDATE' : 'CREATE');
    
    if (selectedGroup.value) {
      // Editing existing group
      console.log('🔍 Updating group ID:', selectedGroup.value.id);
      result = await updateDomainGroup(selectedGroup.value.id, groupForm.value);
    } else {
      // Creating new group
      console.log('🔍 Creating new group');
      result = await createDomainGroup(groupForm.value);
    }
    
    console.log('🔍 saveGroup - result:', result);
    
    if (result.success) {
      // Close dialogs and clear selection
      showAddDialog.value = false;
      showEditDialog.value = false;
      selectedGroup.value = null;  // Clear selection after save
      
      notification.success(result.message || 'Domain group saved successfully');
      
      // Reload groups
      await loadDomainGroups();
    } else {
      saveError.value = result.error || 'Failed to save domain group';
      notification.error(result.error || 'Failed to save domain group');
    }
  } catch (error) {
    saveError.value = error instanceof Error ? error.message : 'Unexpected error';
    notification.error(error instanceof Error ? error.message : 'Unexpected error');
  } finally {
    saving.value = false;
  }
};

// Confirm delete
const confirmDelete = async () => {
  if (!selectedGroup.value) return;
  
  saving.value = true;
  saveError.value = null;
  
  try {
    const result = await deleteDomainGroup(selectedGroup.value.id);
    
    if (result.success) {
      showDeleteDialog.value = false;
      selectedGroup.value = null;
      notification.success('Domain group deleted successfully');
      
      // Reload groups
      await loadDomainGroups();
    } else {
      saveError.value = result.error || 'Failed to delete domain group';
      notification.error(result.error || 'Failed to delete domain group');
    }
  } catch (error) {
    saveError.value = error instanceof Error ? error.message : 'Unexpected error';
    notification.error(error instanceof Error ? error.message : 'Unexpected error');
  } finally {
    saving.value = false;
  }
};

const clearFilters = () => {
  search.value = '';
  selectedStatus.value = 'all';
};

// Load groups when page is mounted
onMounted(() => {
  loadDomainGroups();
});
</script>

<template>
  <div>
    <!-- Confirm Dialog -->
    <ConfirmDialog
      v-model="confirmDialog.dialogState.value.isOpen"
      :title="confirmDialog.dialogState.value.title"
      :message="confirmDialog.dialogState.value.message"
      :type="confirmDialog.dialogState.value.type"
      :confirmText="confirmDialog.dialogState.value.confirmText"
      :cancelText="confirmDialog.dialogState.value.cancelText"
      :loading="confirmDialog.dialogState.value.loading"
      @confirm="confirmDialog.handleConfirm"
      @cancel="confirmDialog.handleCancel"
    />
    
    <!-- Header -->
    <v-row class="mb-4">
      <v-col cols="12">
        <div class="d-flex align-center justify-space-between">
          <div>
            <h1 class="text-h4 font-weight-bold">Domain Groups</h1>
            <p class="text-body-1 text-medium-emphasis">
              Organize and manage domain groups
            </p>
          </div>
          <v-btn
            v-if="isSuperAdmin"
            color="primary"
            prepend-icon="mdi-plus"
            @click="addGroup"
            size="large"
          >
            Create Group
          </v-btn>
          <v-alert v-else type="info" variant="tonal" density="compact">
            Only Super Admins can create groups
          </v-alert>
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
                label="Search by name or description"
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
                  {{ filteredGroups.length }} groups found
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

    <!-- Groups Table -->
    <v-row v-else>
      <v-col cols="12">
        <UiChildCard title="Domain Groups List">
          <v-table fixed-header height="600px">
            <thead>
              <tr>
                <th class="text-left">Name</th>
                <th class="text-left">Description</th>
                <th class="text-left">Domains</th>
                <th class="text-left">Limit</th>
                <th class="text-left">Status</th>
                <th class="text-left">Created At</th>
                <th class="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="group in filteredGroups" :key="group.id">
                <td>
                  <div class="d-flex align-center">
                    <v-icon class="mr-2" :color="group.is_active ? 'primary' : 'grey'">
                      mdi-folder
                    </v-icon>
                    <div>
                      <div class="font-weight-medium">{{ group.name }}</div>
                      <div class="text-caption text-medium-emphasis">{{ group.slug }}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div class="text-truncate" style="max-width: 300px">
                    {{ group.description || '-' }}
                  </div>
                </td>
                <td>
                  <v-chip
                    color="info"
                    variant="tonal"
                    size="small"
                    @click="viewGroupDomains(group)"
                    style="cursor: pointer"
                  >
                    {{ group.domainsCount }} domains
                  </v-chip>
                </td>
                <td>
                  <div v-if="group.max_domains">
                    <v-chip
                      :color="group.isFull ? 'error' : 'success'"
                      variant="tonal"
                      size="small"
                    >
                      {{ group.limitLabel }}
                    </v-chip>
                    <div v-if="group.isFull" class="text-caption text-error mt-1">
                      Full
                    </div>
                  </div>
                  <v-chip v-else variant="outlined" size="small">
                    Unlimited
                  </v-chip>
                </td>
                <td>
                  <v-chip
                    :color="group.statusColor"
                    variant="tonal"
                    size="small"
                  >
                    {{ group.statusLabel }}
                  </v-chip>
                </td>
                <td>{{ group.createdDate }}</td>
                <td>
                  <div class="d-flex justify-center gap-1">
                    <v-btn
                      icon
                      size="small"
                      variant="text"
                      color="info"
                      @click="viewGroupDomains(group)"
                      title="View Domains"
                    >
                      <v-icon>mdi-eye</v-icon>
                    </v-btn>
                    <v-btn
                      v-if="isSuperAdmin"
                      icon
                      size="small"
                      variant="text"
                      color="success"
                      @click="manageDomains(group)"
                      title="Add Domains"
                    >
                      <v-icon>mdi-plus-circle</v-icon>
                    </v-btn>
                    <v-btn
                      v-if="isSuperAdmin"
                      icon
                      size="small"
                      variant="text"
                      color="primary"
                      @click="editGroup(group)"
                      title="Edit"
                    >
                      <v-icon>mdi-pencil</v-icon>
                    </v-btn>
                    <v-btn
                      v-if="isSuperAdmin"
                      icon
                      size="small"
                      variant="text"
                      color="error"
                      @click="deleteGroup(group)"
                      title="Delete"
                      :disabled="group.domainsCount > 0"
                    >
                      <v-icon>mdi-delete</v-icon>
                    </v-btn>
                    <v-tooltip v-if="isSuperAdmin && group.domainsCount > 0" location="top">
                      <template v-slot:activator="{ props }">
                        <v-icon v-bind="props" size="small" color="grey">mdi-information</v-icon>
                      </template>
                      Cannot delete group with domains
                    </v-tooltip>
                  </div>
                </td>
              </tr>
            </tbody>
          </v-table>

          <!-- Info about total -->
          <div class="d-flex justify-end mt-4">
            <div class="text-body-2 text-medium-emphasis">
              Total: {{ formattedGroups.length }} groups
            </div>
          </div>
        </UiChildCard>
      </v-col>
    </v-row>

    <!-- Dialogs -->
    
    <!-- Create Dialog -->
    <v-dialog v-model="showAddDialog" max-width="700px" scrollable>
      <v-card>
        <v-card-title>Create Domain Group</v-card-title>
        <v-card-text>
          <v-form>
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="groupForm.name"
                  label="Group Name"
                  variant="outlined"
                  required
                  placeholder="e.g., Production Sites"
                  hint="A unique name for this group"
                  persistent-hint
                />
              </v-col>
              
              <v-col cols="12">
                <v-textarea
                  v-model="groupForm.description"
                  label="Description"
                  variant="outlined"
                  rows="3"
                  placeholder="Describe the purpose of this group..."
                  hint="Optional description"
                  persistent-hint
                />
              </v-col>
              
              <v-col cols="12" md="6">
                <v-text-field
                  v-model.number="groupForm.max_domains"
                  label="Max Domains"
                  variant="outlined"
                  type="number"
                  min="1"
                  placeholder="Leave empty for unlimited"
                  hint="Maximum number of domains allowed in this group"
                  persistent-hint
                  clearable
                />
              </v-col>
              
              <v-col cols="12" md="6">
                <v-switch
                  v-model="groupForm.is_active"
                  label="Active Group"
                  color="primary"
                  hint="Inactive groups cannot accept new domains"
                  persistent-hint
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
          <v-btn color="primary" @click="saveGroup" :loading="saving" :disabled="saving">Create Group</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Edit Dialog -->
    <v-dialog v-model="showEditDialog" max-width="700px" scrollable>
      <v-card>
        <v-card-title>Edit Domain Group: {{ selectedGroup?.name }}</v-card-title>
        <v-card-text>
          <v-form>
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="groupForm.name"
                  label="Group Name"
                  variant="outlined"
                  required
                />
              </v-col>
              
              <v-col cols="12">
                <v-textarea
                  v-model="groupForm.description"
                  label="Description"
                  variant="outlined"
                  rows="3"
                />
              </v-col>
              
              <v-col cols="12" md="6">
                <v-text-field
                  v-model.number="groupForm.max_domains"
                  label="Max Domains"
                  variant="outlined"
                  type="number"
                  min="1"
                  placeholder="Leave empty for unlimited"
                  hint="Cannot be less than current domain count"
                  persistent-hint
                  clearable
                />
                <v-alert v-if="selectedGroup && selectedGroup.domainsCount > 0" 
                         type="info" 
                         variant="tonal" 
                         density="compact" 
                         class="mt-2">
                  Current domains: {{ selectedGroup.domainsCount }}
                </v-alert>
              </v-col>
              
              <v-col cols="12" md="6">
                <v-switch
                  v-model="groupForm.is_active"
                  label="Active Group"
                  color="primary"
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
          <v-btn color="primary" @click="saveGroup" :loading="saving" :disabled="saving">Save Changes</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Dialog -->
    <v-dialog v-model="showDeleteDialog" max-width="400px">
      <v-card>
        <v-card-title>Confirm Deletion</v-card-title>
        <v-card-text>
          <p>Are you sure you want to delete this domain group?</p>
          <p><strong>{{ selectedGroup?.name }}</strong></p>
          <v-alert v-if="selectedGroup && selectedGroup.domainsCount > 0" 
                   type="warning" 
                   variant="tonal" 
                   density="compact" 
                   class="mt-4">
            This group has {{ selectedGroup.domainsCount }} domain(s). Please remove them first.
          </v-alert>
          <v-alert v-if="saveError" type="error" variant="tonal" density="compact" class="mt-4">
            {{ saveError }}
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="showDeleteDialog = false" :disabled="saving">Cancel</v-btn>
          <v-btn 
            color="error" 
            @click="confirmDelete" 
            :loading="saving" 
            :disabled="saving || (selectedGroup && selectedGroup.domainsCount > 0)"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- View Domains Dialog -->
    <v-dialog v-model="showDomainsDialog" max-width="800px" scrollable>
      <v-card>
        <v-card-title>Domains in {{ selectedGroup?.name }}</v-card-title>
        <v-card-text>
          <div v-if="loadingDomains" class="text-center py-4">
            <v-progress-circular indeterminate color="primary"></v-progress-circular>
          </div>
          <div v-else-if="groupDomains.length === 0">
            <v-alert type="info" variant="tonal">
              No domains in this group yet
            </v-alert>
          </div>
          <v-list v-else density="compact">
            <v-list-item
              v-for="domain in groupDomains"
              :key="domain.id"
            >
              <template v-slot:prepend>
                <v-icon color="primary">mdi-web</v-icon>
              </template>
              <v-list-item-title>{{ domain.name }}</v-list-item-title>
              <v-list-item-subtitle>{{ domain.domain_url }}</v-list-item-subtitle>
              <template v-slot:append>
                <v-chip
                  :color="domain.is_active ? 'success' : 'error'"
                  size="small"
                  variant="tonal"
                >
                  {{ domain.is_active ? 'Active' : 'Inactive' }}
                </v-chip>
              </template>
            </v-list-item>
          </v-list>
        </v-card-text>
        <v-card-actions>
          <v-chip color="info" variant="tonal">
            {{ groupDomains.length }} domain(s)
          </v-chip>
          <v-spacer></v-spacer>
          <v-btn
            v-if="isSuperAdmin"
            color="success"
            variant="outlined"
            @click="showDomainsDialog = false; manageDomains(selectedGroup)"
          >
            <v-icon start>mdi-plus</v-icon>
            Add Domains
          </v-btn>
          <v-btn @click="showDomainsDialog = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Batch Add Domains Dialog -->
    <v-dialog v-model="showBatchAddDialog" max-width="900px" scrollable>
      <v-card>
        <v-card-title class="d-flex align-center justify-space-between">
          <span>Manage Domains: {{ selectedGroup?.name }}</span>
          <v-chip
            v-if="selectedGroup?.max_domains"
            :color="selectedGroup?.isFull ? 'error' : 'info'"
            variant="tonal"
            size="small"
          >
            {{ selectedGroup?.limitLabel }}
          </v-chip>
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text>
          <BatchDomainSelector
            v-if="selectedGroup"
            :group-id="selectedGroup.id"
            :group-name="selectedGroup.name"
            :on-success="handleBatchAddSuccess"
          />
        </v-card-text>
        <v-card-actions>
          <v-btn @click="showBatchAddDialog = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
.text-truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>

