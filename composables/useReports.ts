import type { Report, ReportMeta, ReportFilters } from '~/types/api';
import { ReportService } from '~/services/ReportService';

export const useReports = () => {
  // Estados reativos
  const reports = ref<Report[]>([]);
  const meta = ref<ReportMeta | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  
  // Instância do serviço
  const reportService = new ReportService();

  // Função para carregar reports
  const loadReports = async (filters?: ReportFilters) => {
    loading.value = true;
    error.value = null;
    
    try {
      const result = await reportService.getReports(filters);
      
      if (result.success && result.data) {
        reports.value = result.data.data || [];
        meta.value = result.data.meta || null;
      } else {
        error.value = result.error || 'Failed to load reports';
        reports.value = [];
      }
    } catch (err) {
      error.value = 'Unexpected error loading reports';
      reports.value = [];
    } finally {
      loading.value = false;
    }
  };

  // Função para carregar um report específico
  const loadReport = async (id: number) => {
    loading.value = true;
    error.value = null;
    
    try {
      const result = await reportService.getReport(id);
      
      if (result.success && result.data) {
        return result.data;
      } else {
        error.value = result.error || 'Failed to load report';
        return null;
      }
    } catch (err) {
      error.value = 'Unexpected error loading report';
      return null;
    } finally {
      loading.value = false;
    }
  };

  // Função para carregar reports recentes
  const loadRecentReports = async () => {
    loading.value = true;
    error.value = null;
    
    try {
      const result = await reportService.getRecentReports();
      
      if (result.success && result.data) {
        reports.value = result.data || [];
      } else {
        error.value = result.error || 'Failed to load recent reports';
        reports.value = [];
      }
    } catch (err) {
      error.value = 'Unexpected error loading recent reports';
      reports.value = [];
    } finally {
      loading.value = false;
    }
  };

  // Função para ir para próxima página
  const nextPage = (filters?: ReportFilters) => {
    if (meta.value && meta.value.current_page < meta.value.last_page) {
      loadReports({
        ...filters,
        page: meta.value.current_page + 1,
        per_page: meta.value.per_page
      });
    }
  };

  // Função para ir para página anterior
  const prevPage = (filters?: ReportFilters) => {
    if (meta.value && meta.value.current_page > 1) {
      loadReports({
        ...filters,
        page: meta.value.current_page - 1,
        per_page: meta.value.per_page
      });
    }
  };

  // Função para ir para página específica
  const goToPage = (page: number, filters?: ReportFilters) => {
    if (meta.value && page >= 1 && page <= meta.value.last_page) {
      loadReports({
        ...filters,
        page,
        per_page: meta.value.per_page
      });
    }
  };

  // Função para alterar itens por página
  const changePerPage = (perPage: number, filters?: ReportFilters) => {
    loadReports({
      ...filters,
      page: 1,
      per_page: perPage
    });
  };

  // Função para formatar status do report
  const getStatusColor = (status: string): string => {
    const statusColors: Record<string, string> = {
      'pending': 'warning',
      'processing': 'info',
      'processed': 'success',
      'failed': 'error'
    };
    return statusColors[status] || 'default';
  };

  // Função para formatar status do report (label)
  const getStatusLabel = (status: string): string => {
    const statusLabels: Record<string, string> = {
      'pending': 'Pending',
      'processing': 'Processing',
      'processed': 'Processed',
      'failed': 'Failed'
    };
    return statusLabels[status] || status;
  };

  // Função para formatar dados do report para exibição
  const formatReportForDisplay = (report: Report) => {
    return {
      ...report,
      statusColor: getStatusColor(report.status),
      statusLabel: getStatusLabel(report.status),
      reportDate: new Date(report.report_date).toLocaleDateString('en-US'),
      createdDate: new Date(report.created_at).toLocaleDateString('en-US'),
      domainName: report.domain?.name || 'N/A',
    };
  };

  // Computed para reports formatados
  const formattedReports = computed(() => {
    if (!reports.value || !Array.isArray(reports.value)) {
      return [];
    }
    return reports.value.map(formatReportForDisplay);
  });

  // Computed para verificar se pode ir para próxima página
  const canGoNext = computed(() => {
    return meta.value && meta.value.current_page < meta.value.last_page;
  });

  // Computed para verificar se pode ir para página anterior
  const canGoPrev = computed(() => {
    return meta.value && meta.value.current_page > 1;
  });

  // Computed para array de páginas
  const pageNumbers = computed(() => {
    if (!meta.value) return [];
    
    const pages = [];
    const current = meta.value.current_page;
    const last = meta.value.last_page;
    
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

  return {
    // Estados
    reports: readonly(reports),
    meta: readonly(meta),
    loading: readonly(loading),
    error: readonly(error),
    
    // Computed
    formattedReports,
    canGoNext,
    canGoPrev,
    pageNumbers,
    
    // Funções
    loadReports,
    loadReport,
    loadRecentReports,
    nextPage,
    prevPage,
    goToPage,
    changePerPage,
    formatReportForDisplay,
    getStatusColor,
    getStatusLabel
  };
};
