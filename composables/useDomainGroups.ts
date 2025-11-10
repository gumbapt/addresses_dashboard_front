import { ref, computed } from 'vue';
import { DomainGroupService } from '~/services/DomainGroupService';
import type { DomainGroup, CreateDomainGroupRequest, UpdateDomainGroupRequest, ApiResponse } from '~/types/api';

export const useDomainGroups = () => {
  // Reactive states
  const domainGroups = ref<DomainGroup[]>([]);
  const pagination = ref<any>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Service instance
  const domainGroupService = new DomainGroupService();

  // Computed: formatted groups for display
  const formattedGroups = computed(() => {
    return domainGroups.value.map(group => ({
      ...group,
      statusLabel: group.is_active ? 'Active' : 'Inactive',
      statusColor: group.is_active ? 'success' : 'error',
      domainsCount: group.domains_count || 0,
      limitLabel: group.max_domains 
        ? `${group.domains_count || 0}/${group.max_domains}`
        : 'Unlimited',
      availableSlots: group.max_domains 
        ? (group.max_domains - (group.domains_count || 0))
        : null,
      isFull: group.has_reached_limit || false,
      createdDate: new Date(group.created_at).toLocaleDateString('en-US'),
      updatedDate: new Date(group.updated_at).toLocaleDateString('en-US')
    }));
  });

  // Computed: active groups only
  const activeGroups = computed(() => {
    return formattedGroups.value.filter(group => group.is_active);
  });

  // Computed: groups that can still accept domains
  const availableGroups = computed(() => {
    return formattedGroups.value.filter(group => 
      group.is_active && !group.isFull
    );
  });

  /**
   * Load domain groups
   */
  const loadDomainGroups = async (params?: {
    page?: number;
    per_page?: number;
    search?: string;
    is_active?: boolean;
  }) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await domainGroupService.getDomainGroups(params);
      
      if (response.success && response.data) {
        domainGroups.value = response.data.data;
        pagination.value = response.data.pagination;
      } else {
        error.value = response.error || 'Failed to load domain groups';
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load domain groups';
      console.error('Load domain groups error:', err);
    } finally {
      loading.value = false;
    }
  };

  /**
   * Get specific domain group
   */
  const getDomainGroup = async (id: number): Promise<ApiResponse<DomainGroup>> => {
    try {
      return await domainGroupService.getDomainGroup(id);
    } catch (err) {
      console.error('Get domain group error:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to fetch domain group'
      };
    }
  };

  /**
   * Create domain group (Super Admin only)
   */
  const createDomainGroup = async (data: CreateDomainGroupRequest): Promise<ApiResponse<DomainGroup>> => {
    try {
      const result = await domainGroupService.createDomainGroup(data);
      
      if (result.success) {
        // Reload list after creation
        await loadDomainGroups();
      }
      
      return result;
    } catch (err) {
      console.error('Create domain group error:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to create domain group'
      };
    }
  };

  /**
   * Update domain group (Super Admin only)
   */
  const updateDomainGroup = async (id: number, data: UpdateDomainGroupRequest): Promise<ApiResponse<DomainGroup>> => {
    try {
      const result = await domainGroupService.updateDomainGroup(id, data);
      
      if (result.success) {
        // Reload list after update
        await loadDomainGroups();
      }
      
      return result;
    } catch (err) {
      console.error('Update domain group error:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to update domain group'
      };
    }
  };

  /**
   * Delete domain group (Super Admin only)
   */
  const deleteDomainGroup = async (id: number): Promise<ApiResponse<void>> => {
    try {
      const result = await domainGroupService.deleteDomainGroup(id);
      
      if (result.success) {
        // Reload list after deletion
        await loadDomainGroups();
      }
      
      return result;
    } catch (err) {
      console.error('Delete domain group error:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to delete domain group'
      };
    }
  };

  /**
   * Get domains in a specific group
   */
  const getGroupDomains = async (id: number) => {
    try {
      return await domainGroupService.getGroupDomains(id);
    } catch (err) {
      console.error('Get group domains error:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to fetch group domains'
      };
    }
  };

  /**
   * Add multiple domains to a group (Batch operation)
   */
  const addDomainsToGroup = async (groupId: number, domainIds: number[]): Promise<ApiResponse<any>> => {
    try {
      const result = await domainGroupService.addDomainsToGroup(groupId, domainIds);
      
      if (result.success) {
        // Reload groups after adding domains
        await loadDomainGroups();
      }
      
      return result;
    } catch (err) {
      console.error('Add domains to group error:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to add domains to group'
      };
    }
  };

  /**
   * Remove multiple domains from a group (Batch operation)
   */
  const removeDomainsFromGroup = async (groupId: number, domainIds: number[]): Promise<ApiResponse<any>> => {
    try {
      const result = await domainGroupService.removeDomainsFromGroup(groupId, domainIds);
      
      if (result.success) {
        // Reload groups after removing domains
        await loadDomainGroups();
      }
      
      return result;
    } catch (err) {
      console.error('Remove domains from group error:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to remove domains from group'
      };
    }
  };

  // Pagination helpers
  const nextPage = (params?: any) => {
    if (pagination.value && pagination.value.current_page < pagination.value.last_page) {
      loadDomainGroups({ ...params, page: pagination.value.current_page + 1 });
    }
  };

  const prevPage = (params?: any) => {
    if (pagination.value && pagination.value.current_page > 1) {
      loadDomainGroups({ ...params, page: pagination.value.current_page - 1 });
    }
  };

  const goToPage = (page: number, params?: any) => {
    loadDomainGroups({ ...params, page });
  };

  const changePerPage = (perPage: number, params?: any) => {
    loadDomainGroups({ ...params, per_page: perPage, page: 1 });
  };

  const canGoNext = computed(() => {
    return pagination.value && pagination.value.current_page < pagination.value.last_page;
  });

  const canGoPrev = computed(() => {
    return pagination.value && pagination.value.current_page > 1;
  });

  const pageNumbers = computed(() => {
    if (!pagination.value) return [];
    
    const pages = [];
    const current = pagination.value.current_page;
    const last = pagination.value.last_page;
    
    // Show max 5 page numbers
    let start = Math.max(1, current - 2);
    let end = Math.min(last, current + 2);
    
    // Adjust if at the edges
    if (current <= 2) {
      end = Math.min(5, last);
    }
    if (current >= last - 1) {
      start = Math.max(1, last - 4);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  });

  return {
    // State
    domainGroups,
    formattedGroups,
    activeGroups,
    availableGroups,
    pagination,
    loading,
    error,

    // Actions
    loadDomainGroups,
    getDomainGroup,
    createDomainGroup,
    updateDomainGroup,
    deleteDomainGroup,
    getGroupDomains,
    addDomainsToGroup,
    removeDomainsFromGroup,

    // Pagination
    nextPage,
    prevPage,
    goToPage,
    changePerPage,
    canGoNext,
    canGoPrev,
    pageNumbers
  };
};

