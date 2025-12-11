<template>
  <v-menu
    v-model="menu"
    :close-on-content-click="false"
    transition="scale-transition"
    offset-y
    min-width="auto"
  >
    <template v-slot:activator="{ props: menuProps }">
      <v-text-field
        :model-value="displayValue"
        :label="label"
        :variant="variant"
        :density="density"
        :clearable="clearable"
        :prepend-inner-icon="prependInnerIcon"
        :append-inner-icon="'mdi-calendar'"
        :disabled="disabled"
        :required="required"
        :hint="hint"
        :persistent-hint="persistentHint"
        readonly
        v-bind="menuProps"
        @click:clear="handleClear"
        @click:append-inner="menu = true"
        @click="menu = true"
        class="us-date-picker-field"
      />
    </template>
    <v-date-picker
      v-model="datePickerValue"
      locale="en"
      :first-day-of-week="0"
      @update:model-value="handleDateSelect"
    />
  </v-menu>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

interface Props {
  modelValue: string | null;
  label?: string;
  variant?: 'outlined' | 'plain' | 'filled' | 'underlined' | 'solo' | 'solo-inverted' | 'solo-filled';
  density?: 'default' | 'comfortable' | 'compact';
  clearable?: boolean;
  prependInnerIcon?: string;
  disabled?: boolean;
  required?: boolean;
  hint?: string;
  persistentHint?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  label: 'Date',
  variant: 'outlined' as const,
  density: 'compact' as const,
  clearable: true,
  prependInnerIcon: 'mdi-calendar',
  disabled: false,
  required: false,
  persistentHint: false
});

const emit = defineEmits<{
  'update:modelValue': [value: string | null];
}>();

const menu = ref(false);
const datePickerValue = computed({
  get: () => props.modelValue,
  set: (value) => {
    emit('update:modelValue', value);
  }
});

// Format date to US format (MM/DD/YYYY) for display
const formatDateUS = (value: string | null | Date | any): string => {
  if (!value) return '';
  try {
    let dateStr: string = '';
    
    // Handle Date objects
    if (value instanceof Date) {
      const year = value.getFullYear();
      const month = String(value.getMonth() + 1).padStart(2, '0');
      const day = String(value.getDate()).padStart(2, '0');
      return `${month}/${day}/${year}`;
    }
    
    // Handle string values
    if (typeof value === 'string') {
      // If it contains GMT or looks like a date string, parse it
      if (value.includes('GMT') || value.includes('T') || value.length > 10) {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          return `${month}/${day}/${year}`;
        }
        return '';
      }
      // Handle ISO format (YYYY-MM-DD)
      const [year, month, day] = value.split('-');
      if (year && month && day && year.length === 4) {
        return `${month}/${day}/${year}`;
      }
      return value;
    }
    
    return '';
  } catch (e) {
    return '';
  }
};

// Display value in US format
const displayValue = computed(() => {
  if (!props.modelValue) return '';
  const formatted = formatDateUS(props.modelValue);
  return formatted || '';
});

// Handle date selection from picker
const handleDateSelect = (value: string | null) => {
  datePickerValue.value = value;
  menu.value = false;
};

// Handle clear button
const handleClear = () => {
  datePickerValue.value = null;
  emit('update:modelValue', null);
};
</script>

