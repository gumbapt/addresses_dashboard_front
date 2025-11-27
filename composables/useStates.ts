import { ref } from 'vue';
import type { State } from '~/types/api';
import { getApiConfig } from '~/config/api';

export interface StatesResponse {
  success: boolean;
  data: State[];
  message?: string;
}

export const useStates = () => {
  const states = ref<State[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  /**
   * Fetch states from API
   * Note: This endpoint is public and doesn't require authentication
   * The endpoint is /api/states (not /api/admin/states)
   */
  const fetchStates = async () => {
    loading.value = true;
    error.value = null;

    try {
      // Get base URL and construct the public endpoint URL
      const config = getApiConfig();
      // baseURL is like "http://localhost:8007/api/admin"
      // We need "http://localhost:8007/api/states"
      const baseURL = config.baseURL.replace('/admin', '');
      const url = `${baseURL}/states`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: StatesResponse = await response.json();

      if (data.success && data.data) {
        // Filter only active states
        states.value = data.data.filter((state: any) => state.is_active !== false);
      } else {
        error.value = data.message || 'Failed to load states';
        states.value = [];
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unexpected error loading states';
      states.value = [];
    } finally {
      loading.value = false;
    }
  };

  return {
    states,
    loading,
    error,
    fetchStates
  };
};

