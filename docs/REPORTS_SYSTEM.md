# Reports Management System

This document describes the Reports management system implemented in the frontend.

## Overview

The Reports system allows administrators to view and manage domain reports. Each report contains data collected from WordPress sites, including raw data, processed data, and status information.

## Features

### 1. Report Listing
- View all reports with pagination
- Advanced filtering capabilities:
  - Filter by domain
  - Filter by status (pending, processing, processed, failed)
  - Filter by date range (start_date and end_date)
- Display report information: ID, domain, report date, status, data version, created date
- Support for combining multiple filters

### 2. Report Details
- View full report details including:
  - Domain information
  - Report date
  - Status with color-coded chips
  - Data version
  - Error messages (if failed)
  - Raw data (JSON format)
  - Processed data (JSON format)
  - Timestamps (created_at, updated_at)

### 3. Recent Reports
- Dedicated endpoint to fetch the 10 most recent reports
- Quick access to latest data

### 4. Report Status

Reports can have the following statuses:

- **Pending** (warning color): Report is waiting to be processed
- **Processing** (info color): Report is currently being processed
- **Processed** (success color): Report has been successfully processed
- **Failed** (error color): Report processing failed

## Permissions

The system uses the following permission:

- `report-read`: View reports list and details

Super admins have access to all operations regardless of specific permissions.

## Architecture

### Type Definitions (`types/api.d.ts`)

```typescript
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

export interface ReportFilters {
  domain_id?: number;
  status?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  per_page?: number;
}
```

### Repository Layer (`infrastructure/repositories/ReportRepository.ts`)

Handles direct API communication:
- `getReports(filters?)` - List reports with optional filters
- `getReport(id)` - Get single report details
- `getRecentReports()` - Get 10 most recent reports

### Service Layer (`services/ReportService.ts`)

Business logic layer that wraps repository calls and handles errors consistently.

### Composable (`composables/useReports.ts`)

State management and reactive data:
- Report list state
- Pagination meta state
- Loading and error states
- Formatted report data for display
- Navigation functions (nextPage, prevPage, goToPage)
- Status color and label helpers
- Filter management

### UI Component (`pages/reports/index.vue`)

Full-featured report management interface with:
- Advanced filter controls (domain, status, date range)
- Data table with report information
- View details dialog with expandable sections
- Responsive design
- Loading states
- Error handling
- Pagination with filter preservation

## API Endpoints

All endpoints are prefixed with `/api/admin/reports`:

- `GET /api/admin/reports?page={page}&per_page={perPage}&domain_id={id}&status={status}&start_date={date}&end_date={date}`
  - List reports with optional filters
  
- `GET /api/admin/reports/{id}`
  - Get single report details
  
- `GET /api/admin/reports/recent`
  - Get 10 most recent reports

## UI Features

### Filters
- **Domain**: Select specific domain or view all
- **Status**: Filter by report status (pending, processing, processed, failed)
- **Date Range**: Filter by start date and end date
- Apply/Clear filters buttons
- Results counter

### Table Columns
1. ID (report identifier)
2. Domain (name and ID)
3. Report Date
4. Status (color-coded chip)
5. Data Version (outlined chip)
6. Created At
7. Actions (View Details, Export)

### Report Details Dialog

The detail view includes:

#### Overview Section
- Domain name
- Report date
- Status chip
- Data version chip
- Error message (if status is failed)

#### Expandable Sections
1. **Raw Data**: JSON view of raw collected data
2. **Processed Data**: JSON view of processed data

#### Metadata
- Created timestamp
- Updated timestamp

### Filter Combinations

The system supports combining multiple filters:
- Domain + Status
- Domain + Date Range
- Status + Date Range
- Domain + Status + Date Range
- All combinations work together seamlessly

## Navigation

The Reports link appears in the sidebar under the "Management" section, but only if the user has the `report-read` permission.

Icon: `chart-histogram-linear`

## Security

- All routes are protected by authentication middleware
- Permission-based access control (`report-read`)
- Only authenticated admins can access reports
- Inactive admins are denied access
- Super admin can view all reports

## Pagination

- Default: 15 items per page
- Options: 10, 15, 25, 50, 100 items per page
- Shows current page, total pages, and item range
- Navigation: Previous, Next, Direct page selection
- Pagination limits:
  - Maximum: 100 items per page
  - Minimum: 1 item per page
- Pagination state is preserved when applying filters

## Filter Behavior

