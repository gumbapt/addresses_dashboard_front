<template>
  <v-dialog 
    v-model="isOpen" 
    max-width="500" 
    persistent
  >
    <v-card>
      <!-- Header -->
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

      <!-- Content -->
      <v-card-text class="pt-4 pb-3">
        <div class="text-body-1" v-html="message"></div>
      </v-card-text>

      <v-divider></v-divider>

      <!-- Actions -->
      <v-card-actions class="pa-4">
        <v-spacer></v-spacer>
        
        <!-- Cancel button (only show if not alert-only) -->
        <v-btn
          v-if="type !== 'alert'"
          variant="outlined"
          color="grey"
          @click="handleCancel"
          :disabled="loading"
        >
          {{ cancelText }}
        </v-btn>

        <!-- Confirm/OK button -->
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
import { ref, computed, watch } from 'vue';

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
  switch (props.type) {
    case 'warning':
      return 'mdi-alert';
    case 'danger':
      return 'mdi-alert-circle';
    case 'success':
      return 'mdi-check-circle';
    case 'info':
      return 'mdi-information';
    case 'alert':
      return 'mdi-information';
    case 'confirm':
    default:
      return 'mdi-help-circle';
  }
});

const iconColor = computed(() => {
  switch (props.type) {
    case 'warning':
      return 'warning';
    case 'danger':
      return 'error';
    case 'success':
      return 'success';
    case 'info':
      return 'info';
    case 'alert':
      return 'info';
    case 'confirm':
    default:
      return 'primary';
  }
});

const confirmButtonColor = computed(() => {
  switch (props.type) {
    case 'danger':
      return 'error';
    case 'warning':
      return 'warning';
    case 'success':
      return 'success';
    default:
      return 'primary';
  }
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
.v-card-title {
  font-size: 1.25rem;
  font-weight: 600;
}

.v-card-text {
  font-size: 1rem;
  line-height: 1.5;
}

/* HTML content styling */
.v-card-text :deep(p) {
  margin-bottom: 0.5rem;
}

.v-card-text :deep(p:last-child) {
  margin-bottom: 0;
}

.v-card-text :deep(strong) {
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
}

.v-card-text :deep(.mt-2) {
  margin-top: 0.5rem;
}

.v-card-text :deep(.text-warning) {
  color: rgb(var(--v-theme-warning));
}

.v-card-text :deep(.text-error) {
  color: rgb(var(--v-theme-error));
}

.v-card-text :deep(.text-success) {
  color: rgb(var(--v-theme-success));
}
</style>

