<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import UiChildCard from '@/components/shared/UiChildCard.vue';

// Definir middleware de autenticação e permissões
definePageMeta({
  middleware: ['auth', 'permissions']
});

// Usar o composable de administradores
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
  pageNumbers
} = useAdmins();

// Verificar permissões
const { hasPermission, canAccess } = usePermissions();

// Estados reativos para filtros
const search = ref('');
const selectedStatus = ref('all');
const selectedRole = ref('all');
const showAddDialog = ref(false);
const showEditDialog = ref(false);
const showDeleteDialog = ref(false);
const selectedAdmin = ref<any>(null);

// Estados do chat
const showChatDialog = ref(false);
const selectedChatAdmin = ref<any>(null);

// Filtros disponíveis
const statusOptions = [
  { value: 'all', label: 'Todos os Status' },
  { value: 'Ativo', label: 'Ativo' },
  { value: 'Inativo', label: 'Inativo' }
];

const roleOptions = [
  { value: 'all', label: 'Todos os Roles' },
  { value: 'Super Admin', label: 'Super Admin' },
  { value: 'Admin', label: 'Admin' }
];

// Computed para filtrar administradores
const filteredAdmins = computed(() => {
  return formattedAdmins.value.filter(admin => {
    const matchesSearch = admin.name.toLowerCase().includes(search.value.toLowerCase()) ||
                         admin.email.toLowerCase().includes(search.value.toLowerCase());
    const matchesStatus = selectedStatus.value === 'all' || admin.status === selectedStatus.value;
    const matchesRole = selectedRole.value === 'all' || admin.role === selectedRole.value;
    
    return matchesSearch && matchesStatus && matchesRole;
  });
});

// Funções de ação
const addAdmin = () => {
  if (hasPermission('admin-create')) {
    showAddDialog.value = true;
  }
};

const editAdmin = (admin: any) => {
  if (hasPermission('admin-update')) {
    selectedAdmin.value = { ...admin };
    showEditDialog.value = true;
  }
};

const deleteAdmin = (admin: any) => {
  if (hasPermission('admin-delete')) {
    selectedAdmin.value = admin;
    showDeleteDialog.value = true;
  }
};

const confirmDelete = () => {
  if (selectedAdmin.value) {
    // Aqui você implementaria a chamada para deletar na API
    showDeleteDialog.value = false;
    selectedAdmin.value = null;
    // Recarregar administradores após deletar
    loadAdmins(pagination.value?.current_page || 1, pagination.value?.per_page || 15);
  }
};

const toggleAdminStatus = (admin: any) => {
  if (hasPermission('admin-update')) {
    // Aqui você implementaria a chamada para alterar status na API
    if (admin.status === 'Ativo') {
      admin.status = 'Inativo';
      admin.statusColor = 'error';
    } else {
      admin.status = 'Ativo';
      admin.statusColor = 'success';
    }
  }
};

// Função para iniciar chat com administrador
const startChat = async (admin: any) => {
  if (canAccess('chat', 'read')) {
    console.log('Iniciando chat com administrador:', admin);
    selectedChatAdmin.value = admin;
    showChatDialog.value = true;
  }
};

const clearFilters = () => {
  search.value = '';
  selectedStatus.value = 'all';
  selectedRole.value = 'all';
};