1. **Apply Filters**: Resets to page 1 and applies selected filters
2. **Clear Filters**: Resets all filters and returns to default view
3. **Filter Persistence**: Filters are maintained during pagination
4. **Real-time Counter**: Shows total number of reports matching current filters

## Data Display

### Status Visualization
- **Pending**: Yellow/warning chip
- **Processing**: Blue/info chip
- **Processed**: Green/success chip
- **Failed**: Red/error chip

### Date Formatting
- Report dates: Localized date format (e.g., "10/15/2025")
- Created dates: Localized date format
- Full timestamps in detail view: Localized date and time

### JSON Data Display
- Formatted with proper indentation
- Syntax highlighting ready
- Expandable panels for better UX
- Scrollable for large data sets

## Error Handling

- Network errors are caught and displayed to users
- Failed report status is clearly marked
- Error messages are shown in detail view
- Graceful fallbacks for missing data
- Loading states prevent confusion

## Testing

The system aligns with backend tests in `ReportManagementTest.php`, including:
- List reports with pagination
- Filter by domain
- Filter by status
- Filter by date range
- Combine multiple filters
- Get specific report
- Handle non-existent reports
- Get recent reports
- Authentication checks
- Permission checks
- Pagination limits (min/max per_page)

## Future Enhancements

Potential improvements:
- Export reports (CSV, PDF, JSON)
- Bulk operations (delete multiple reports)
- Report regeneration
- Advanced analytics dashboard
- Real-time status updates via WebSockets
- Report scheduling
- Custom date range presets (last 7 days, last 30 days, etc.)
- Report comparison tool
- Data visualization charts
- Email notifications for failed reports
- Report archiving

## Performance Considerations

- Pagination implemented to handle large datasets
- Efficient state management with Vue 3 Composition API
- Lazy loading of report details
- Filter application triggers new API request
- JSON data displayed in expandable panels to avoid rendering large data upfront

## API Response Format

### List Reports Response
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "domain_id": 5,
      "report_date": "2025-10-15",
      "status": "processed",
      "data_version": "1.0",
      "created_at": "2025-10-15 10:00:00",
      "updated_at": "2025-10-15 10:05:00"
    }
  ],
  "meta": {
    "total": 100,
    "per_page": 15,
    "current_page": 1,
    "last_page": 7,
    "from": 1,
    "to": 15
  }
}
```

### Get Report Response
```json
{
  "success": true,
  "data": {
    "id": 1,
    "domain_id": 5,
    "report_date": "2025-10-15",
    "status": "processed",
    "data_version": "1.0",
    "raw_data": {
      "source": {"domain": "test.com"},
      "metadata": {"report_date": "2025-10-13"},
      "summary": {"total_requests": 100}
    },
    "processed_data": {
      "metrics": {...}
    },
    "error_message": null,
    "created_at": "2025-10-15 10:00:00",
    "updated_at": "2025-10-15 10:05:00",
    "domain": {
      "id": 5,
      "name": "example.com",
      ...
    }
  }
}
```

### Recent Reports Response
```json
{
  "success": true,
  "data": [
    // Array of up to 10 most recent reports
  ]
}
```

## User Experience

1. **Intuitive Filtering**: Clear filter options with sensible defaults
2. **Visual Feedback**: Loading spinners, status chips, empty states
3. **Responsive Design**: Works on all screen sizes
4. **Quick Access**: Recent reports endpoint for dashboard widgets
5. **Detailed View**: Comprehensive report details in modal
6. **Easy Navigation**: Smooth pagination with page numbers
7. **Clear Status**: Color-coded status indicators
8. **Data Accessibility**: JSON data in readable format

## Integration Points

### With Domain System
- Reports are linked to domains via `domain_id`
- Domain filter uses domain list from `useDomains` composable
- Domain information displayed in report details

### With Permissions System
- Uses `usePermissions` for access control
- Respects `report-read` permission
- Super admin bypass

### With Notification System
- Uses `useNotification` for user feedback
- Success/error messages for operations
- Info messages for future features

## Conclusion

The Reports Management system provides a comprehensive, production-ready solution for viewing and managing domain reports with:

1. Advanced filtering capabilities
2. Detailed report views
3. Efficient pagination
4. Clean, intuitive UI
5. Proper permission controls
6. Excellent user experience
7. Aligned with backend tests
8. Ready for future enhancements

The system is ready for production use and can be easily extended with additional features as needed.

