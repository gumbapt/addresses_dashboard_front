<script setup lang="ts">
import { computed } from 'vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import UiChildCard from '@/components/shared/UiChildCard.vue';

// Define authentication middleware
definePageMeta({
  middleware: ['auth']
});

// Get user data and permissions
const { user } = useAuth();
const { roles, permissions, isSuperAdmin } = usePermissions();

// Format last login date
const formattedLastLogin = computed(() => {
  if (!user.value?.last_login_at) return 'Never';
  return new Date(user.value.last_login_at).toLocaleString('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
});

// Group permissions by resource
const permissionsByResource = computed(() => {
  const grouped: Record<string, Array<typeof permissions.value[0]>> = {};
  
  permissions.value.forEach(permission => {
    const resource = permission.resource || 'Other';
    if (!grouped[resource]) {
      grouped[resource] = [];
    }
    grouped[resource].push({ ...permission });
  });
  
  return grouped;
});

// Get all unique resources
const resources = computed(() => {
  return Object.keys(permissionsByResource.value).sort();
});
</script>

<template>
  <div class="pa-6">
    <v-row>
      <!-- User Information -->
      <v-col cols="12">
        <UiParentCard title="My Profile">
          <v-row>
            <v-col cols="12" md="6">
              <v-list lines="two" density="compact">
                <v-list-item>
                  <template v-slot:prepend>
                    <v-icon color="primary" class="mr-4">mdi-account</v-icon>
                  </template>
                  <v-list-item-title>Name</v-list-item-title>
                  <v-list-item-subtitle>{{ user?.name || 'N/A' }}</v-list-item-subtitle>
                </v-list-item>
                
                <v-list-item>
                  <template v-slot:prepend>
                    <v-icon color="primary" class="mr-4">mdi-email</v-icon>
                  </template>
                  <v-list-item-title>Email</v-list-item-title>
                  <v-list-item-subtitle>{{ user?.email || 'N/A' }}</v-list-item-subtitle>
                </v-list-item>
                
                <v-list-item>
                  <template v-slot:prepend>
                    <v-icon color="primary" class="mr-4">mdi-account-check</v-icon>
                  </template>
                  <v-list-item-title>Status</v-list-item-title>
                  <v-list-item-subtitle>
                    <v-chip 
                      :color="user?.is_active ? 'success' : 'error'" 
                      size="small"
                    >
                      {{ user?.is_active ? 'Active' : 'Inactive' }}
                    </v-chip>
                  </v-list-item-subtitle>
                </v-list-item>
              </v-list>
            </v-col>
            
            <v-col cols="12" md="6">
              <v-list lines="two" density="compact">
                <v-list-item>
                  <template v-slot:prepend>
                    <v-icon color="primary" class="mr-4">mdi-shield-crown</v-icon>
                  </template>
                  <v-list-item-title>Admin Type</v-list-item-title>
                  <v-list-item-subtitle>
                    <v-chip 
                      :color="isSuperAdmin ? 'warning' : 'info'" 
                      size="small"
                    >
                      {{ isSuperAdmin ? 'Super Admin' : 'Admin' }}
                    </v-chip>
                  </v-list-item-subtitle>
                </v-list-item>
                
                <v-list-item>
                  <template v-slot:prepend>
                    <v-icon color="primary" class="mr-4">mdi-clock-outline</v-icon>
                  </template>
                  <v-list-item-title>Last Login</v-list-item-title>
                  <v-list-item-subtitle>{{ formattedLastLogin }}</v-list-item-subtitle>
                </v-list-item>
                
                <v-list-item>
                  <template v-slot:prepend>
                    <v-icon color="primary" class="mr-4">mdi-identifier</v-icon>
                  </template>
                  <v-list-item-title>User ID</v-list-item-title>
                  <v-list-item-subtitle>{{ user?.id || 'N/A' }}</v-list-item-subtitle>
                </v-list-item>
              </v-list>
            </v-col>
          </v-row>
        </UiParentCard>
      </v-col>

      <!-- Roles -->
      <v-col cols="12" md="6">
        <UiParentCard title="Roles">
          <div v-if="roles.length === 0" class="text-center py-4">
            <v-icon size="48" color="grey">mdi-shield-off</v-icon>
            <p class="text-body-1 text-medium-emphasis mt-2">No roles assigned</p>
          </div>
          <v-list v-else lines="two" density="compact">
            <v-list-item
              v-for="role in roles"
              :key="role.id"
            >
              <template v-slot:prepend>
                <v-icon color="primary" class="mr-4">mdi-shield-account</v-icon>
              </template>
              <v-list-item-title>{{ role.name }}</v-list-item-title>
              <v-list-item-subtitle>
                <div class="mt-1">
                  <v-chip size="x-small" class="mr-1 mb-1">
                    {{ role.permissions?.length || 0 }} permissions
                  </v-chip>
                  <span class="text-caption text-medium-emphasis">{{ role.description || 'No description' }}</span>
                </div>
              </v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </UiParentCard>
      </v-col>

      <!-- Permissions Summary -->
      <v-col cols="12" md="6">
        <UiParentCard title="Permissions Summary">
          <div class="text-center py-4">
            <v-icon size="48" :color="isSuperAdmin ? 'warning' : 'primary'">
              {{ isSuperAdmin ? 'mdi-shield-crown' : 'mdi-shield-check' }}
            </v-icon>
            <p class="text-h4 mt-2">{{ permissions.length }}</p>
            <p class="text-body-1 text-medium-emphasis">Total Permissions</p>
            <v-chip 
              v-if="isSuperAdmin" 
              color="warning" 
              size="small" 
              class="mt-2"
            >
              Super Admin - All Permissions Granted
            </v-chip>
            <p v-else class="text-caption text-medium-emphasis mt-2">
              Permissions from {{ roles.length }} role(s)
            </p>
          </div>
        </UiParentCard>
      </v-col>

      <!-- Permissions by Resource -->
      <v-col cols="12">
        <UiParentCard title="Permissions by Resource">
          <div v-if="permissions.length === 0" class="text-center py-4">
            <v-icon size="48" color="grey">mdi-lock-off</v-icon>
            <p class="text-body-1 text-medium-emphasis mt-2">No permissions assigned</p>
          </div>
          <v-expansion-panels v-else variant="accordion" class="mt-2">
            <v-expansion-panel
              v-for="resource in resources"
              :key="resource"
            >
              <v-expansion-panel-title>
                <div class="d-flex align-center">
                  <v-icon color="primary" class="mr-2">mdi-folder</v-icon>
                  <span class="text-capitalize">{{ resource }}</span>
                  <v-chip size="x-small" class="ml-2">
                    {{ permissionsByResource[resource].length }}
                  </v-chip>
                </div>
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <v-list density="compact">
                  <v-list-item
                    v-for="permission in permissionsByResource[resource]"
                    :key="permission.id"
                  >
                    <template v-slot:prepend>
                      <v-icon 
                        :color="permission.is_active ? 'success' : 'error'" 
                        size="small"
                        class="mr-2"
                      >
                        {{ permission.is_active ? 'mdi-check-circle' : 'mdi-close-circle' }}
                      </v-icon>
                    </template>
                    <v-list-item-title>{{ permission.name }}</v-list-item-title>
                    <v-list-item-subtitle>
                      <div class="d-flex flex-wrap gap-1 mt-1">
                        <v-chip size="x-small" variant="outlined">
                          {{ permission.action }}
                        </v-chip>
                        <v-chip size="x-small" variant="outlined">
                          {{ permission.slug }}
                        </v-chip>
                      </div>
                      <p class="text-caption text-medium-emphasis mt-1">
                        {{ permission.description || 'No description' }}
                      </p>
                    </v-list-item-subtitle>
                  </v-list-item>
                </v-list>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </UiParentCard>
      </v-col>
    </v-row>
  </div>
</template>