// Carregar administradores quando a página for montada
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
            <h1 class="text-h4 font-weight-bold">Administradores</h1>
            <p class="text-body-1 text-medium-emphasis">
              Gerencie todos os administradores do sistema
            </p>
          </div>
          <v-btn
            v-if="hasPermission('admin-create')"
            color="primary"
            prepend-icon="mdi-plus"
            @click="addAdmin"
            size="large"
          >
            Adicionar Administrador
          </v-btn>
        </div>
      </v-col>
    </v-row>

    <!-- Filtros -->
    <v-row class="mb-6">
      <v-col cols="12">
        <UiChildCard title="Filtros">
          <v-row>
            <v-col cols="12" md="4">
              <v-text-field
                v-model="search"
                label="Buscar por nome ou email"
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
                  Limpar Filtros
                </v-btn>
                <v-chip
                  color="primary"
                  variant="tonal"
                  class="ml-auto"
                >
                  {{ filteredAdmins.length }} administradores encontrados
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

    <!-- Tabela de Administradores -->
    <v-row v-else>
      <v-col cols="12">
        <UiChildCard title="Lista de Administradores">
          <v-table fixed-header height="600px">
            <thead>
              <tr>
                <th class="text-left">Administrador</th>
                <th class="text-left">Email</th>
                <th class="text-left">Role</th>
                <th class="text-left">Status</th>
                <th class="text-left">Último Login</th>
                <th class="text-left">Criado em</th>
                <th class="text-center">Ações</th>
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
                <td>{{ new Date(admin.created_at || Date.now()).toLocaleDateString('pt-BR') }}</td>
                <td>
                  <div class="d-flex justify-center gap-1">
                    <v-btn
                      v-if="canAccess('chat', 'read')"
                      icon
                      size="small"
                      variant="text"
                      color="info"
                      @click="startChat(admin)"
                      title="Iniciar Chat"
                    >
                      <v-icon>mdi-chat</v-icon>
                    </v-btn>
                    <v-btn
                      v-if="hasPermission('admin-update')"
                      icon
                      size="small"
                      variant="text"
                      color="primary"
                      @click="editAdmin(admin)"
                      title="Editar"
                    >
                      <v-icon>mdi-pencil</v-icon>
                    </v-btn>
                    <v-btn
                      v-if="hasPermission('admin-update')"
                      icon
                      size="small"
                      variant="text"
                      :color="admin.status === 'Ativo' ? 'warning' : 'success'"
                      @click="toggleAdminStatus(admin)"
                      :title="admin.status === 'Ativo' ? 'Desativar' : 'Ativar'"
                    >
                      <v-icon>{{ admin.status === 'Ativo' ? 'mdi-account-off' : 'mdi-account-check' }}</v-icon>
                    </v-btn>
                    <v-btn
                      v-if="hasPermission('admin-delete')"
                      icon
                      size="small"
                      variant="text"
                      color="error"
                      @click="deleteAdmin(admin)"
                      title="Excluir"
                    >
                      <v-icon>mdi-delete</v-icon>
                    </v-btn>
                  </div>
                </td>
              </tr>
            </tbody>
          </v-table>

          <!-- Paginação -->
          <div v-if="pagination" class="d-flex align-center justify-space-between mt-4">
            <div class="text-body-2 text-medium-emphasis">
              Mostrando {{ pagination.from }} a {{ pagination.to }} de {{ pagination.total }} administradores
            </div>
            
            <div class="d-flex align-center gap-2">
              <!-- Itens por página -->
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
                title="Página anterior"
              >
                <v-icon>mdi-chevron-left</v-icon>
              </v-btn>
              
              <!-- Números das páginas -->
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
                title="Próxima página"
              >
                <v-icon>mdi-chevron-right</v-icon>
              </v-btn>
            </div>
          </div>
        </UiChildCard>
      </v-col>
    </v-row>

    <!-- Diálogos (placeholder) -->
    <v-dialog v-model="showAddDialog" max-width="600px">
      <v-card>
        <v-card-title>Adicionar Administrador</v-card-title>
        <v-card-text>
          <p>Formulário para adicionar novo administrador...</p>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="showAddDialog = false">Cancelar</v-btn>
          <v-btn color="primary">Salvar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="showEditDialog" max-width="600px">
      <v-card>
        <v-card-title>Editar Administrador</v-card-title>
        <v-card-text>
          <p>Formulário para editar administrador...</p>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="showEditDialog = false">Cancelar</v-btn>
          <v-btn color="primary">Salvar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="showDeleteDialog" max-width="400px">
      <v-card>
        <v-card-title>Confirmar Exclusão</v-card-title>
        <v-card-text>
          <p>Tem certeza que deseja excluir este administrador?</p>
          <p><strong>{{ selectedAdmin?.name }}</strong></p>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="showDeleteDialog = false">Cancelar</v-btn>
          <v-btn color="error" @click="confirmDelete">Excluir</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Chat Dialog -->
    <v-dialog v-model="showChatDialog" max-width="800px">
      <v-card>
        <v-card-title>Chat com {{ selectedChatAdmin?.name }}</v-card-title>
        <v-card-text>
          <p>Interface de chat com o administrador...</p>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="showChatDialog = false">Fechar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
