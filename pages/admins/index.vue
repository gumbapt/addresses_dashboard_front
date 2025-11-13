<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import UiChildCard from '@/components/shared/UiChildCard.vue';

// Define authentication and permissions middleware
definePageMeta({
  middleware: ['auth', 'permissions']
});

// Use the administrators composable
const {
  formattedAdmins,
  pagination,
  loading,
  error,
  loadAdmins,
  nextPage,
  prevPage,
  goToPage,
  changePerPage,
  canGoNext,
  canGoPrev,
  pageNumbers,
  createAdmin,
  updateAdmin,
  deleteAdmin
} = useAdmins();

// Use roles composable for selection
const { formattedRoles, loadRoles } = useRoles();

// Check permissions
const { hasPermission, canAccess } = usePermissions();

// Notifications
const notification = useNotification();

// Reactive states for filters
const search = ref('');
const selectedStatus = ref('all');
const selectedRole = ref('all');
const showAddDialog = ref(false);
const showEditDialog = ref(false);
const showDeleteDialog = ref(false);
const selectedAdmin = ref<any>(null);

// Chat states
const showChatDialog = ref(false);
const selectedChatAdmin = ref<any>(null);

// Admin form states
const adminForm = ref({
  name: '',
  email: '',
  password: '',
  password_confirmation: '',
  is_active: true,
  role_id: null as number | null
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

const roleOptions = [
  { value: 'all', label: 'All Roles' },
  { value: 'Super Admin', label: 'Super Admin' },
  { value: 'Admin', label: 'Admin' }
];

// Computed to filter administrators
const filteredAdmins = computed(() => {
  return formattedAdmins.value.filter(admin => {
    const matchesSearch = admin.name.toLowerCase().includes(search.value.toLowerCase()) ||
                         admin.email.toLowerCase().includes(search.value.toLowerCase());
    const matchesStatus = selectedStatus.value === 'all' || admin.status === selectedStatus.value;
    const matchesRole = selectedRole.value === 'all' || admin.role === selectedRole.value;
    
    return matchesSearch && matchesStatus && matchesRole;
  });
});

// Action functions
const addAdmin = async () => {
  if (hasPermission('admin-create')) {
    // Reset form
    adminForm.value = {
      name: '',
      email: '',
      password: '',
      password_confirmation: '',
      is_active: true,
      role_id: null
    };
    
    // Load roles if not yet loaded
    if (formattedRoles.value.length === 0) {
      await loadRoles();
    }
    
    showAddDialog.value = true;
  }
};

const editAdmin = async (admin: any) => {
  if (hasPermission('admin-update')) {
    selectedAdmin.value = { ...admin };
    
    // Fill form with admin data
    adminForm.value = {
      name: admin.name,
      email: admin.email,
      password: '',
      password_confirmation: '',
      is_active: admin.is_active,
      role_id: null // You can add logic to get the role_id if needed
    };
    
    // Load roles if not yet loaded
    if (formattedRoles.value.length === 0) {
      await loadRoles();
    }
    
    showEditDialog.value = true;
  }
};

const selectAdminToDelete = (admin: any) => {
  if (hasPermission('admin-delete')) {
    selectedAdmin.value = admin;
    showDeleteDialog.value = true;
  }
};

const saveAdmin = async () => {
  saving.value = true;
  saveError.value = null;
  
  try {
    if (selectedAdmin.value) {
      // Editing existing admin
      const updateData = {
        id: selectedAdmin.value.id,
        name: adminForm.value.name,
        email: adminForm.value.email,
        is_active: adminForm.value.is_active
      };
      
      const result = await updateAdmin(updateData);
      
      if (result.success) {
        showEditDialog.value = false;
        notification.success('Administrator updated successfully');
        await loadAdmins(pagination.value?.current_page || 1, pagination.value?.per_page || 15);
      } else {
        saveError.value = result.error || 'Failed to update admin';
        notification.error(result.error || 'Failed to update admin');
      }
    } else {
      // Creating new admin
      const result = await createAdmin(adminForm.value);
      
      if (result.success) {
        showAddDialog.value = false;
        notification.success('Administrator created successfully');
        await loadAdmins(pagination.value?.current_page || 1, pagination.value?.per_page || 15);
      } else {
        saveError.value = result.error || 'Failed to create admin';
        notification.error(result.error || 'Failed to create admin');
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
  if (selectedAdmin.value) {
    saving.value = true;
    saveError.value = null;
    
    try {
      const result = await deleteAdmin(selectedAdmin.value.id);
      
      if (result.success) {
        showDeleteDialog.value = false;
        selectedAdmin.value = null;
        notification.success('Administrator deleted successfully');
        await loadAdmins(pagination.value?.current_page || 1, pagination.value?.per_page || 15);
      } else {
        saveError.value = result.error || 'Failed to delete admin';
        notification.error(result.error || 'Failed to delete admin');
      }
    } catch (error) {
      saveError.value = error instanceof Error ? error.message : 'Unexpected error';
      notification.error(error instanceof Error ? error.message : 'Unexpected error');
    } finally {
      saving.value = false;
    }
  }
};

const toggleAdminStatus = (admin: any) => {
  if (hasPermission('admin-update')) {
    // Here you would implement the API call to change status
    if (admin.status === 'Active') {
      admin.status = 'Inactive';
      admin.statusColor = 'error';
    } else {
      admin.status = 'Active';
      admin.statusColor = 'success';
    }
  }
};

// Function to start chat with administrator
const startChat = async (admin: any) => {
  if (canAccess('chat', 'read')) {
    console.log('Starting chat with administrator:', admin);
    selectedChatAdmin.value = admin;
    showChatDialog.value = true;
  }
};

const clearFilters = () => {
  search.value = '';
  selectedStatus.value = 'all';
  selectedRole.value = 'all';
};

// Load administrators when page is mounted
onMounted(() => {
  loadAdmins();
});
</script>

<template>
  <div>
    <!-- Header -->
    <v-row class="mb-4">
      <v-col cols="12">
        <div class="d-flex align-center justify-space-between">
          <div>
            <h1 class="text-h4 font-weight-bold">Administrators</h1>
            <p class="text-body-1 text-medium-emphasis">
              Manage all system administrators
            </p>
          </div>
          <v-btn
            v-if="hasPermission('admin-create')"
            color="primary"
            prepend-icon="mdi-plus"
            @click="addAdmin"
            size="large"
          >
            Add Administrator
          </v-btn>
        </div>
      </v-col>
    </v-row>

    <!-- Filters -->
    <v-row class="mb-6">
      <v-col cols="12">
        <UiChildCard title="Filters">
          <v-row>
            <v-col cols="12" md="4">
              <v-text-field
                v-model="search"
                label="Search by name or email"
                prepend-inner-icon="mdi-magnify"
                variant="outlined"
                density="compact"
                clearable
              />
            </v-col>
            <v-col cols="12" md="4">
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
            <v-col cols="12" md="4">
              <v-select
                v-model="selectedRole"
                :items="roleOptions"
                item-title="label"
                item-value="value"
                label="Role"
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
                  {{ filteredAdmins.length }} administrators found
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

    <!-- Administrators Table -->
    <v-row v-else>
      <v-col cols="12">
        <UiChildCard title="Administrators List">
          <v-table fixed-header height="600px">
            <thead>
              <tr>
                <th class="text-left">Administrator</th>
                <th class="text-left">Email</th>
                <th class="text-left">Role</th>
                <th class="text-left">Status</th>
                <th class="text-left">Last Login</th>
                <th class="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="admin in filteredAdmins" :key="admin.id">
                <td>
                  <div class="d-flex align-center">
                    <v-avatar size="40" class="mr-3">
                      <img :src="admin.avatar" :alt="admin.name" />
                    </v-avatar>
                    <div>
                      <div class="font-weight-medium">{{ admin.name }}</div>
                      <div class="text-caption text-medium-emphasis">{{ admin.phone }}</div>
                    </div>
                  </div>
                </td>
                <td>{{ admin.email }}</td>
                <td>
                  <v-chip
                    :color="admin.role === 'Super Admin' ? 'error' : 'primary'"
                    variant="tonal"
                    size="small"
                  >
                    {{ admin.role }}
                  </v-chip>
                </td>
                <td>
                  <v-chip
                    :color="admin.statusColor"
                    variant="tonal"
                    size="small"
                  >
                    {{ admin.status }}
                  </v-chip>
                </td>
                <td>{{ admin.lastLogin }}</td>
                <td>
                  <div class="d-flex justify-center gap-1">
                    <!-- <v-btn
                      v-if="canAccess('chat', 'read')"
                      icon
                      size="small"
                      variant="text"
                      color="info"
                      @click="startChat(admin)"
                      title="Start Chat"
                    >
                      <v-icon>mdi-chat</v-icon>
                    </v-btn> -->
                    <v-btn
                      v-if="hasPermission('admin-update')"
                      icon
                      size="small"
                      variant="text"
                      color="primary"
                      @click="editAdmin(admin)"
                      title="Edit"
                    >
                      <v-icon>mdi-pencil</v-icon>
                    </v-btn>
                    <v-btn
                      v-if="hasPermission('admin-update')"
                      icon
                      size="small"
                      variant="text"
                      :color="admin.status === 'Active' ? 'warning' : 'success'"
                      @click="toggleAdminStatus(admin)"
                      :title="admin.status === 'Active' ? 'Deactivate' : 'Activate'"
                    >
                      <v-icon>{{ admin.status === 'Active' ? 'mdi-account-off' : 'mdi-account-check' }}</v-icon>
                    </v-btn>
                    <v-btn
                      v-if="hasPermission('admin-delete')"
                      icon
                      size="small"
                      variant="text"
                      color="error"
                      @click="selectAdminToDelete(admin)"
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
              Total: {{ pagination.total }} administrators
            </div>
          </div>

          <!-- Pagination (when there are multiple pages) -->
          <div v-if="pagination && pagination.last_page > 1" class="d-flex align-center justify-space-between mt-4">
            <div class="text-body-2 text-medium-emphasis">
              Showing {{ pagination.from }} to {{ pagination.to }} of {{ pagination.total }} administrators
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
              
              <!-- Navigation -->
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

    <!-- Dialogs -->
    <v-dialog v-model="showAddDialog" max-width="600px" scrollable>
      <v-card>
        <v-card-title>Create Administrator</v-card-title>
        <v-card-text>
          <v-form>
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="adminForm.name"
                  label="Name"
                  variant="outlined"
                  required
                  placeholder="Administrator Name"
                />
              </v-col>
              
              <v-col cols="12">
                <v-text-field
                  v-model="adminForm.email"
                  label="Email"
                  variant="outlined"
                  required
                  type="email"
                  placeholder="admin@example.com"
                />
              </v-col>
              
              <v-col cols="12">
                <v-text-field
                  v-model="adminForm.password"
                  label="Password"
                  variant="outlined"
                  required
                  type="password"
                  placeholder="Minimum 8 characters"
                />
              </v-col>
              
              <v-col cols="12">
                <v-text-field
                  v-model="adminForm.password_confirmation"
                  label="Confirm Password"
                  variant="outlined"
                  required
                  type="password"
                  placeholder="Re-enter password"
                />
              </v-col>
              
              <v-col cols="12">
                <v-select
                  v-model="adminForm.role_id"
                  :items="formattedRoles"
                  item-title="name"
                  item-value="id"
                  label="Role (Optional)"
                  variant="outlined"
                  clearable
                  placeholder="Select a role"
                >
                  <template v-slot:item="{ props, item }">
                    <v-list-item v-bind="props">
                      <template v-slot:subtitle>
                        <span class="text-caption">{{ item.raw.permissionsCount }} permissions</span>
                      </template>
                    </v-list-item>
                  </template>
                </v-select>
              </v-col>
              
              <v-col cols="12">
                <v-switch
                  v-model="adminForm.is_active"
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
          <v-btn color="primary" @click="saveAdmin" :loading="saving" :disabled="saving">Create</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="showEditDialog" max-width="600px" scrollable>
      <v-card>
        <v-card-title>Edit Administrator: {{ selectedAdmin?.name }}</v-card-title>
        <v-card-text>
          <v-form>
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="adminForm.name"
                  label="Name"
                  variant="outlined"
                  required
                />
              </v-col>
              
              <v-col cols="12">
                <v-text-field
                  v-model="adminForm.email"
                  label="Email"
                  variant="outlined"
                  required
                  type="email"
                />
              </v-col>
              
              <v-col cols="12">
                <v-switch
                  v-model="adminForm.is_active"
                  label="Active"
                  color="primary"
                  hide-details
                />
              </v-col>
              
              <v-col cols="12">
                <v-alert type="info" variant="tonal" density="compact">
                  <div class="text-caption">Leave password fields empty to keep current password</div>
                </v-alert>
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
          <v-btn color="primary" @click="saveAdmin" :loading="saving" :disabled="saving">Save Changes</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="showDeleteDialog" max-width="400px">
      <v-card>
        <v-card-title>Confirm Deletion</v-card-title>
        <v-card-text>
          <p>Are you sure you want to delete this administrator?</p>
          <p><strong>{{ selectedAdmin?.name }}</strong></p>
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

    <!-- Chat Dialog -->
    <v-dialog v-model="showChatDialog" max-width="800px">
      <v-card>
        <v-card-title>Chat with {{ selectedChatAdmin?.name }}</v-card-title>
        <v-card-text>
          <p>Chat interface with the administrator...</p>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="showChatDialog = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
