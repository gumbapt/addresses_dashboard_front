<template>
  <div class="us-date-picker-wrapper">
    <v-text-field
      :model-value="isoValue"
      :label="label"
      type="date"
      :variant="variant"
      :density="density"
      :clearable="clearable"
      :prepend-inner-icon="prependInnerIcon"
      :disabled="disabled"
      :required="required"
      :hint="hint"
      :persistent-hint="persistentHint"
      @update:model-value="handleDateChange"
      @click:clear="handleClear"
      class="us-date-picker-field"
    />
    <div v-if="isoValue" class="us-date-display">
      {{ formatDateUS(isoValue) }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

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

// ISO value for the date input (YYYY-MM-DD)
const isoValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});

// Format date to US format (MM/DD/YYYY) for display
const formatDateUS = (isoDate: string): string => {
  if (!isoDate) return '';
  try {
    const [year, month, day] = isoDate.split('-');
    if (year && month && day) {
      return `${month}/${day}/${year}`;
    }
    return isoDate;
  } catch (e) {
    return isoDate;
  }
};

// Handle date change from the date picker
const handleDateChange = (value: string | null) => {
  isoValue.value = value;
};

// Handle clear button
const handleClear = () => {
  isoValue.value = null;
};
</script>

<style scoped>
.us-date-picker-wrapper {
  position: relative;
}

.us-date-picker-field {
  position: relative;
}

.us-date-display {
  position: absolute;
  left: 56px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  color: rgba(var(--v-theme-on-surface), 0.87);
  font-size: 0.875rem;
  z-index: 1;
  background: rgba(var(--v-theme-surface), 1);
  padding: 0 2px;
  height: 20px;
  display: flex;
  align-items: center;
  line-height: 1.5;
  white-space: nowrap;
  font-weight: 400;
  margin-top: 1px;
}

.us-date-picker-field :deep(.v-field__input) {
  position: relative;
}

.us-date-picker-field :deep(input[type="date"]) {
  color: transparent !important;
  caret-color: rgba(var(--v-theme-on-surface), 0.87);
}

.us-date-picker-field :deep(input[type="date"]:focus) {
  color: transparent !important;
}

.us-date-picker-field :deep(input[type="date"]::-webkit-calendar-picker-indicator) {
  cursor: pointer;
  z-index: 2;
  position: relative;
  opacity: 1;
}
</style>

