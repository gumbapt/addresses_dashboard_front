# 🚀 Frontend Implementation Guide - Complete Domain Groups System

## Context
This is a **Nuxt 3 + Vue 3 + Vuetify 3 + TypeScript** admin dashboard with CRUD operations, role-based permissions, and real-time features.

---

## Architecture Pattern

### 1. **Layered Architecture**
```
📁 Project Structure:
├── types/api.d.ts                          # TypeScript interfaces
├── infrastructure/repositories/            # API communication layer
├── services/                               # Business logic layer
├── composables/                            # State management (Vue composables)
├── components/                             # Reusable UI components
└── pages/                                  # Page views
```

### 2. **Data Flow**
```
Page Component
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

## Implementation Steps

### Step 1: Define TypeScript Interfaces

**File:** `types/api.d.ts`

```typescript
// Define your main entity
export interface DomainGroup {
  id: number;
  name: string;
  slug: string;
  description?: string;
  is_active: boolean;
  max_domains?: number | null;
  settings?: Record<string, any>;
  created_by?: number;
  updated_by?: number;
  created_at: string;
  updated_at: string;
  
  // Relationships (when included)
  domains?: Domain[];
  domains_count?: number;
  available_domains?: number | null;
  has_reached_limit?: boolean;
}

// List response format
export interface DomainGroupsListResponse {
  success: boolean;
  data: DomainGroup[];
  pagination?: Pagination;
  message?: string;
}

// Single item response
export interface DomainGroupResponse {
  success: boolean;
  data: DomainGroup;
  message?: string;
}

// Create request
export interface CreateDomainGroupRequest {
  name: string;
  description?: string;
  is_active: boolean;
  max_domains?: number | null;
  settings?: Record<string, any>;
}

// Update request
export interface UpdateDomainGroupRequest {
  name?: string;
  description?: string;
  is_active?: boolean;
  max_domains?: number | null;
  settings?: Record<string, any>;
}

// Generic API response
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
```

---

### Step 2: Create Repository (API Layer)

**File:** `infrastructure/repositories/DomainGroupRepository.ts`

```typescript
import { ApiClient } from '~/infrastructure/http/ApiClient';
import type {
  DomainGroup,
  DomainGroupsListResponse,
  DomainGroupResponse,
  CreateDomainGroupRequest,
  UpdateDomainGroupRequest,
  ApiResponse
} from '~/types/api';

export class DomainGroupRepository {
  private apiClient: ApiClient;

  constructor() {
    this.apiClient = new ApiClient();
  }

  /**
   * List all domain groups with optional filters
   */
  async list(params?: {
    page?: number;
    per_page?: number;
    search?: string;
    is_active?: boolean;
  }): Promise<DomainGroupsListResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
      if (params?.search) queryParams.append('search', params.search);
      if (params?.is_active !== undefined) queryParams.append('is_active', params.is_active.toString());
      
      // Request with count for table display
      queryParams.append('with_count', 'true');
      
