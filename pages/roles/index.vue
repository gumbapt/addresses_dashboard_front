<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import UiChildCard from '@/components/shared/UiChildCard.vue';

// Definir middleware de autenticação e permissões
definePageMeta({
  middleware: ['auth', 'permissions']
});

// Usar o composable de roles
const {
  formattedRoles,
  loading,
  error,
  loadRoles
} = useRoles();

// Usar o composable de permissions disponíveis
const {
  permissions: availablePermissions,
  loading: loadingPermissions,
  groupedPermissions,
  loadPermissions,
  formatResourceName
} = useAvailablePermissions();

// Verificar permissões
const { hasPermission, canAccess } = usePermissions();

// Estados reativos para filtros
const search = ref('');
const selectedStatus = ref('all');
const showAddDialog = ref(false);
const showEditDialog = ref(false);
const showDeleteDialog = ref(false);
const showPermissionsDialog = ref(false);
const selectedRole = ref<any>(null);

// Estados do formulário de role
const roleForm = ref({
  name: '',
  slug: '',
  description: '',
  is_active: true,
  selectedPermissions: [] as number[]
});

// Filtros disponíveis
const statusOptions = [
  { value: 'all', label: 'Todos os Status' },
  { value: 'Ativo', label: 'Ativo' },
  { value: 'Inativo', label: 'Inativo' }
];

// Computed para filtrar roles
const filteredRoles = computed(() => {
  return formattedRoles.value.filter(role => {
    const matchesSearch = role.name.toLowerCase().includes(search.value.toLowerCase()) ||
                         role.description.toLowerCase().includes(search.value.toLowerCase());
    const matchesStatus = selectedStatus.value === 'all' || role.status === selectedStatus.value;
    
    return matchesSearch && matchesStatus;
  });
});

// Funções de ação
const addRole = async () => {
  if (hasPermission('role-create')) {
    // Resetar formulário
    roleForm.value = {
      name: '',
      slug: '',
      description: '',
      is_active: true,
      selectedPermissions: []
    };
    
    // Carregar permissões disponíveis se ainda não carregou
    if (availablePermissions.value.length === 0) {
      await loadPermissions();
    }
    
    showAddDialog.value = true;
  }
};

const editRole = async (role: any) => {
  if (hasPermission('role-update')) {
    selectedRole.value = { ...role };
    
    // Preencher formulário com dados do role
    roleForm.value = {
      name: role.name,
      slug: role.slug,
      description: role.description,
      is_active: role.is_active,
      selectedPermissions: role.permissions ? role.permissions.map((p: any) => p.id) : []
    };
    
    // Carregar permissões disponíveis se ainda não carregou
    if (availablePermissions.value.length === 0) {
      await loadPermissions();
    }
    
    showEditDialog.value = true;
  }
};

const deleteRole = (role: any) => {
  if (hasPermission('role-delete')) {
    selectedRole.value = role;
    showDeleteDialog.value = true;
  }
};

const viewPermissions = (role: any) => {
  selectedRole.value = role;
  showPermissionsDialog.value = true;
};

const confirmDelete = () => {
  if (selectedRole.value) {
    // Aqui você implementaria a chamada para deletar na API
    showDeleteDialog.value = false;
    selectedRole.value = null;
    // Recarregar roles após deletar
    loadRoles();
  }
};

const toggleRoleStatus = (role: any) => {
  if (hasPermission('role-update')) {
    // Aqui você implementaria a chamada para alterar status na API
    if (role.status === 'Ativo') {
      role.status = 'Inativo';
      role.statusColor = 'error';
    } else {
      role.status = 'Ativo';
      role.statusColor = 'success';
    }
  }
};

const clearFilters = () => {
  search.value = '';
  selectedStatus.value = 'all';
};

// Função para salvar role (criar ou editar)
const saveRole = async () => {
  // Aqui você implementaria a chamada para API
  console.log('Salvando role:', roleForm.value);
  
  // Fechar diálogo
  showAddDialog.value = false;
  showEditDialog.value = false;
  
  // Recarregar roles
  await loadRoles();
};

// Carregar roles quando a página for montada
onMounted(() => {
  loadRoles();
});
</script>

