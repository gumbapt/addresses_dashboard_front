<script setup lang="ts">
import { computed, ref, reactive } from 'vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import UiChildCard from '@/components/shared/UiChildCard.vue';

// Define authentication middleware
definePageMeta({
  middleware: ['auth']
});

// Get user data and permissions
const { user } = useAuth();
const { roles, permissions, isSuperAdmin } = usePermissions();

// Change password
const { loading: changingPassword, error: passwordError, errors: passwordErrors, changePassword, clearErrors } = useChangePassword();
const notification = useNotification();

const passwordForm = reactive({
  current_password: '',
  new_password: '',
  new_password_confirmation: ''
});

const showPasswordForm = ref(false);
const passwordSuccess = ref(false);

const validatePasswordForm = () => {
  clearErrors();
  let isValid = true;
  
  if (!passwordForm.current_password) {
    isValid = false;
  }
  
  if (!passwordForm.new_password) {
    isValid = false;
  } else if (passwordForm.new_password.length < 8) {
    isValid = false;
  }
  
  if (!passwordForm.new_password_confirmation) {
    isValid = false;
  } else if (passwordForm.new_password !== passwordForm.new_password_confirmation) {
    isValid = false;
  }
  
  return isValid;
};

const handleChangePassword = async () => {
  passwordSuccess.value = false;
  clearErrors();
  
  if (!validatePasswordForm()) {
    notification.warning('Please fill in all fields correctly');
    return;
  }
  
  const result = await changePassword(
    passwordForm.current_password,
    passwordForm.new_password,
    passwordForm.new_password_confirmation
  );
  
  if (result.success) {
    passwordSuccess.value = true;
    notification.success('Password changed successfully!');
    
    // Clear form after 2 seconds
    setTimeout(() => {
      resetPasswordForm();
      passwordSuccess.value = false;
    }, 2000);
  } else {
    if (passwordError.value) {
      notification.error(passwordError.value);
    } else {
      notification.error('Error changing password. Please check the fields and try again.');
    }
  }
};

const resetPasswordForm = () => {
  passwordForm.current_password = '';
  passwordForm.new_password = '';
  passwordForm.new_password_confirmation = '';
  clearErrors();
  passwordSuccess.value = false;
};

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

      <!-- Change Password - Highlighted Section -->
      <v-col cols="12">
        <UiParentCard title="Change Password" class="border-primary">
          <v-row>
            <v-col cols="12" md="8">
              <v-form @submit.prevent="handleChangePassword">
                <!-- Current Password -->
                <v-text-field
                  v-model="passwordForm.current_password"
                  label="Current Password"
                  type="password"
                  variant="outlined"
                  density="compact"
                  prepend-inner-icon="mdi-lock"
                  :error-messages="passwordErrors.current_password"
                  :disabled="changingPassword"
                  class="mb-3"
                />
                
                <!-- New Password -->
                <v-text-field
                  v-model="passwordForm.new_password"
                  label="New Password"
                  type="password"
                  variant="outlined"
                  density="compact"
                  prepend-inner-icon="mdi-lock-plus"
                  :error-messages="passwordErrors.new_password"
                  :disabled="changingPassword"
                  hint="Minimum 8 characters"
                  persistent-hint
                  class="mb-3"
                />
                
                <!-- Confirm New Password -->
                <v-text-field
                  v-model="passwordForm.new_password_confirmation"
                  label="Confirm New Password"
                  type="password"
                  variant="outlined"
                  density="compact"
                  prepend-inner-icon="mdi-lock-check"
                  :error-messages="passwordErrors.new_password_confirmation"
                  :disabled="changingPassword"
                  class="mb-4"
                />
                
                <!-- Success Message -->
                <v-alert
                  v-if="passwordSuccess"
                  type="success"
                  variant="tonal"
                  class="mb-4"
                >
                  Password changed successfully!
                </v-alert>
                
                <!-- Error Message -->
                <v-alert
                  v-if="passwordError && !passwordSuccess"
                  type="error"
                  variant="tonal"
                  class="mb-4"
                >
                  {{ passwordError }}
                </v-alert>
                
                <!-- Actions -->
                <div class="d-flex gap-2">
                  <v-btn
                    type="submit"
                    color="primary"
                    :loading="changingPassword"
                    :disabled="changingPassword"
                  >
                    <v-icon start>mdi-key</v-icon>
                    Change Password
                  </v-btn>
                  <v-btn
                    variant="outlined"
                    @click="resetPasswordForm"
                    :disabled="changingPassword"
                  >
                    Reset
                  </v-btn>
                </div>
              </v-form>
            </v-col>
            <v-col cols="12" md="4">
              <v-card variant="tonal" color="info" class="pa-4">
                <v-card-title class="text-h6 mb-2">
                  <v-icon class="mr-2">mdi-information</v-icon>
                  Password Requirements
                </v-card-title>
                <v-card-text>
                  <ul class="text-body-2">
                    <li>Minimum 8 characters</li>
                    <li>Current password required</li>
                    <li>New password must be confirmed</li>
                    <li>Password change is immediate</li>
                  </ul>
                </v-card-text>
              </v-card>
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
        <UiParentCard title="Change Password">
          <v-form @submit.prevent="handleChangePassword">
            <!-- Current Password -->
            <v-text-field
              v-model="passwordForm.current_password"
              label="Current Password"
              type="password"
              variant="outlined"
              density="compact"
              prepend-inner-icon="mdi-lock"
              :error-messages="passwordErrors.current_password"
              :disabled="changingPassword"
              class="mb-3"
            />
            
            <!-- New Password -->
            <v-text-field
              v-model="passwordForm.new_password"
              label="New Password"
              type="password"
              variant="outlined"
              density="compact"
              prepend-inner-icon="mdi-lock-plus"
              :error-messages="passwordErrors.new_password"
              :disabled="changingPassword"
              hint="Minimum 8 characters"
              persistent-hint
              class="mb-3"
            />
            
            <!-- Confirm New Password -->
            <v-text-field
              v-model="passwordForm.new_password_confirmation"
              label="Confirm New Password"
              type="password"
              variant="outlined"
              density="compact"
              prepend-inner-icon="mdi-lock-check"
              :error-messages="passwordErrors.new_password_confirmation"
              :disabled="changingPassword"
              class="mb-4"
            />
            
            <!-- Success Message -->
            <v-alert
              v-if="passwordSuccess"
              type="success"
              variant="tonal"
              class="mb-4"
            >
              Password changed successfully!
            </v-alert>
            
            <!-- Error Message -->
            <v-alert
              v-if="passwordError && !passwordSuccess"
              type="error"
              variant="tonal"
              class="mb-4"
            >
              {{ passwordError }}
            </v-alert>
            
            <!-- Actions -->
            <div class="d-flex gap-2">
              <v-btn
                type="submit"
                color="primary"
                :loading="changingPassword"
                :disabled="changingPassword"
              >
                <v-icon start>mdi-key</v-icon>
                Change Password
              </v-btn>
              <v-btn
                variant="outlined"
                @click="resetPasswordForm"
                :disabled="changingPassword"
              >
                Reset
              </v-btn>
            </div>
          </v-form>
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

