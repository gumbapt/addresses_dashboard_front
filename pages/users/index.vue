<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import UiChildCard from '@/components/shared/UiChildCard.vue';

// Define authentication middleware
definePageMeta({
  middleware: 'auth'
});

// Use the users composable
const {
  formattedUsers,
  pagination,
  loading,
  error,
  loadUsers,
  nextPage,
  prevPage,
  goToPage,
  changePerPage,
  canGoNext,
  canGoPrev,
  pageNumbers
} = useUsers();

// Reactive states for filters
const search = ref('');
const selectedStatus = ref('all');
const selectedRole = ref('all');
const selectedDepartment = ref('all');
const showAddDialog = ref(false);
const showEditDialog = ref(false);
const showDeleteDialog = ref(false);
const selectedUser = ref<any>(null);

// Chat states
const showChatDialog = ref(false);
const selectedChatUser = ref<any>(null);

// Available filters
const statusOptions = [
  { value: 'all', label: 'All Status' },
  { value: 'Ativo', label: 'Active' },
  { value: 'Pendente', label: 'Pending' }
];

const roleOptions = [
  { value: 'all', label: 'All Roles' },
  { value: 'User', label: 'User' }
];

const departmentOptions = [
  { value: 'all', label: 'All Departments' },
  { value: 'TI', label: 'IT' }
];

// Computed to filter users
const filteredUsers = computed(() => {
  return formattedUsers.value.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(search.value.toLowerCase()) ||
                         user.email.toLowerCase().includes(search.value.toLowerCase());
    const matchesStatus = selectedStatus.value === 'all' || user.status === selectedStatus.value;
    const matchesRole = selectedRole.value === 'all' || user.role === selectedRole.value;
    const matchesDepartment = selectedDepartment.value === 'all' || user.department === selectedDepartment.value;
    
    return matchesSearch && matchesStatus && matchesRole && matchesDepartment;
  });
});

// Action functions
const addUser = () => {
  showAddDialog.value = true;
};

const editUser = (user: any) => {
  selectedUser.value = { ...user };
  showEditDialog.value = true;
};

const deleteUser = (user: any) => {
  selectedUser.value = user;
  showDeleteDialog.value = true;
};

const confirmDelete = () => {
  if (selectedUser.value) {
    // Here you would implement the API call to delete
    showDeleteDialog.value = false;
    selectedUser.value = null;
    // Reload users after delete
    loadUsers(pagination.value?.current_page || 1, pagination.value?.per_page || 15);
  }
};

const toggleUserStatus = (user: any) => {
  // Here you would implement the API call to change status
  if (user.status === 'Active') {
    user.status = 'Pending';
    user.statusColor = 'warning';
  } else {
    user.status = 'Active';
    user.statusColor = 'success';
  }
};

// Function to start chat with user
const startChat = async (user: any) => {
  console.log('Starting chat with user:', user);
  selectedChatUser.value = user;
  showChatDialog.value = true;
};

const clearFilters = () => {
  search.value = '';
  selectedStatus.value = 'all';
  selectedRole.value = 'all';
  selectedDepartment.value = 'all';
};

// Load users when page is mounted
onMounted(() => {
  loadUsers();
});
</script>

