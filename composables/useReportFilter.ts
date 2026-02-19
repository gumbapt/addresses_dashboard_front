/**
 * Residential / Business report filter.
 * - All: both toggles off → no r/b params (or r=1&b=1)
 * - Residential: only residential (+ "both") data → r=1
 * - Business: only business (+ "both") data → b=1
 * - Both on: same as All → r=1&b=1
 */
export type ReportFilterParams = { r?: 1; b?: 1 };

export const useReportFilter = () => {
  const filterResidential = ref(false);
  const filterBusiness = ref(false);

  const reportFilterParams = computed<ReportFilterParams>(() => {
    if (filterResidential.value && filterBusiness.value) {
      return { r: 1, b: 1 };
    }
    if (filterResidential.value) {
      return { r: 1 };
    }
    if (filterBusiness.value) {
      return { b: 1 };
    }
    return {};
  });

  const filterLabel = computed(() => {
    if (filterResidential.value && !filterBusiness.value) return 'Residential';
    if (filterBusiness.value && !filterResidential.value) return 'Business';
    if (filterResidential.value && filterBusiness.value) return 'All';
    return 'All';
  });

  return {
    filterResidential,
    filterBusiness,
    reportFilterParams,
    filterLabel,
  };
};
