// Tipos da API
export interface Permission {
  id: number;
  name: string;
  slug: string;
  description: string;
  is_active: boolean;
  resource: string;
  action: string;
  route: string | null;
}

export interface Admin {
  id: number;
  name: string;
  email: string;
  is_active: boolean;
  is_super_admin: boolean;
  last_login_at: string | null;
}

export interface Role {
  id: number;
  name: string;
  slug: string;
  description: string;
  is_active: boolean;
  permissions: Permission[];
  created_at: string;
  updated_at: string;
}

export interface LoginResponse {
  admin: Admin;
  token: string;
  roles: Role[];
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ApiResponse<T> {
  data?: T;
  message?: string;
  success: boolean;
  error?: string;
}

// Tipos para Usuários
export interface User {
  id: number;
  name: string;
  email: string;
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Pagination {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from: number;
  to: number;
}

export interface UsersResponse {
  users: User[];
  pagination: Pagination;
}

export interface AdminsResponse {
  admins: Admin[];
  pagination?: Pagination;
}

// A API de roles retorna um array direto, não um objeto com paginação
export type RolesResponse = Role[];

export interface PermissionsResponse {
  success: boolean;
  data: Permission[];
}

// Request types for Role CRUD
export interface CreateRoleRequest {
  name: string;
  description: string;
  permissions?: number[];
}

export interface UpdateRoleRequest {
  id: number;
  name: string;
  description: string;
}

export interface DeleteRoleRequest {
  id: number;
}

export interface UpdateRolePermissionsRequest {
  id: number;
  permissions: number[];
}

// Response types for Role CRUD
export interface RoleResponse {
  success: boolean;
  data: {
    role: Role;
  };
}

// Request types for Admin CRUD
export interface CreateAdminRequest {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  is_active: boolean;
  role_id?: number;
}

export interface UpdateAdminRequest {
  id: number;
  name?: string;
  email?: string;
  is_active?: boolean;
}

export interface DeleteAdminRequest {
  id: number;
}

// Response types for Admin CRUD
export interface AdminResponse {
  success: boolean;
  data: Admin;
}

export interface AdminsListResponse {
  success: boolean;
  data: Admin[];
  pagination: Pagination;
}

// Domain types
export interface Domain {
  id: number;
  name: string;
  slug: string;
  domain_url: string;
  site_id: string;
  api_key: string;
  status: string;
  timezone: string;
  is_active: boolean;
  wordpress_version?: string;
  plugin_version?: string;
  settings?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface DomainsListResponse {
  success: boolean;
  data: Domain[];
  pagination: Pagination;
}

export interface DomainResponse {
  success: boolean;
  message?: string;
  data: Domain;
}

export interface CreateDomainRequest {
  name: string;
  domain_url: string;
  site_id?: string;
  timezone?: string;
  wordpress_version?: string;
  plugin_version?: string;
  settings?: Record<string, any>;
}

export interface UpdateDomainRequest {
  name?: string;
  domain_url?: string;
  site_id?: string;
  timezone?: string;
  wordpress_version?: string;
  plugin_version?: string;
  settings?: Record<string, any>;
  is_active?: boolean;
}

// Report types
export interface Report {
  id: number;
  domain_id: number;
  report_date: string;
  status: 'pending' | 'processing' | 'processed' | 'failed';
  data_version: string;
  raw_data?: Record<string, any>;
  processed_data?: Record<string, any>;
  error_message?: string;
  created_at: string;
  updated_at: string;
  domain?: Domain;
}

export interface ReportMeta {
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
  from?: number;
  to?: number;
}

export interface ReportsListResponse {
  success: boolean;
  data: Report[];
  meta: ReportMeta;
}

export interface ReportResponse {
  success: boolean;
  message?: string;
  data: Report;
}

export interface ReportFilters {
  domain_id?: number;
  status?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  per_page?: number;
}

// Aggregated Domain Stats types
export interface AggregatedDomainStats {
  domain: {
    id: number;
    name: string;
  };
  period: {
    total_reports: number;
    first_report: string;
    last_report: string;
    days_covered: number;
  };
  summary: {
    total_requests: number;
    total_failed: number;
    avg_success_rate: number;
    avg_requests_per_hour: number;
    total_unique_providers: number;
    total_unique_states: number;
    total_unique_zip_codes: number;
  };
  providers: Array<{
    provider_id: number;
    name: string;
    slug: string;
    technology: string;
    total_count: number;
    avg_success_rate: number;
    avg_speed: number;
    report_count: number;
  }>;
  geographic: {
    states: Array<{
      state_id: number;
      code: string;
      name: string;
      total_requests: number;
      avg_success_rate: number;
      avg_speed: number;
      report_count: number;
    }>;
    cities: Array<{
      city_id: number;
      name: string;
      total_requests: number;
      report_count: number;
    }>;
    zip_codes: Array<{
      zip_code_id: number;
      code: string;
      total_requests: number;
      report_count: number;
    }>;
  };
  trends: Array<{
    date: string;
    report_id: number;
    total_requests: number;
    success_rate: number;
    failed_requests: number;
    avg_requests_per_hour: number;
  }>;
}

export interface AggregatedDomainResponse {
  success: boolean;
  data: AggregatedDomainStats;
}
