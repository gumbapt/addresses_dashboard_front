import type {
  Report,
  ReportsListResponse,
  ReportResponse,
  ApiResponse,
  ReportFilters
} from '~/types/api';
import { ReportRepository } from '~/infrastructure/repositories/ReportRepository';

export class ReportService {
  private reportRepository: ReportRepository;

  constructor() {
    this.reportRepository = new ReportRepository();
  }

  async getReports(filters?: ReportFilters): Promise<ApiResponse<ReportsListResponse>> {
    try {
      const response = await this.reportRepository.getReports(filters);
      
      return {
        success: response.success,
        data: response,
        message: 'Reports loaded successfully'
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  async getReport(id: number): Promise<ApiResponse<Report>> {
    try {
      const response = await this.reportRepository.getReport(id);
      
      return {
        success: response.success,
        data: response.data,
        message: 'Report loaded successfully'
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  async getRecentReports(): Promise<ApiResponse<Report[]>> {
    try {
      const response = await this.reportRepository.getRecentReports();
      
      return {
        success: response.success,
        data: response.data,
        message: 'Recent reports loaded successfully'
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  async getGlobalDomainRanking(sortBy?: string): Promise<ApiResponse<any>> {
    try {
      const response = await this.reportRepository.getGlobalDomainRanking(sortBy);
      
      return {
        success: response.success,
        data: response.data,
        message: 'Global domain ranking loaded successfully'
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  async compareDomains(domainIds: number[], metric?: string, dateFrom?: string, dateTo?: string): Promise<ApiResponse<any>> {
    try {
      const response = await this.reportRepository.compareDomains(domainIds, metric, dateFrom, dateTo);
      
      return {
        success: response.success,
        data: response.data,
        message: 'Domain comparison loaded successfully'
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }
}
