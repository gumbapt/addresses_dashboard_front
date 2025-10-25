import { ref, readonly } from 'vue';
import { AuthService } from '~/services/AuthService';

export const useRoleDomainPermissions = () => {
  const roleDomains = ref<any[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  
  const authService = new AuthService();

  const loadRoleDomains = async (roleId: number) => {
    loading.value = true;
    error.value = null;
    
    try {
      const result = await authService.getRoleDomains(roleId);
      
      if (result.success && result.data) {
        roleDomains.value = result.data.domains || [];
      } else {
        error.value = result.error || 'Failed to load role domains';
        roleDomains.value = [];
      }
    } catch (err) {
      error.value = 'Unexpected error loading role domains';
      roleDomains.value = [];
    } finally {
      loading.value = false;
    }
  };

  const assignDomains = async (roleId: number, domainIds: number[], canView: boolean, canEdit: boolean) => {
    try {
      const result = await authService.assignDomainsToRole({
        role_id: roleId,
        domain_ids: domainIds,
        permissions: {
          can_view: canView,
          can_edit: canEdit
        }
      });
      
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to assign domains'
      };
    }
  };

  const revokeDomains = async (roleId: number, domainIds: number[]) => {
    try {
      const result = await authService.revokeDomainsFromRole({
        role_id: roleId,
        domain_ids: domainIds
      });
      
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to revoke domains'
      };
    }
  };

  return {
    roleDomains: readonly(roleDomains),
    loading: readonly(loading),
    error: readonly(error),
    loadRoleDomains,
    assignDomains,
    revokeDomains
  };
};

