<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import type { Domain } from '~/types/api';

// Props
interface Props {
  groupId: number;
  groupName: string;
  onSuccess?: () => void;
}

const props = defineProps<Props>();

// Composables
const { domains, loadDomains } = useDomains();
const { addDomainsToGroup } = useDomainGroups();
const notification = useNotification();
const confirmDialog = useConfirmDialog();

// State
const selectedDomainIds = ref<number[]>([]);
const loading = ref(false);
const saving = ref(false);

// Computed: available domains (not in current group or can be moved)
const availableDomains = computed(() => {
  return domains.value.filter((domain: any) => {
    // Show all domains - user can move from other groups
    return true;
  });
});

// Computed: domains grouped by their current group
const domainsByGroup = computed(() => {
  const grouped: Record<string, any[]> = {
    'No Group': [],
    'Other Groups': []
  };
  
  availableDomains.value.forEach((domain: any) => {
    if (!domain.domain_group_id) {
      grouped['No Group'].push(domain);
    } else if (domain.domain_group_id !== props.groupId) {
      grouped['Other Groups'].push(domain);
    }
  });
  
  return grouped;
});

// Computed: check if any selected domains are from other groups
const willMoveDomains = computed(() => {
  return selectedDomainIds.value.some(id => {
    const domain = availableDomains.value.find((d: any) => d.id === id);
    return domain && domain.domain_group_id && domain.domain_group_id !== props.groupId;
  });
});

// Computed: count of domains that will be moved
const movedDomainsCount = computed(() => {
  return selectedDomainIds.value.filter(id => {
    const domain = availableDomains.value.find((d: any) => d.id === id);
    return domain && domain.domain_group_id && domain.domain_group_id !== props.groupId;
  }).length;
});

// Methods
const toggleDomain = (domainId: number) => {
  const index = selectedDomainIds.value.indexOf(domainId);
  if (index > -1) {
    selectedDomainIds.value.splice(index, 1);
  } else {
    selectedDomainIds.value.push(domainId);
  }
};

const selectAll = (groupKey: string) => {
  const domainsInGroup = domainsByGroup.value[groupKey] || [];
  domainsInGroup.forEach((domain: any) => {
    if (!selectedDomainIds.value.includes(domain.id)) {
      selectedDomainIds.value.push(domain.id);
    }
  });
};

const deselectAll = () => {
  selectedDomainIds.value = [];
};

const addSelectedDomains = async () => {
  if (selectedDomainIds.value.length === 0) {
    notification.warning('Please select at least one domain');
    return;
  }
  
  // Show warning if moving domains
  if (willMoveDomains.value) {
    const confirmed = await confirmDialog.warning(
      `<p><strong>${movedDomainsCount.value} domain(s) will be MOVED</strong> from their current groups.</p>` +
      `<p class="mt-2">Do you want to continue?</p>`,
      '⚠️ Domain Move Warning'
    );
    
    if (!confirmed) return;
  }
  
  saving.value = true;
  
  try {
    const result = await addDomainsToGroup(props.groupId, selectedDomainIds.value);
    
    if (result.success) {
      // Check if domains were moved
      if (result.data?.domains_moved > 0) {
        const movedDomains = result.data.moved_from || [];
        const movedNames = movedDomains.map((d: any) => d.domain_name).join(', ');
        const sourceGroups = [...new Set(movedDomains.map((d: any) => d.current_group_name))].join(', ');
        
        notification.warning(
          `${result.data.domains_moved} domain(s) were moved from: ${sourceGroups}`
        );
      }
      
      notification.success(result.message || 'Domains added successfully');
      
      // Clear selection
      selectedDomainIds.value = [];
      
      // Callback
      if (props.onSuccess) {
        props.onSuccess();
      }
      
      // Reload domains
      await loadDomains();
    } else {
      notification.error(result.error || 'Failed to add domains');
    }
  } catch (error) {
    notification.error(error instanceof Error ? error.message : 'Unexpected error');
  } finally {
    saving.value = false;
  }
};

// Load domains on mount
onMounted(async () => {
  loading.value = true;
  await loadDomains(); // Load all domains
  loading.value = false;
});
</script>

