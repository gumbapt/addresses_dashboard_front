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

// Domain Group types
export interface DomainGroup {
  id: number;
  name: string;
  slug: string;
  description?: string;
  is_active: boolean;
  max_domains?: number | null;
  settings?: Record<string, any>;
  created_by?: number;
  updated_by?: number;
  created_at: string;
  updated_at: string;
  
  // Relationships (when included)
  domains?: Domain[];
  domains_count?: number;
  available_domains?: number | null;
  has_reached_limit?: boolean;
  creator?: {
    id: number;
    name: string;
    email: string;
  };
}

export interface DomainGroupsListResponse {
  success: boolean;
  data: DomainGroup[];
  pagination: Pagination;
}

export interface DomainGroupResponse {
  success: boolean;
  message?: string;
  data: DomainGroup;
}

export interface CreateDomainGroupRequest {
  name: string;
  description?: string;
  is_active?: boolean;
  max_domains?: number | null;
  settings?: Record<string, any>;
}

export interface UpdateDomainGroupRequest {
  name?: string;
  description?: string;
  is_active?: boolean;
  max_domains?: number | null;
  settings?: Record<string, any>;
}

// Domain types
export interface Domain {
  id: number;
  domain_group_id?: number | null; // NEW
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
  
  // Relationships (when included)
  domainGroup?: DomainGroup; // NEW
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
  domain_group_id?: number | null; // NEW
  name: string;
  domain_url: string;
  site_id?: string;
  timezone?: string;
  wordpress_version?: string;
  plugin_version?: string;
  settings?: Record<string, any>;
}

export interface UpdateDomainRequest {
  domain_group_id?: number | null; // NEW
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
  // Optional: Direct technology distribution (if provided by API)
  technology_distribution?: Array<{
    technology: string;
    count: number;
    total_count?: number;
    percentage?: number;
  }>;
}

export interface AggregatedDomainResponse {
  success: boolean;
  data: AggregatedDomainStats;
}

// Global Domain Ranking types
export interface DomainRankingItem {
  rank: number;
  domain: {
    id: number;
    name: string;
    slug: string;
  };
  metrics: {
    total_requests: number;
    success_rate: number;
    avg_speed: number;
    score: number;
    unique_providers: number;
    unique_states: number;
  };
  coverage: {
    total_reports: number;
    period_start: string;
    period_end: string;
    days_covered: number;
  };
}

export interface GlobalDomainRankingData {
  ranking: DomainRankingItem[];
  sort_by: string;
  total_domains: number;
}

export interface GlobalDomainRankingResponse {
  success: boolean;
  data: GlobalDomainRankingData;
  message?: string;
}

// Domain Comparison types
export interface DomainComparisonMetrics {
  total_requests: number;
  success_rate: number;
  avg_speed: number;
  unique_providers?: number;
  unique_states?: number;
}

export interface DomainComparisonItem {
  domain: {
    id: number;
    name: string;
    slug: string;
  };
  metrics: DomainComparisonMetrics;
  comparison?: {
    requests_diff: number;
    requests_diff_label: string;
    success_diff: number;
    success_diff_label: string;
    speed_diff: number;
    speed_diff_label: string;
  };
  geographic?: any;
  providers?: any;
  technologies?: any;
}

export interface DomainComparisonProviderData {
  provider_id: number;
  provider_name: string;
  technology: string;
  total_requests: number;
  avg_success_rate: number;
  avg_speed: number;
  appearances: number;
}

export interface DomainComparisonData {
  domains: DomainComparisonItem[];
  base_domain_id?: number;
  total_compared: number;
  provider_data?: {
    all_providers: DomainComparisonProviderData[];
    common_providers: DomainComparisonProviderData[];
    unique_providers_count: number;
  };
  period?: {
    date_from?: string;
    date_to?: string;
  };
  filters?: {
    metric?: string | null;
    date_from?: string | null;
    date_to?: string | null;
  };
}

export interface DomainComparisonResponse {
  success: boolean;
  data: DomainComparisonData;
  message?: string;
}

// Role Domain Permissions types
export interface RoleDomainPermission {
  role_id: number;
  domain_id: number;
  can_view: boolean;
  can_edit: boolean;
  assigned_at: string;
  assigned_by: number;
  domain?: Domain;
}

export interface RoleDomainsResponse {
  success: boolean;
  data: {
    role: {
      id: number;
      name: string;
      slug: string;
    };
    domains: RoleDomainPermission[];
    total: number;
  };
}

export interface AssignDomainsToRoleRequest {
  role_id: number;
  domain_ids: number[];
  permissions: {
    can_view: boolean;
    can_edit: boolean;
  };
}

export interface RevokeDomainsFromRoleRequest {
  role_id: number;
  domain_ids: number[];
}

export interface AssignDomainsResponse {
  success: boolean;
  message: string;
  data: {
    assigned_domains: number;
  };
}

export interface MyDomainsResponse {
  success: boolean;
  data: {
    access_type: 'all' | 'assigned';
    domains?: Domain[];
    total: number;
  };
}

// Provider Ranking Types
export interface ProviderRanking {
  rank: number;
  domain_id: number;
  domain_name: string;
  domain_slug: string;
  provider_id: number;
  provider_name: string;
  technology: string | null;
  total_requests: number;
  domain_total_requests: number;  // NEW: Total requests of the domain (all providers)
  percentage_of_domain: number;   // NEW: % this provider represents in the domain
  avg_success_rate: number;
  avg_speed: number;
  total_reports: number;
  period_start: string;
  period_end: string;
  days_covered: number;
}

export interface ProviderRankingFilters {
  provider_id?: number | null;
  technology?: string | null;
  period?: 'today' | 'yesterday' | 'last_week' | 'last_month' | 'last_year' | 'all_time' | null;
  date_from?: string | null;
  date_to?: string | null;
  sort_by?: 'total_requests' | 'success_rate' | 'avg_speed' | 'total_reports';
  page?: number;
  per_page?: number;
  limit?: number;  // Deprecated, use page/per_page
}

export interface ProviderRankingResponse {
  success: boolean;
  data: ProviderRanking[] | {
    ranking: ProviderRanking[];
    total_entries: number;
    filters: ProviderRankingFilters;
  };
  pagination?: Pagination;
  available_providers?: AvailableProvider[];
  aggregated_stats?: AggregatedStats;
  global_stats?: GlobalStats;
  filters?: ProviderRankingFilters;
  message?: string;
}

export interface Provider {
  id: number;
  name: string;
  slug?: string;
}

export interface AvailableProvider {
  id: number;
  name: string;
  slug: string;
  total_requests: number;
}

export interface AggregatedStats {
  total_requests: number;
  avg_success_rate: number;
  avg_speed: number;
  unique_domains: number;
  unique_providers: number;
}

export interface GlobalStats {
  provider_total_requests: number;
  global_total_requests: number;
  percentage_of_global: number;
}
