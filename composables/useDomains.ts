import type { Domain, Pagination } from '~/types/api';
import { DomainService } from '~/services/DomainService';

export const useDomains = () => {
  // Estados reativos
  const domains = ref<Domain[]>([]);
  const pagination = ref<Pagination | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  
  // Instância do serviço
  const domainService = new DomainService();

  // Função para carregar domains
  const loadDomains = async (page: number = 1, perPage: number = 15, search?: string, isActive?: boolean) => {
    loading.value = true;
    error.value = null;
    
    try {
      const result = await domainService.getDomains(page, perPage, search, isActive);
      
      if (result.success && result.data) {
        domains.value = result.data.data || [];
        pagination.value = result.data.pagination || null;
      } else {
        error.value = result.error || 'Failed to load domains';
        domains.value = [];
      }
    } catch (err) {
      error.value = 'Unexpected error loading domains';
      domains.value = [];
    } finally {
      loading.value = false;
    }
  };

  // Função para ir para próxima página
  const nextPage = () => {
    if (pagination.value && pagination.value.current_page < pagination.value.last_page) {
      loadDomains(pagination.value.current_page + 1, pagination.value.per_page);
    }
  };

  // Função para ir para página anterior
  const prevPage = () => {
    if (pagination.value && pagination.value.current_page > 1) {
      loadDomains(pagination.value.current_page - 1, pagination.value.per_page);
    }
  };

  // Função para ir para página específica
  const goToPage = (page: number) => {
    if (pagination.value && page >= 1 && page <= pagination.value.last_page) {
      loadDomains(page, pagination.value.per_page);
    }
  };

  // Função para alterar itens por página
  const changePerPage = (perPage: number) => {
    loadDomains(1, perPage);
  };

  // Função para formatar dados do domain para exibição
  const formatDomainForDisplay = (domain: Domain) => {
    return {
      ...domain,
      statusColor: domain.is_active ? 'success' : 'error',
      createdDate: new Date(domain.created_at).toLocaleDateString('en-US'),
      lastModified: new Date(domain.updated_at).toLocaleDateString('en-US'),
    };
  };

  // Computed para domains formatados
  const formattedDomains = computed(() => {
    if (!domains.value || !Array.isArray(domains.value)) {
      return [];
    }
    return domains.value.map(formatDomainForDisplay);
  });

  // Computed para verificar se pode ir para próxima página
  const canGoNext = computed(() => {
    return pagination.value && pagination.value.current_page < pagination.value.last_page;
  });

  // Computed para verificar se pode ir para página anterior
  const canGoPrev = computed(() => {
    return pagination.value && pagination.value.current_page > 1;
  });

  // Computed para array de páginas
  const pageNumbers = computed(() => {
    if (!pagination.value) return [];
    
    const pages = [];
    const current = pagination.value.current_page;
    const last = pagination.value.last_page;
    
    // Mostrar até 5 páginas
    let start = Math.max(1, current - 2);
    let end = Math.min(last, current + 2);
    
    // Ajustar se estamos no início ou fim
    if (current <= 3) {
      end = Math.min(last, 5);
    } else if (current >= last - 2) {
      start = Math.max(1, last - 4);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  });

  // Função para criar domain
  const createDomain = async (data: any) => {
    try {
      const result = await domainService.createDomain(data);
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create domain'
      };
    }
  };

  // Função para atualizar domain
  const updateDomain = async (id: number, data: any) => {
    try {
      const result = await domainService.updateDomain(id, data);
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update domain'
      };
    }
  };

  // Função para deletar domain
  const deleteDomain = async (id: number) => {
    try {
      const result = await domainService.deleteDomain(id);
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete domain'
      };
    }
  };

  // Função para regenerar API key
  const regenerateApiKey = async (id: number) => {
    try {
      const result = await domainService.regenerateApiKey(id);
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to regenerate API key'
      };
    }
  };

  return {
    // Estados
    domains: readonly(domains),
    pagination: readonly(pagination),
    loading: readonly(loading),
    error: readonly(error),
    
    // Computed
    formattedDomains,
    canGoNext,
    canGoPrev,
    pageNumbers,
    
    // Funções
    loadDomains,
    nextPage,
    prevPage,
    goToPage,
    changePerPage,
    formatDomainForDisplay,
    createDomain,
    updateDomain,
    deleteDomain,
    regenerateApiKey
  };
};
