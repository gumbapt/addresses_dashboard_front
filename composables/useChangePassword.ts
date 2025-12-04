import { ref, readonly } from 'vue';
import { ApiClient } from '~/infrastructure/http/ApiClient';

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
  new_password_confirmation: string;
}

export interface ChangePasswordResponse {
  success: boolean;
  message: string;
  data?: {
    id: number;
    name: string;
    email: string;
    is_active: boolean;
    is_super_admin: boolean;
    last_login_at: string | null;
    created_at: string;
    updated_at: string;
  };
}

export interface ChangePasswordErrors {
  current_password?: string[];
  new_password?: string[];
  new_password_confirmation?: string[];
}

export const useChangePassword = () => {
  const loading = ref(false);
  const error = ref<string | null>(null);
  const errors = ref<ChangePasswordErrors>({});
  
  const apiClient = new ApiClient();

  const changePassword = async (
    currentPassword: string,
    newPassword: string,
    newPasswordConfirmation: string
  ): Promise<ChangePasswordResponse> => {
    loading.value = true;
    error.value = null;
    errors.value = {};
    
    try {
      const requestData: ChangePasswordRequest = {
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirmation: newPasswordConfirmation
      };
      
      const response = await apiClient.post<ChangePasswordResponse>(
        '/change-password',
        requestData
      );
      
      if (response.success) {
        return response;
      } else {
        error.value = response.message || 'Error changing password';
        return response;
      }
    } catch (err: any) {
      // ApiClient throws Error, so we need to check the message
      const errorMessage = err instanceof Error ? err.message : 'Error changing password. Please try again.';
      
      // Check if it's incorrect current password error (401)
      if (errorMessage.includes('401') || errorMessage.toLowerCase().includes('incorrect') || errorMessage.toLowerCase().includes('unauthorized')) {
        error.value = 'Current password is incorrect';
        errors.value.current_password = ['Current password is incorrect'];
        return {
          success: false,
          message: 'Current password is incorrect'
        };
      }
      
      // Check if it's validation error (422)
      if (errorMessage.includes('422') || errorMessage.toLowerCase().includes('validation') || errorMessage.toLowerCase().includes('invalid')) {
        // Try to extract errors from message if possible
        error.value = errorMessage;
        return {
          success: false,
          message: errorMessage
        };
      }
      
      error.value = errorMessage;
      return {
        success: false,
        message: errorMessage
      };
    } finally {
      loading.value = false;
    }
  };

  const clearErrors = () => {
    error.value = null;
    errors.value = {};
  };

  return {
    loading: readonly(loading),
    error: readonly(error),
    errors: readonly(errors),
    changePassword,
    clearErrors
  };
};

