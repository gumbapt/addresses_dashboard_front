<template>
  <div class="us-date-picker-wrapper">
    <VueDatePicker
      v-model="dateValue"
      format="MM/dd/yyyy"
      :locale="enUS"
      :enable-time-picker="false"
      :clearable="clearable"
      :disabled="disabled"
      :placeholder="label"
      auto-apply
      :teleport="true"
      @update:model-value="handleDateChange"
      @cleared="handleClear"
    >
      <template #trigger>
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
          @click:clear="handleClear"
          class="us-date-picker-field"
        />
      </template>
    </VueDatePicker>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { VueDatePicker } from '@vuepic/vue-datepicker';
import { enUS } from 'date-fns/locale';
import '@vuepic/vue-datepicker/dist/main.css';

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

// Normalize value to ISO format (YYYY-MM-DD)
const normalizeToISO = (value: string | null | Date | any): string | null => {
  if (!value) return null;
  
  try {
    // If it's already in ISO format (YYYY-MM-DD), return as is
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return value;
    }
    
    // Convert Date object or date string to ISO
    const date = value instanceof Date ? value : new Date(value);
    if (!isNaN(date.getTime())) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    
    return null;
  } catch (e) {
    return null;
  }
};

// Convert ISO to Date object for VueDatePicker
const dateValue = computed({
  get: () => {
    const isoValue = normalizeToISO(props.modelValue);
    if (!isoValue) return null;
    return new Date(isoValue);
  },
  set: (value: Date | null) => {
    if (!value) {
      emit('update:modelValue', null);
      return;
    }
    const isoValue = normalizeToISO(value);
    emit('update:modelValue', isoValue);
  }
});

// Format date to US format (MM/DD/YYYY) for display
const formatDateUS = (value: string | null | Date | any): string => {
  if (!value) return '';
  try {
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

// Handle date change from picker
const handleDateChange = (value: Date | null) => {
  if (!value) {
    emit('update:modelValue', null);
    return;
  }
  const isoValue = normalizeToISO(value);
  emit('update:modelValue', isoValue);
};

// Handle clear button
const handleClear = () => {
  emit('update:modelValue', null);
};
</script>

<style scoped>
.us-date-picker-wrapper {
  position: relative;
}

.us-date-picker-field {
  cursor: pointer;
}

/* Hide the default VueDatePicker input, we use v-text-field instead */
:deep(.dp__input_wrap) {
  display: none;
}

/* Style the calendar popup to match Vuetify */
:deep(.dp__menu) {
  border-radius: 4px;
  box-shadow: 0px 5px 5px -3px rgba(0, 0, 0, 0.2), 0px 8px 10px 1px rgba(0, 0, 0, 0.14), 0px 3px 14px 2px rgba(0, 0, 0, 0.12);
  z-index: 2000;
}

:deep(.dp__calendar_header_item) {
  font-weight: 500;
}

:deep(.dp__today) {
  border: 1px solid rgba(var(--v-theme-primary), 0.5);
}

:deep(.dp__active_date) {
  background-color: rgb(var(--v-theme-primary));
  color: white;
}
</style>