<template>
  <div class="batch-domain-selector">
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
    
    <v-card-title class="d-flex align-center justify-space-between px-0">
      <span>Add Domains to {{ groupName }}</span>
      <div>
        <v-btn
          size="small"
          variant="text"
          @click="deselectAll"
          :disabled="selectedDomainIds.length === 0"
        >
          Clear Selection
        </v-btn>
      </div>
    </v-card-title>

    <v-card-text class="px-0">
      <v-alert v-if="loading" type="info" variant="tonal">
        <v-progress-circular indeterminate size="20" class="mr-2"></v-progress-circular>
        Loading domains...
      </v-alert>

      <div v-else>
        <!-- Warning about moving domains -->
        <v-alert
          v-if="willMoveDomains"
          type="warning"
          variant="tonal"
          density="compact"
          class="mb-4"
        >
          <strong>⚠️ Warning:</strong> {{ movedDomainsCount }} domain(s) will be MOVED from their current groups.
        </v-alert>

        <!-- Domains from No Group -->
        <div v-if="domainsByGroup['No Group'].length > 0" class="mb-4">
          <div class="d-flex align-center justify-space-between mb-2">
            <h4 class="text-subtitle-1">
              <v-icon size="small" class="mr-1">mdi-folder-open-outline</v-icon>
              Ungrouped Domains ({{ domainsByGroup['No Group'].length }})
            </h4>
            <v-btn
              size="x-small"
              variant="text"
              color="primary"
              @click="selectAll('No Group')"
            >
              Select All
            </v-btn>
          </div>
          
          <v-list density="compact" class="domain-list">
            <v-list-item
              v-for="domain in domainsByGroup['No Group']"
              :key="domain.id"
              @click="toggleDomain(domain.id)"
              class="cursor-pointer"
            >
              <template v-slot:prepend>
                <v-checkbox
                  :model-value="selectedDomainIds.includes(domain.id)"
                  @click.stop="toggleDomain(domain.id)"
                  hide-details
                  density="compact"
                />
              </template>
              <v-list-item-title>{{ domain.name }}</v-list-item-title>
              <v-list-item-subtitle>{{ domain.domain_url }}</v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </div>

        <!-- Domains from Other Groups -->
        <div v-if="domainsByGroup['Other Groups'].length > 0">
          <div class="d-flex align-center justify-space-between mb-2">
            <h4 class="text-subtitle-1">
              <v-icon size="small" class="mr-1" color="warning">mdi-folder-swap-outline</v-icon>
              Domains in Other Groups ({{ domainsByGroup['Other Groups'].length }})
            </h4>
            <v-btn
              size="x-small"
              variant="text"
              color="warning"
              @click="selectAll('Other Groups')"
            >
              Select All
            </v-btn>
          </div>
          
          <v-alert type="info" variant="tonal" density="compact" class="mb-2">
            These domains will be MOVED from their current groups
          </v-alert>
          
          <v-list density="compact" class="domain-list">
            <v-list-item
              v-for="domain in domainsByGroup['Other Groups']"
              :key="domain.id"
              @click="toggleDomain(domain.id)"
              class="cursor-pointer"
            >
              <template v-slot:prepend>
                <v-checkbox
                  :model-value="selectedDomainIds.includes(domain.id)"
                  @click.stop="toggleDomain(domain.id)"
                  hide-details
                  density="compact"
                  color="warning"
                />
              </template>
              <v-list-item-title>{{ domain.name }}</v-list-item-title>
              <v-list-item-subtitle>
                {{ domain.domain_url }}
                <v-chip
                  v-if="domain.domainGroup"
                  size="x-small"
                  color="warning"
                  variant="outlined"
                  class="ml-2"
                >
                  Currently in: {{ domain.domainGroup.name }}
                </v-chip>
              </v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </div>

        <!-- Empty state -->
        <v-alert
          v-if="availableDomains.length === 0"
          type="info"
          variant="tonal"
        >
          No domains available. All domains are already in this group.
        </v-alert>
      </div>
    </v-card-text>

    <v-card-actions class="px-0">
      <v-chip
        color="info"
        variant="tonal"
      >
        {{ selectedDomainIds.length }} domain(s) selected
      </v-chip>
      <v-spacer></v-spacer>
      <v-btn
        color="primary"
        @click="addSelectedDomains"
        :loading="saving"
        :disabled="saving || selectedDomainIds.length === 0 || loading"
      >
        Add Selected Domains
      </v-btn>
    </v-card-actions>
  </div>
</template>

<style scoped>
.batch-domain-selector {
  max-height: 600px;
}

.domain-list {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 4px;
}

.cursor-pointer {
  cursor: pointer;
}

.cursor-pointer:hover {
  background-color: rgba(0, 0, 0, 0.04);
}
</style>

