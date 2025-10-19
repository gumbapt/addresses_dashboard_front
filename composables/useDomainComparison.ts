import type { DomainComparisonData } from '~/types/api';
import { ReportService } from '~/services/ReportService';

export const useDomainComparison = () => {
  const comparisonData = ref<DomainComparisonData | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  
  const reportService = new ReportService();

  const loadComparison = async (
    domainIds: number[], 
    metric?: string, 
    dateFrom?: string, 
    dateTo?: string
  ) => {
    if (domainIds.length < 2) {
      error.value = 'Please select at least 2 domains to compare';
      return;
    }
    
    loading.value = true;
    error.value = null;
    
    try {
      const result = await reportService.compareDomains(domainIds, metric, dateFrom, dateTo);
      
      if (result.success && result.data) {
        comparisonData.value = result.data;
      } else {
        error.value = result.error || 'Failed to load comparison';
        comparisonData.value = null;
      }
    } catch (err) {
      error.value = 'Unexpected error loading comparison';
      comparisonData.value = null;
    } finally {
      loading.value = false;
    }
  };

  // Helper para formatar números
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  // Helper para cor da diferença
  const getDiffColor = (diff: number, inverse: boolean = false): string => {
    if (inverse) {
      return diff > 0 ? 'error' : diff < 0 ? 'success' : 'default';
    }
    return diff > 0 ? 'success' : diff < 0 ? 'error' : 'default';
  };

  // Helper para ícone da diferença
  const getDiffIcon = (diff: number): string => {
    if (diff > 0) return 'mdi-arrow-up';
    if (diff < 0) return 'mdi-arrow-down';
    return 'mdi-minus';
  };

  return {
    comparisonData: readonly(comparisonData),
    loading: readonly(loading),
    error: readonly(error),
    loadComparison,
    formatNumber,
    getDiffColor,
    getDiffIcon
  };
};