<template>
  <div>
    <!-- Header -->
    <v-row class="mb-4">
      <v-col cols="12">
        <div class="d-flex align-center justify-space-between">
          <div>
            <h1 class="text-h4 font-weight-bold">Roles</h1>
            <p class="text-body-1 text-medium-emphasis">
              Gerencie roles e permissões do sistema
            </p>
          </div>
          <v-btn
            v-if="hasPermission('role-create')"
            color="primary"
            prepend-icon="mdi-plus"
            @click="addRole"
            size="large"
          >
            Criar Role
          </v-btn>
        </div>
      </v-col>
    </v-row>

    <!-- Filtros -->
    <v-row class="mb-6">
      <v-col cols="12">
        <UiChildCard title="Filtros">
          <v-row>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="search"
                label="Buscar por nome ou descrição"
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
                  Limpar Filtros
                </v-btn>
                <v-chip
                  color="primary"
                  variant="tonal"
                  class="ml-auto"
                >
                  {{ filteredRoles.length }} roles encontrados
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

    <!-- Tabela de Roles -->
    <v-row v-else>
      <v-col cols="12">
        <UiChildCard title="Lista de Roles">
          <v-table fixed-header height="600px">
            <thead>
              <tr>
                <th class="text-left">Nome</th>
                <th class="text-left">Descrição</th>
                <th class="text-left">Permissões</th>
                <th class="text-left">Status</th>
                <th class="text-left">Criado em</th>
                <th class="text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="role in filteredRoles" :key="role.id">
                <td>
                  <div class="font-weight-medium">{{ role.name }}</div>
                </td>
                <td>{{ role.description }}</td>
                <td>
                  <v-chip
                    color="info"
                    variant="tonal"
                    size="small"
                  >
                    {{ role.permissionsCount }} permissões
                  </v-chip>
                </td>
                <td>
                  <v-chip
                    :color="role.statusColor"
                    variant="tonal"
                    size="small"
                  >
                    {{ role.status }}
                  </v-chip>
                </td>
                <td>{{ role.createdDate }}</td>
                <td>
                  <div class="d-flex justify-center gap-1">
                    <v-btn
                      icon
                      size="small"
                      variant="text"
                      color="info"
                      @click="viewPermissions(role)"
                      title="Ver Permissões"
                    >
                      <v-icon>mdi-eye</v-icon>
                    </v-btn>
                    <v-btn
                      v-if="hasPermission('role-update')"
                      icon
                      size="small"
                      variant="text"
                      color="primary"
                      @click="editRole(role)"
                      title="Editar"
                    >
                      <v-icon>mdi-pencil</v-icon>
                    </v-btn>
                    <v-btn
                      v-if="hasPermission('role-update')"
                      icon
                      size="small"
                      variant="text"
                      :color="role.status === 'Ativo' ? 'warning' : 'success'"
                      @click="toggleRoleStatus(role)"
                      :title="role.status === 'Ativo' ? 'Desativar' : 'Ativar'"
                    >
                      <v-icon>{{ role.status === 'Ativo' ? 'mdi-toggle-switch-off' : 'mdi-toggle-switch' }}</v-icon>
                    </v-btn>
                    <v-btn
                      v-if="hasPermission('role-delete')"
                      icon
                      size="small"
                      variant="text"
                      color="error"
                      @click="deleteRole(role)"
                      title="Excluir"
                    >
                      <v-icon>mdi-delete</v-icon>
                    </v-btn>
                  </div>
                </td>
              </tr>
            </tbody>
          </v-table>

          <!-- Info sobre total de roles -->
          <div class="d-flex justify-end mt-4">
            <div class="text-body-2 text-medium-emphasis">
              Total: {{ formattedRoles.length }} roles
            </div>
          </div>
        </UiChildCard>
      </v-col>
    </v-row>

    <!-- Diálogos -->
    <v-dialog v-model="showAddDialog" max-width="900px" scrollable>
      <v-card>
        <v-card-title>Criar Role</v-card-title>
        <v-card-text>
          <v-form>
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="roleForm.name"
                  label="Nome do Role"
                  variant="outlined"
                  required
                  placeholder="Ex: Manager"
                />
              </v-col>
              
              <v-col cols="12">
                <v-text-field
                  v-model="roleForm.slug"
                  label="Slug"
                  variant="outlined"
                  required
                  placeholder="Ex: manager"
                  hint="Identificador único (letras minúsculas e hífens)"
                />
              </v-col>
              
              <v-col cols="12">
                <v-textarea
                  v-model="roleForm.description"
                  label="Descrição"
                  variant="outlined"
                  rows="3"
                  placeholder="Descreva o propósito deste role..."
                />
              </v-col>
              
              <v-col cols="12">
                <v-switch
                  v-model="roleForm.is_active"
                  label="Role Ativo"
                  color="primary"
                  hide-details
                />
              </v-col>
              
              <v-col cols="12">
                <h3 class="mb-4">Selecionar Permissões</h3>
                
                <div v-if="loadingPermissions" class="text-center py-4">
                  <v-progress-circular indeterminate color="primary"></v-progress-circular>
                  <p class="mt-2">Carregando permissões...</p>
                </div>
                
                <div v-else>
                  <div v-for="(perms, resource) in groupedPermissions" :key="resource" class="mb-4">
                    <h4 class="mb-2">{{ formatResourceName(resource) }}</h4>
                    <v-row>
                      <v-col 
                        v-for="permission in perms" 
                        :key="permission.id"
                        cols="12" sm="6" md="4"
                      >
                        <v-checkbox
                          v-model="roleForm.selectedPermissions"
                          :value="permission.id"
                          :label="permission.name"
                          hide-details
                          density="compact"
                        >
                          <template v-slot:label>
                            <div>
                              <div class="font-weight-medium">{{ permission.name }}</div>
                              <div class="text-caption text-medium-emphasis">{{ permission.description }}</div>
                            </div>
                          </template>
                        </v-checkbox>
                      </v-col>
                    </v-row>
                    <v-divider class="mt-3" />
                  </div>
                </div>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-chip color="info" variant="tonal">
            {{ roleForm.selectedPermissions.length }} permissões selecionadas
          </v-chip>
          <v-spacer></v-spacer>
          <v-btn @click="showAddDialog = false">Cancelar</v-btn>
          <v-btn color="primary" @click="saveRole">Criar Role</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="showEditDialog" max-width="900px" scrollable>
      <v-card>
        <v-card-title>Editar Role: {{ selectedRole?.name }}</v-card-title>
        <v-card-text>
          <v-form>
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="roleForm.name"
                  label="Nome do Role"
                  variant="outlined"
                  required
                />
              </v-col>
              
              <v-col cols="12">
                <v-text-field
                  v-model="roleForm.slug"
                  label="Slug"
                  variant="outlined"
                  required
                  hint="Identificador único (letras minúsculas e hífens)"
                />
              </v-col>
              
              <v-col cols="12">
                <v-textarea
                  v-model="roleForm.description"
                  label="Descrição"
                  variant="outlined"
                  rows="3"
                />
              </v-col>
              
              <v-col cols="12">
                <v-switch
                  v-model="roleForm.is_active"
                  label="Role Ativo"
                  color="primary"
                  hide-details
                />
              </v-col>
              
              <v-col cols="12">
                <h3 class="mb-4">Selecionar Permissões</h3>
                
                <div v-if="loadingPermissions" class="text-center py-4">
                  <v-progress-circular indeterminate color="primary"></v-progress-circular>
                  <p class="mt-2">Carregando permissões...</p>
                </div>
                
                <div v-else>
                  <div v-for="(perms, resource) in groupedPermissions" :key="resource" class="mb-4">
                    <h4 class="mb-2">{{ formatResourceName(resource) }}</h4>
                    <v-row>
                      <v-col 
                        v-for="permission in perms" 
                        :key="permission.id"
                        cols="12" sm="6" md="4"
                      >
                        <v-checkbox
                          v-model="roleForm.selectedPermissions"
                          :value="permission.id"
                          :label="permission.name"
                          hide-details
                          density="compact"
                        >
                          <template v-slot:label>
                            <div>
                              <div class="font-weight-medium">{{ permission.name }}</div>
                              <div class="text-caption text-medium-emphasis">{{ permission.description }}</div>
                            </div>
                          </template>
                        </v-checkbox>
                      </v-col>
                    </v-row>
                    <v-divider class="mt-3" />
                  </div>
                </div>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-chip color="info" variant="tonal">
            {{ roleForm.selectedPermissions.length }} permissões selecionadas
          </v-chip>
          <v-spacer></v-spacer>
          <v-btn @click="showEditDialog = false">Cancelar</v-btn>
          <v-btn color="primary" @click="saveRole">Salvar Alterações</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="showDeleteDialog" max-width="400px">
      <v-card>
        <v-card-title>Confirmar Exclusão</v-card-title>
        <v-card-text>
          <p>Tem certeza que deseja excluir este role?</p>
          <p><strong>{{ selectedRole?.name }}</strong></p>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="showDeleteDialog = false">Cancelar</v-btn>
          <v-btn color="error" @click="confirmDelete">Excluir</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Diálogo de Permissões -->
    <v-dialog v-model="showPermissionsDialog" max-width="800px">
      <v-card>
        <v-card-title>Permissões do Role: {{ selectedRole?.name }}</v-card-title>
        <v-card-text>
          <div v-if="selectedRole">
            <p><strong>Descrição:</strong> {{ selectedRole.description }}</p>
            <p><strong>Total de Permissões:</strong> {{ selectedRole.permissionsCount }}</p>
            
            <div v-if="selectedRole.permissions && selectedRole.permissions.length > 0" class="mt-4">
              <h4>Lista de Permissões:</h4>
              <div class="permissions-grid">
                <v-chip 
                  v-for="permission in selectedRole.permissions" 
                  :key="permission.id"
                  :color="permission.is_active ? 'primary' : 'grey'"
                  class="mr-2 mb-2"
                >
                  {{ permission.name }} ({{ permission.slug }})
                </v-chip>
              </div>
            </div>
            <div v-else>
              <p>Nenhuma permissão encontrada para este role.</p>
            </div>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="showPermissionsDialog = false">Fechar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
.permissions-grid {
  max-height: 300px;
  overflow-y: auto;
}
</style>
