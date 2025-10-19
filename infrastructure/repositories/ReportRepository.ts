import type {
  ReportsListResponse,
  ReportResponse,
  ReportFilters
} from '~/types/api';
import { ApiClient } from '../http/ApiClient';

export class ReportRepository {
  private apiClient: ApiClient;

  constructor() {
    this.apiClient = new ApiClient();
  }

  async getReports(filters?: ReportFilters): Promise<ReportsListResponse> {
    try {
      const params = new URLSearchParams();
      
      if (filters?.page) {
        params.append('page', filters.page.toString());
      }
      
      if (filters?.per_page) {
        params.append('per_page', filters.per_page.toString());
      }
      
      if (filters?.domain_id) {
        params.append('domain_id', filters.domain_id.toString());
      }
      
      if (filters?.status) {
        params.append('status', filters.status);
      }
      
      if (filters?.start_date) {
        params.append('start_date', filters.start_date);
      }
      
      if (filters?.end_date) {
        params.append('end_date', filters.end_date);
      }
      
      const queryString = params.toString();
      const url = `/reports${queryString ? '?' + queryString : ''}`;
      
      const response = await this.apiClient.get<ReportsListResponse>(url);
      return response;
    } catch (error) {
      console.error('Get reports failed:', error);
      throw new Error('Failed to fetch reports');
    }
  }

  async getReport(id: number): Promise<ReportResponse> {
    try {
      const response = await this.apiClient.get<ReportResponse>(`/reports/${id}`);
      return response;
    } catch (error) {
      console.error('Get report failed:', error);
      throw new Error('Failed to fetch report');
    }
  }

  async getRecentReports(): Promise<ReportsListResponse> {
    try {
      const response = await this.apiClient.get<ReportsListResponse>('/reports/recent');
      return response;
    } catch (error) {
      console.error('Get recent reports failed:', error);
      throw new Error('Failed to fetch recent reports');
    }
  }

  async getGlobalDomainRanking(sortBy?: string): Promise<any> {
    try {
      let url = '/reports/global/domain-ranking';
      
      if (sortBy) {
        url += `?sort_by=${sortBy}`;
      }
      
      const response = await this.apiClient.get<any>(url);
      return response;
    } catch (error) {
      console.error('Get global domain ranking failed:', error);
      throw new Error('Failed to fetch global domain ranking');
    }
  }

  async compareDomains(domainIds: number[], metric?: string, dateFrom?: string, dateTo?: string): Promise<any> {
    try {
      const params = new URLSearchParams();
      params.append('domains', domainIds.join(','));
      
      if (metric) {
        params.append('metric', metric);
      }
      
      if (dateFrom) {
        params.append('date_from', dateFrom);
      }
      
      if (dateTo) {
        params.append('date_to', dateTo);
      }
      
      const url = `/reports/global/comparison?${params.toString()}`;
      const response = await this.apiClient.get<any>(url);
      return response;
    } catch (error) {
      console.error('Compare domains failed:', error);
      throw new Error('Failed to compare domains');
    }
  }
}
