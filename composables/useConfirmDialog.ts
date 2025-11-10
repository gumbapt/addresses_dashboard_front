import { ref } from 'vue';

interface ConfirmDialogOptions {
  title?: string;
  message: string;
  type?: 'confirm' | 'alert' | 'warning' | 'danger' | 'success' | 'info';
  confirmText?: string;
  cancelText?: string;
}

interface DialogState {
  isOpen: boolean;
  title: string;
  message: string;
  type: 'confirm' | 'alert' | 'warning' | 'danger' | 'success' | 'info';
  confirmText: string;
  cancelText: string;
  loading: boolean;
  resolve?: (value: boolean) => void;
}

export const useConfirmDialog = () => {
  const dialogState = ref<DialogState>({
    isOpen: false,
    title: 'Confirm',
    message: '',
    type: 'confirm',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    loading: false,
    resolve: undefined
  });

  const showDialog = (options: ConfirmDialogOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      dialogState.value = {
        isOpen: true,
        title: options.title || 'Confirm',
        message: options.message,
        type: options.type || 'confirm',
        confirmText: options.confirmText || 'Confirm',
        cancelText: options.cancelText || 'Cancel',
        loading: false,
        resolve
      };
    });
  };

  const confirm = async (message: string, title?: string): Promise<boolean> => {
    return showDialog({
      title: title || 'Confirm Action',
      message,
      type: 'confirm',
      confirmText: 'Confirm',
      cancelText: 'Cancel'
    });
  };

  const alert = async (message: string, title?: string): Promise<boolean> => {
    return showDialog({
      title: title || 'Information',
      message,
      type: 'alert',
      confirmText: 'OK'
    });
  };

  const warning = async (message: string, title?: string): Promise<boolean> => {
    return showDialog({
      title: title || 'Warning',
      message,
      type: 'warning',
      confirmText: 'Confirm',
      cancelText: 'Cancel'
    });
  };

  const danger = async (message: string, title?: string): Promise<boolean> => {
    return showDialog({
      title: title || 'Danger',
      message,
      type: 'danger',
      confirmText: 'Delete',
      cancelText: 'Cancel'
    });
  };

  const success = async (message: string, title?: string): Promise<boolean> => {
    return showDialog({
      title: title || 'Success',
      message,
      type: 'success',
      confirmText: 'OK'
    });
  };

  const handleConfirm = () => {
    if (dialogState.value.resolve) {
      dialogState.value.resolve(true);
    }
    dialogState.value.isOpen = false;
  };

  const handleCancel = () => {
    if (dialogState.value.resolve) {
      dialogState.value.resolve(false);
    }
    dialogState.value.isOpen = false;
  };

  const setLoading = (loading: boolean) => {
    dialogState.value.loading = loading;
  };

  return {
    dialogState,
    showDialog,
    confirm,
    alert,
    warning,
    danger,
    success,
    handleConfirm,
    handleCancel,
    setLoading
  };
};