<template>
  <div>
    <!-- Header -->
    <v-row class="mb-4">
      <v-col cols="12">
        <div class="d-flex align-center justify-space-between">
          <div>
            <h1 class="text-h4 font-weight-bold">Users</h1>
            <p class="text-body-1 text-medium-emphasis">
              Manage all system users
            </p>
          </div>
          <v-btn
            color="primary"
            prepend-icon="mdi-plus"
            @click="addUser"
            size="large"
          >
            Add User
          </v-btn>
        </div>
      </v-col>
    </v-row>

    <!-- Filters -->
    <v-row class="mb-6">
      <v-col cols="12">
        <UiChildCard title="Filters">
          <v-row>
            <v-col cols="12" md="3">
              <v-text-field
                v-model="search"
                label="Search by name or email"
                prepend-inner-icon="mdi-magnify"
                variant="outlined"
                density="compact"
                clearable
              />
            </v-col>
            <v-col cols="12" md="3">
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
            <v-col cols="12" md="3">
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
            <v-col cols="12" md="3">
              <v-select
                v-model="selectedDepartment"
                :items="departmentOptions"
                item-title="label"
                item-value="value"
                label="Department"
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
                  {{ filteredUsers.length }} users found
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

    <!-- Users Table -->
    <v-row v-else>
      <v-col cols="12">
        <UiChildCard title="Users List">
          <v-table fixed-header height="600px">
            <thead>
              <tr>
                <th class="text-left">User</th>
                <th class="text-left">Email</th>
                <th class="text-left">Role</th>
                <th class="text-left">Department</th>
                <th class="text-left">Status</th>
                <th class="text-left">Last Login</th>
                <th class="text-left">Created At</th>
                <th class="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in filteredUsers" :key="user.id">
                <td>
                  <div class="d-flex align-center">
                    <v-avatar size="40" class="mr-3">
                      <img :src="user.avatar" :alt="user.name" />
                    </v-avatar>
                    <div>
                      <div class="font-weight-medium">{{ user.name }}</div>
                      <div class="text-caption text-medium-emphasis">{{ user.phone }}</div>
                    </div>
                  </div>
                </td>
                <td>{{ user.email }}</td>
                <td>
                  <v-chip
                    :color="user.role === 'Admin' ? 'error' : user.role === 'Manager' ? 'warning' : user.role === 'Editor' ? 'info' : 'default'"
                    variant="tonal"
                    size="small"
                  >
                    {{ user.role }}
                  </v-chip>
                </td>
                <td>{{ user.department }}</td>
                <td>
                  <v-chip
                    :color="user.statusColor"
                    variant="tonal"
                    size="small"
                  >
                    {{ user.status }}
                  </v-chip>
                </td>
                <td>{{ user.lastLogin }}</td>
                <td>{{ new Date(user.created_at).toLocaleDateString('pt-BR') }}</td>
                <td>
                  <div class="d-flex justify-center gap-1">
                    <v-btn
                      icon
                      size="small"
                      variant="text"
                      color="info"
                      @click="startChat(user)"
                      title="Start Chat"
                    >
                      <v-icon>mdi-chat</v-icon>
                    </v-btn>
                    <v-btn
                      icon
                      size="small"
                      variant="text"
                      color="primary"
                      @click="editUser(user)"
                      title="Edit"
                    >
                      <v-icon>mdi-pencil</v-icon>
                    </v-btn>
                    <v-btn
                      icon
                      size="small"
                      variant="text"
                      :color="user.status === 'Active' ? 'warning' : 'success'"
                      @click="toggleUserStatus(user)"
                      :title="user.status === 'Active' ? 'Deactivate' : 'Activate'"
                    >
                      <v-icon>{{ user.status === 'Active' ? 'mdi-account-off' : 'mdi-account-check' }}</v-icon>
                    </v-btn>
                    <v-btn
                      icon
                      size="small"
                      variant="text"
                      color="error"
                      @click="deleteUser(user)"
                      title="Delete"
                    >
                      <v-icon>mdi-delete</v-icon>
                    </v-btn>
                  </div>
                </td>
              </tr>
            </tbody>
          </v-table>

          <!-- Pagination -->
          <div v-if="pagination" class="d-flex align-center justify-space-between mt-4">
            <div class="text-body-2 text-medium-emphasis">
              Showing {{ pagination.from }} to {{ pagination.to }} of {{ pagination.total }} users
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

    <!-- Add User Dialog -->
    <v-dialog v-model="showAddDialog" max-width="600px">
      <v-card>
        <v-card-title class="text-h5">
          Add New User
        </v-card-title>
        <v-card-text>
          <p class="text-body-2 text-medium-emphasis">
            User addition form will be implemented here.
          </p>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="grey-darken-1"
            variant="text"
            @click="showAddDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            @click="showAddDialog = false"
          >
            Add
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Edit User Dialog -->
    <v-dialog v-model="showEditDialog" max-width="600px">
      <v-card>
        <v-card-title class="text-h5">
          Edit User
        </v-card-title>
        <v-card-text>
          <p class="text-body-2 text-medium-emphasis">
            Edit form will be implemented here.
          </p>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="grey-darken-1"
            variant="text"
            @click="showEditDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            @click="showEditDialog = false"
          >
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="showDeleteDialog" max-width="400px">
      <v-card>
        <v-card-title class="text-h5">
          Confirm Deletion
        </v-card-title>
        <v-card-text>
          <p class="text-body-2">
            Are you sure you want to delete the user <strong>{{ selectedUser?.name }}</strong>?
          </p>
          <p class="text-caption text-medium-emphasis">
            This action cannot be undone.
          </p>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="grey-darken-1"
            variant="text"
            @click="showDeleteDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="error"
            @click="confirmDelete"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Chat Dialog -->
    <v-dialog v-model="showChatDialog" max-width="800px" persistent>
      <v-card class="chat-dialog-card">
        <v-card-title class="d-flex align-center justify-space-between pa-4">
          <div class="d-flex align-center gap-3">
            <v-avatar size="40" color="primary">
              <v-icon>mdi-account</v-icon>
            </v-avatar>
            <div>
              <div class="text-h6">Chat with {{ selectedChatUser?.name }}</div>
              <div class="text-caption text-medium-emphasis">{{ selectedChatUser?.email }}</div>
            </div>
          </div>
          <v-btn
            icon
            variant="text"
            @click="showChatDialog = false"
            title="Close"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        
        <v-card-text class="chat-dialog-content pa-0">
          <ChatInterface 
            v-if="selectedChatUser"
            :initial-chat="null"
            :initial-user="selectedChatUser"
            @close="showChatDialog = false"
          />
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
.chat-dialog-card {
  height: 600px;
  display: flex;
  flex-direction: column;
}

.chat-dialog-content {
  flex: 1;
  overflow: hidden;
}
</style> 