      const url = `/domain-groups${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      return await this.apiClient.get<DomainGroupsListResponse>(url);
    } catch (error) {
      console.error('DomainGroupRepository - list error:', error);
      throw error;
    }
  }

  /**
   * Get specific domain group
   */
  async get(id: number): Promise<DomainGroupResponse> {
    try {
      return await this.apiClient.get<DomainGroupResponse>(`/domain-groups/${id}`);
    } catch (error) {
      console.error('DomainGroupRepository - get error:', error);
      throw error;
    }
  }

  /**
   * Create new domain group
   */
  async create(data: CreateDomainGroupRequest): Promise<DomainGroupResponse> {
    try {
      return await this.apiClient.post<DomainGroupResponse>('/domain-groups', data);
    } catch (error) {
      console.error('DomainGroupRepository - create error:', error);
      throw error;
    }
  }

  /**
   * Update existing domain group
   */
  async update(id: number, data: UpdateDomainGroupRequest): Promise<DomainGroupResponse> {
    try {
      return await this.apiClient.put<DomainGroupResponse>(`/domain-groups/${id}`, data);
    } catch (error) {
      console.error('DomainGroupRepository - update error:', error);
      throw error;
    }
  }

  /**
   * Delete domain group
   */
  async delete(id: number): Promise<ApiResponse<void>> {
    try {
      return await this.apiClient.delete<ApiResponse<void>>(`/domain-groups/${id}`);
    } catch (error) {
      console.error('DomainGroupRepository - delete error:', error);
      throw error;
    }
  }

  /**
   * Get domains in a specific group
   */
  async getGroupDomains(id: number): Promise<any> {
    try {
      const response = await this.apiClient.get<any>(`/domain-groups/${id}/domains`);
      return response;
    } catch (error) {
      console.error('DomainGroupRepository - getGroupDomains error:', error);
      throw error;
    }
  }

  /**
   * Batch: Add multiple domains to a group
   */
  async addDomainsToGroup(id: number, domainIds: number[]): Promise<ApiResponse<any>> {
    try {
      return await this.apiClient.post<ApiResponse<any>>(
        `/domain-groups/${id}/domains`,
        { domain_ids: domainIds }
      );
    } catch (error) {
      console.error('DomainGroupRepository - addDomainsToGroup error:', error);
      throw error;
    }
  }

  /**
   * Batch: Remove multiple domains from a group
   */
  async removeDomainsFromGroup(id: number, domainIds: number[]): Promise<ApiResponse<any>> {
    try {
      return await this.apiClient.deleteWithBody<ApiResponse<any>>(
        `/domain-groups/${id}/domains`, 
        { domain_ids: domainIds }
      );
    } catch (error) {
      console.error('DomainGroupRepository - removeDomainsFromGroup error:', error);
      throw error;
    }
  }
}
```

---

### Step 3: Create Service (Business Logic Layer)

**File:** `services/DomainGroupService.ts`

```typescript
import { DomainGroupRepository } from '~/infrastructure/repositories/DomainGroupRepository';
import type {
  DomainGroup,
  CreateDomainGroupRequest,
  UpdateDomainGroupRequest,
  ApiResponse,
  Domain
} from '~/types/api';

export class DomainGroupService {
  private domainGroupRepository: DomainGroupRepository;

  constructor() {
    this.domainGroupRepository = new DomainGroupRepository();
  }

  /**
   * Get all domain groups with optional filters
   */
  async getDomainGroups(filters?: {
    page?: number;
    per_page?: number;
    search?: string;
    is_active?: boolean;
  }): Promise<ApiResponse<{ data: DomainGroup[]; pagination: any }>> {
    try {
      const response = await this.domainGroupRepository.list(filters);
      
      return {
        success: response.success,
        data: {
          data: response.data || [],
          pagination: response.pagination
        }
      };
    } catch (error) {
      console.error('DomainGroupService - getDomainGroups error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch domain groups'
      };
    }
  }

  /**
   * Get specific domain group
   */
  async getDomainGroup(id: number): Promise<ApiResponse<DomainGroup>> {
    try {
      const response = await this.domainGroupRepository.get(id);
      
      if (response.success && response.data) {
        return {
          success: true,
          data: response.data
        };
      }
      
      return {
        success: false,
        error: 'Failed to fetch domain group'
      };
    } catch (error) {
      console.error('DomainGroupService - getDomainGroup error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch domain group'
      };
    }
  }

  /**
   * Create new domain group
   */
  async createDomainGroup(data: CreateDomainGroupRequest): Promise<ApiResponse<DomainGroup>> {
    try {
      const response = await this.domainGroupRepository.create(data);
      
      if (response.success && response.data) {
        return {
          success: true,
          data: response.data,
          message: response.message || 'Domain group created successfully'
        };
      }
      
      return {
        success: false,
        error: response.message || 'Failed to create domain group'
      };
    } catch (error) {
      console.error('DomainGroupService - createDomainGroup error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create domain group'
      };
    }
  }

  /**
   * Update existing domain group
   */
  async updateDomainGroup(id: number, data: UpdateDomainGroupRequest): Promise<ApiResponse<DomainGroup>> {
    try {
      const response = await this.domainGroupRepository.update(id, data);
      
      if (response.success && response.data) {
        return {
          success: true,
          data: response.data,
          message: response.message || 'Domain group updated successfully'
        };
      }
      
      return {
        success: false,
        error: response.message || 'Failed to update domain group'
      };
    } catch (error) {
      console.error('DomainGroupService - updateDomainGroup error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update domain group'
      };
    }
  }

  /**
   * Delete domain group
   */
  async deleteDomainGroup(id: number): Promise<ApiResponse<void>> {
    try {
      const response = await this.domainGroupRepository.delete(id);
      
      if (response.success) {
        return {
          success: true,
          message: 'Domain group deleted successfully'
        };
      }
      
      return {
        success: false,
        error: 'Failed to delete domain group'
      };
    } catch (error) {
      console.error('DomainGroupService - deleteDomainGroup error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete domain group'
      };
    }
  }

  /**
   * Get domains in a specific group
   */
  async getGroupDomains(id: number): Promise<ApiResponse<Domain[]>> {
    try {
      const response = await this.domainGroupRepository.getGroupDomains(id);
      
      // Handle API response format: { success: true, data: { domains: [...] } }
      if (response.success) {
        const domains = response.data?.domains || [];
        
        return {
          success: true,
          data: domains
        };
      }
      
      return {
        success: false,
        error: response.message || 'Failed to fetch group domains'
      };
    } catch (error) {
      console.error('DomainGroupService - getGroupDomains error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch group domains'
      };
    }
  }

  /**
   * Add multiple domains to a group (Batch operation)
   */
  async addDomainsToGroup(groupId: number, domainIds: number[]): Promise<ApiResponse<any>> {
    try {
      const response = await this.domainGroupRepository.addDomainsToGroup(groupId, domainIds);
      
      if (response.success) {
        return {
          success: true,
          data: response.data,
          message: response.message || 'Domains added to group successfully'
        };
      }
      
      return {
        success: false,
        error: response.message || 'Failed to add domains to group'
      };
    } catch (error) {
      console.error('DomainGroupService - addDomainsToGroup error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add domains to group'
      };
    }
  }

  /**
   * Remove multiple domains from a group (Batch operation)
   */
  async removeDomainsFromGroup(groupId: number, domainIds: number[]): Promise<ApiResponse<any>> {
    try {
      const response = await this.domainGroupRepository.removeDomainsFromGroup(groupId, domainIds);
      
      if (response.success) {
        return {
          success: true,
          data: response.data,
          message: response.message || 'Domains removed from group successfully'
        };
      }
      
      return {
        success: false,
        error: response.message || 'Failed to remove domains from group'
      };
    } catch (error) {
      console.error('DomainGroupService - removeDomainsFromGroup error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to remove domains from group'
      };
    }
  }
}
```

---

### Step 4: Create Composable (State Management)

**File:** `composables/useDomainGroups.ts`

```typescript
import { ref, computed } from 'vue';
import { DomainGroupService } from '~/services/DomainGroupService';
import type { DomainGroup, CreateDomainGroupRequest, UpdateDomainGroupRequest, ApiResponse } from '~/types/api';

export const useDomainGroups = () => {
  // Reactive states
  const domainGroups = ref<DomainGroup[]>([]);
  const pagination = ref<any>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Service instance
  const domainGroupService = new DomainGroupService();

  // Computed: formatted groups for display
  const formattedGroups = computed(() => {
    return domainGroups.value.map(group => ({
      ...group,
      statusLabel: group.is_active ? 'Active' : 'Inactive',
      statusColor: group.is_active ? 'success' : 'error',
      domainsCount: group.domains_count || 0,
      limitLabel: group.max_domains 
        ? `${group.domains_count || 0}/${group.max_domains}`
        : 'Unlimited',
      availableSlots: group.max_domains 
        ? (group.max_domains - (group.domains_count || 0))
        : null,
      isFull: group.has_reached_limit || false,
      createdDate: new Date(group.created_at).toLocaleDateString('en-US'),
      updatedDate: new Date(group.updated_at).toLocaleDateString('en-US')
    }));
  });

  /**
   * Load domain groups
   */
  const loadDomainGroups = async (
    page: number = 1,
    perPage: number = 15,
    search?: string,
    isActive?: boolean
  ) => {
    loading.value = true;
    error.value = null;

    try {
      const result = await domainGroupService.getDomainGroups({
        page,
        per_page: perPage,
        search,
        is_active: isActive
      });

      if (result.success && result.data) {
        domainGroups.value = result.data.data;
        pagination.value = result.data.pagination;
      } else {
        error.value = result.error || 'Failed to load domain groups';
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unexpected error';
    } finally {
      loading.value = false;
    }
  };

  /**
   * Create domain group
   */
  const createDomainGroup = async (data: CreateDomainGroupRequest): Promise<ApiResponse<DomainGroup>> => {
    return await domainGroupService.createDomainGroup(data);
  };

  /**
   * Update domain group
   */
  const updateDomainGroup = async (id: number, data: UpdateDomainGroupRequest): Promise<ApiResponse<DomainGroup>> => {
    return await domainGroupService.updateDomainGroup(id, data);
  };

  /**
   * Delete domain group
   */
  const deleteDomainGroup = async (id: number): Promise<ApiResponse<void>> => {
    return await domainGroupService.deleteDomainGroup(id);
  };

  /**
   * Get domains in a group
   */
  const getGroupDomains = async (id: number) => {
    return await domainGroupService.getGroupDomains(id);
  };

  /**
   * Add domains to group
   */
  const addDomainsToGroup = async (groupId: number, domainIds: number[]) => {
    return await domainGroupService.addDomainsToGroup(groupId, domainIds);
  };

  /**
   * Remove domains from group
   */
  const removeDomainsFromGroup = async (groupId: number, domainIds: number[]) => {
    return await domainGroupService.removeDomainsFromGroup(groupId, domainIds);
  };

  return {
    // State
    domainGroups,
    formattedGroups,
    pagination,
    loading,
    error,
    
    // Actions
    loadDomainGroups,
    createDomainGroup,
    updateDomainGroup,
    deleteDomainGroup,
    getGroupDomains,
    addDomainsToGroup,
    removeDomainsFromGroup
  };
};
```

---

### Step 5: Create Custom Confirm Dialog

**File:** `components/ConfirmDialog.vue`

```vue
<template>
  <v-dialog 
    v-model="isOpen" 
    max-width="500" 
    persistent
  >
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon 
          :color="iconColor" 
          class="mr-3" 
          size="28"
        >
          {{ icon }}
        </v-icon>
        <span>{{ title }}</span>
      </v-card-title>

      <v-divider></v-divider>

      <v-card-text class="pt-4 pb-3">
        <div class="text-body-1" v-html="message"></div>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions class="pa-4">
        <v-spacer></v-spacer>
        
        <v-btn
          v-if="type !== 'alert'"
          variant="outlined"
          color="grey"
          @click="handleCancel"
          :disabled="loading"
        >
          {{ cancelText }}
        </v-btn>

        <v-btn
          :color="confirmButtonColor"
          variant="flat"
          @click="handleConfirm"
          :loading="loading"
          :disabled="loading"
        >
          {{ confirmText }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  modelValue: boolean;
  title?: string;
  message: string;
  type?: 'confirm' | 'alert' | 'warning' | 'danger' | 'success' | 'info';
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Confirm',
  type: 'confirm',
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  loading: false
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'confirm'): void;
  (e: 'cancel'): void;
}>();

const isOpen = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
});

const icon = computed(() => {
  const icons = {
    warning: 'mdi-alert',
    danger: 'mdi-alert-circle',
    success: 'mdi-check-circle',
    info: 'mdi-information',
    alert: 'mdi-information',
    confirm: 'mdi-help-circle'
  };
  return icons[props.type] || icons.confirm;
});

const iconColor = computed(() => {
  const colors = {
    warning: 'warning',
    danger: 'error',
    success: 'success',
    info: 'info',
    alert: 'info',
    confirm: 'primary'
  };
  return colors[props.type] || colors.confirm;
});

const confirmButtonColor = computed(() => {
  const colors = {
    danger: 'error',
    warning: 'warning',
    success: 'success'
  };
  return colors[props.type] || 'primary';
});

const handleConfirm = () => {
  emit('confirm');
  if (!props.loading) {
    isOpen.value = false;
  }
};

const handleCancel = () => {
  if (!props.loading) {
    emit('cancel');
    isOpen.value = false;
  }
};
</script>

<style scoped>
.v-card-text :deep(p) {
  margin-bottom: 0.5rem;
}

.v-card-text :deep(strong) {
  font-weight: 600;
}

.v-card-text :deep(.mt-2) {
  margin-top: 0.5rem;
}

.v-card-text :deep(.text-warning) {
  color: rgb(var(--v-theme-warning));
}
</style>
```

**File:** `composables/useConfirmDialog.ts`

```typescript
import { ref } from 'vue';

interface ConfirmDialogOptions {
  title?: string;
  message: string;
  type?: 'confirm' | 'alert' | 'warning' | 'danger' | 'success' | 'info';
  confirmText?: string;
  cancelText?: string;
}

interface DialogState {
  isOpen: boolean;
  title: string;
  message: string;
  type: 'confirm' | 'alert' | 'warning' | 'danger' | 'success' | 'info';
  confirmText: string;
  cancelText: string;
  loading: boolean;
  resolve?: (value: boolean) => void;
}

export const useConfirmDialog = () => {
  const dialogState = ref<DialogState>({
    isOpen: false,
    title: 'Confirm',
    message: '',
    type: 'confirm',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    loading: false,
    resolve: undefined
  });

  const showDialog = (options: ConfirmDialogOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      dialogState.value = {
        isOpen: true,
        title: options.title || 'Confirm',
        message: options.message,
        type: options.type || 'confirm',
        confirmText: options.confirmText || 'Confirm',
        cancelText: options.cancelText || 'Cancel',
        loading: false,
        resolve
      };
    });
  };

  const confirm = async (message: string, title?: string): Promise<boolean> => {
    return showDialog({
      title: title || 'Confirm Action',
      message,
      type: 'confirm'
    });
  };

  const warning = async (message: string, title?: string): Promise<boolean> => {
    return showDialog({
      title: title || 'Warning',
      message,
      type: 'warning'
    });
  };

  const danger = async (message: string, title?: string): Promise<boolean> => {
    return showDialog({
      title: title || 'Danger',
      message,
      type: 'danger',
      confirmText: 'Delete'
    });
  };

  const handleConfirm = () => {
    if (dialogState.value.resolve) {
      dialogState.value.resolve(true);
    }
    dialogState.value.isOpen = false;
  };

  const handleCancel = () => {
    if (dialogState.value.resolve) {
      dialogState.value.resolve(false);
    }
    dialogState.value.isOpen = false;
  };

  return {
    dialogState,
    showDialog,
    confirm,
    warning,
    danger,
    handleConfirm,
    handleCancel
  };
};
```

---

## Best Practices & Patterns

### 1. **Always Clear Selection State**
```typescript
const addItem = () => {
  selectedItem.value = null;  // ✅ Clear before opening create dialog
  showAddDialog.value = true;
};

const saveItem = async () => {
  if (selectedItem.value) {
    // Update
  } else {
    // Create
  }
  // After success:
  selectedItem.value = null;  // ✅ Clear after save
};
```

### 2. **Debug Logging Pattern**
```typescript
console.log('🔍 Operation - description:', data);  // Use emoji for easy filtering
console.log('❌ Error:', error);  // Error logging
```

### 3. **API Response Handling**
```typescript
// Always check success flag
if (response.success && response.data) {
  // Handle nested data structures
  const items = response.data?.items || [];
}
```

### 4. **Confirm Dialogs with HTML**
```typescript
const confirmed = await confirmDialog.danger(
  `<p>Delete <strong>"${item.name}"</strong>?</p>` +
  `<p class="mt-2">This cannot be undone.</p>`,
  '🗑️ Delete Confirmation'
);

if (confirmed) {
  // Proceed
}
```

### 5. **Environment Configuration**
```typescript
// nuxt.config.ts
runtimeConfig: {
  public: {
    apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL || 'https://api.example.com',
  }
}

// Usage in composables
const config = useRuntimeConfig();
const apiUrl = config.public.apiBaseUrl;
```

---

## Common Issues & Solutions

### Issue 1: Create vs Edit Logic
**Problem:** Creating replaces last item instead of adding new one
**Solution:** Always set `selectedItem.value = null` before opening create dialog

### Issue 2: HTML Not Rendering in Dialog
**Problem:** HTML shows as text
**Solution:** Use `v-html` directive: `<div v-html="message"></div>`

### Issue 3: Absolute Paths in Build
**Problem:** Build includes local machine paths
**Solution:** Use environment variables and relative imports

### Issue 4: Domain Count Not Showing
**Problem:** API doesn't return count
**Solution:** Add `with_count=true` parameter to API requests

---

## Checklist for New Feature

- [ ] Define TypeScript interfaces in `types/api.d.ts`
- [ ] Create Repository with all CRUD methods
- [ ] Create Service with business logic and error handling
- [ ] Create Composable with state management
- [ ] Create page component with UI
- [ ] Add permission checks (if needed)
- [ ] Add menu item to sidebar
- [ ] Test create, edit, delete operations
- [ ] Add loading states
- [ ] Add error handling
- [ ] Add debug logging
- [ ] Test with real API
- [ ] Document implementation

---

## File Structure Example

```
project/
├── types/
│   └── api.d.ts
├── infrastructure/
│   └── repositories/
│       ├── DomainGroupRepository.ts
│       └── ApiClient.ts
├── services/
│   └── DomainGroupService.ts
├── composables/
│   ├── useDomainGroups.ts
│   └── useConfirmDialog.ts
├── components/
│   ├── ConfirmDialog.vue
│   └── BatchDomainSelector.vue
└── pages/
    └── domain-groups/
        └── index.vue
```

---

## Usage in Page Component

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useConfirmDialog } from '~/composables/useConfirmDialog';

const confirmDialog = useConfirmDialog();
const { 
  formattedGroups, 
  loading, 
  loadDomainGroups, 
  deleteDomainGroup 
} = useDomainGroups();

const handleDelete = async (group: any) => {
  const confirmed = await confirmDialog.danger(
    `Delete "${group.name}"?`,
    'Confirm Delete'
  );
  
  if (confirmed) {
    const result = await deleteDomainGroup(group.id);
    if (result.success) {
      await loadDomainGroups();
    }
  }
};

onMounted(() => {
  loadDomainGroups();
});
</script>

<template>
  <div>
    <!-- Include dialog -->
    <ConfirmDialog
      v-model="confirmDialog.dialogState.value.isOpen"
      :title="confirmDialog.dialogState.value.title"
      :message="confirmDialog.dialogState.value.message"
      :type="confirmDialog.dialogState.value.type"
      @confirm="confirmDialog.handleConfirm"
      @cancel="confirmDialog.handleCancel"
    />
    
    <!-- Your content -->
  </div>
</template>
```

---

## End of Implementation Guide

This prompt contains the complete pattern for implementing a full-stack CRUD feature with TypeScript, proper layering, state management, and UI components. Follow this structure for consistent, maintainable code.

