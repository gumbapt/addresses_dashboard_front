<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import type { DomainGroup } from '~/types/api';

// Props
interface Props {
  modelValue: number | null;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  showNone?: boolean;
  noneLabel?: string;
  hint?: string;
  error?: string;
}

const props = withDefaults(defineProps<Props>(), {
  label: 'Domain Group',
  required: false,
  disabled: false,
  showNone: true,
  noneLabel: 'No Group',
  hint: '',
  error: ''
});

// Emits
const emit = defineEmits<{
  (e: 'update:modelValue', value: number | null): void;
}>();

// Use domain groups composable
const { formattedGroups, availableGroups, loading, loadDomainGroups } = useDomainGroups();

// Computed: options for select
const groupOptions = computed(() => {
  const options: Array<{ value: number | null; title: string; subtitle?: string; disabled?: boolean }> = [];
  
  if (props.showNone) {
    options.push({
      value: null,
      title: props.noneLabel
    });
  }
  
  formattedGroups.value.forEach((group: any) => {
    const title = group.name;
    const subtitle = group.max_domains 
      ? `${group.limitLabel}${group.isFull ? ' - FULL' : ''}`
      : 'Unlimited';
    
    options.push({
      value: group.id,
      title,
      subtitle,
      disabled: group.isFull || !group.is_active
    });
  });
  
  return options;
});

// Computed: selected group info
const selectedGroup = computed(() => {
  if (!props.modelValue) return null;
  return formattedGroups.value.find((g: any) => g.id === props.modelValue);
});

// Methods
const updateValue = (value: number | null | string) => {
  const numValue = value === null || value === '' ? null : Number(value);
  emit('update:modelValue', numValue);
};

// Load groups on mount
onMounted(() => {
  loadDomainGroups({ per_page: 100 });
});
</script>

<template>
  <v-select
    :model-value="modelValue"
    @update:model-value="updateValue"
    :items="groupOptions"
    item-title="title"
    item-value="value"
    :label="label"
    :required="required"
    :disabled="disabled || loading"
    :loading="loading"
    :hint="hint"
    :error-messages="error"
    variant="outlined"
    clearable
    persistent-hint
  >
    <template v-slot:item="{ props: itemProps, item }">
      <v-list-item
        v-bind="itemProps"
        :disabled="item.raw.disabled"
      >
        <template v-slot:title>
          {{ item.raw.title }}
        </template>
        <template v-slot:subtitle v-if="item.raw.subtitle">
          <span :class="item.raw.disabled ? 'text-error' : 'text-medium-emphasis'">
            {{ item.raw.subtitle }}
          </span>
        </template>
        <template v-slot:append v-if="item.raw.disabled">
          <v-chip size="x-small" color="warning" variant="tonal">
            {{ item.raw.subtitle?.includes('FULL') ? 'FULL' : 'Inactive' }}
          </v-chip>
        </template>
      </v-list-item>
    </template>
    
    <template v-slot:selection="{ item }">
      <div v-if="item.value">
        <span class="font-weight-medium">{{ item.title }}</span>
        <span v-if="selectedGroup" class="text-caption text-medium-emphasis ml-2">
          ({{ selectedGroup.limitLabel }})
        </span>
      </div>
      <span v-else class="text-medium-emphasis">
        {{ item.title }}
      </span>
    </template>
    
    <template v-slot:prepend-inner v-if="selectedGroup">
      <v-icon :color="selectedGroup.isFull ? 'warning' : 'primary'">
        mdi-folder-outline
      </v-icon>
    </template>
  </v-select>
</template>

