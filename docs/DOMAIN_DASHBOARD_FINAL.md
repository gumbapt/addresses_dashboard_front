# Domain Dashboard - Final Implementation

## Overview

The Domain Dashboard provides comprehensive analytics for each domain, with the ability to view aggregated data from all reports or individual report data.

## Access Flow

```
Domains List → Click 📊 → Domain Dashboard (with report selector)
```

## Features

### 1. Report Selector (Top of Page)

The dashboard includes a powerful report selector with two modes:

#### "All Reports Combined" (Default)
- **Endpoint**: `GET /api/admin/reports/domain/{domainId}/aggregate`
- **Description**: Shows aggregated data from all reports of the domain
- **Benefits**: 
  - See overall trends
  - Compare across all time periods
  - Get complete picture of domain performance
- **Data Source**: Backend aggregation (optimized)

#### Individual Reports
- **Endpoint**: `GET /api/admin/reports/{reportId}`
- **Description**: Shows data from a specific report date
- **Benefits**:
  - See specific day performance
  - Analyze daily patterns
  - Compare different dates

### 2. Toggle View Button

A button next to the selector allows switching between:
- 📊 **Dashboard View**: Shows charts and cards
- 📋 **Grid View**: Shows all reports as clickable cards

### 3. Statistics Cards (Top Row)

Four key metrics displayed at the top:

#### Total Requests
- **Icon**: Chart line (blue)
- **Aggregated**: Sum of all requests across all reports
- **Individual**: Requests from that specific report
- **Format**: Abbreviated (1.2K, 1.5M)

#### Success Rate
- **Icon**: Check circle (green)
- **Aggregated**: Average success rate across all reports
- **Individual**: Success rate of that specific report
- **Format**: Percentage (98.5%)

#### Daily Average
- **Icon**: Calendar (blue)
- **Aggregated**: Total requests / days covered
- **Individual**: avg_requests_per_hour × 24
- **Format**: Decimal (150.25)

#### Unique Providers
- **Icon**: Domain (orange)
- **Aggregated**: Total unique providers across all reports
- **Individual**: Unique providers in that report
- **Format**: Whole number

### 4. Charts

All charts automatically switch between aggregated and individual data based on selector:

#### Provider Distribution (Donut Chart)
- **Position**: Top Left
- **Aggregated**: Sums all provider counts from all reports
- **Individual**: Top providers from that report
- **Shows**: Top 8 providers
- **Technology**: Shown in tooltip/legend

#### Top States by Requests (Bar Chart)
- **Position**: Top Right
- **Aggregated**: Sums requests by state across all reports
- **Individual**: Top states from that report
- **Shows**: Top 10 states
- **Sort**: By request count (descending)

#### Average Speed by State (Bar Chart)
- **Position**: Bottom Left
- **Aggregated**: Averages speed by state across reports
- **Individual**: Top speeds from that report
- **Shows**: Top 10 states with speed data
- **Unit**: Mbps

#### Technology Distribution (Donut Chart)
- **Position**: Bottom Right
- **Aggregated**: Sums technology counts from all providers
- **Individual**: Technology distribution from that report
- **Technologies**: Mobile, Fiber, Cable, DSL, Satellite, Wireless, Unknown

## API Endpoints

### Aggregated Data
```
GET /api/admin/reports/domain/{domainId}/aggregate
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": {
    "domain": {
      "id": 1,
      "name": "example.com"
    },
    "period": {
      "total_reports": 10,
      "first_report": "2025-10-01",
      "last_report": "2025-10-10",
      "days_covered": 10
    },
    "summary": {
      "total_requests": 15000,
      "total_failed": 500,
      "avg_success_rate": 96.7,
      "avg_requests_per_hour": 62.5,
      "total_unique_providers": 25,
      "total_unique_states": 43,
      "total_unique_zip_codes": 500
    },
    "providers": [
      {
        "provider_id": 1,
        "name": "Vivo",
        "slug": "vivo",
        "technology": "Fiber",
        "total_count": 5000,
        "avg_success_rate": 98.5,
        "avg_speed": 200.5,
        "report_count": 10
      }
    ],
    "geographic": {
      "states": [
        {
          "state_id": 1,
          "code": "SP",
          "name": "São Paulo",
          "total_requests": 8000,
          "avg_success_rate": 97.5,
          "avg_speed": 180.2,
          "report_count": 10
        }
      ],
      "cities": [...],
      "zip_codes": [...]
    },
    "trends": [
      {
        "date": "2025-10-01",
        "report_id": 1,
        "total_requests": 1500,
        "success_rate": 96.5,
        "failed_requests": 53,
        "avg_requests_per_hour": 62.5
      }
    ]
  }
}
```

### Individual Report Data
```
GET /api/admin/reports/{reportId}
Authorization: Bearer {token}

Response: (as shown in previous documentation)
```

## Data Processing

### Aggregated Mode (Backend-Calculated)
- ✅ Backend does all aggregation
- ✅ Optimized database queries
- ✅ Consistent calculations
- ✅ Fast response

**Calculations:**
- Providers: Sum of all counts
- States: Sum of all requests
- Speed: Average across all reports
- Technology: Sum from all providers
- Success Rate: Average of all reports
- Daily Average: Total requests / days covered

### Individual Mode (Direct Report Data)
- ✅ Shows exact data from report
- ✅ No calculations needed
- ✅ Reflects specific day

## User Experience

### Initial Load
1. Opens with "All Reports Combined" selected
2. Shows aggregated data from backend
3. Displays period information (X reports, date range, days covered)

### Switching Reports
1. Click dropdown
2. See list of all reports with:
   - Date as main title
   - Status indicator (colored chip)
   - Report ID and version in subtitle
3. Select any report
4. Dashboard updates instantly

### Toggle to Grid View
1. Click list icon button
2. See all reports as cards
3. Click any card to select it
4. Click dashboard icon to return to chart view

## Implementation Details

### Composable (`useDomainDashboard.ts`)

Two main functions:
- `loadAggregatedStats(domainId)` - Loads from `/reports/domain/{id}/aggregate`
- `loadDashboardStats(reportId)` - Loads from `/reports/{id}`

Computed properties automatically switch based on which data is loaded:
- If `aggregatedData` exists → use aggregated
- If `reportData` exists → use individual
- Charts and cards update reactively

### Page Component (`pages/domains/[id]/dashboard.vue`)

**Lifecycle:**
1. `onMounted`: Load domains, reports list, and aggregated data
2. Auto-select "All Reports"
3. Watch `selectedReportId` for changes
4. Load appropriate data (aggregated or individual)

**State Management:**
- `selectedReportId`: 'all' or number
- `showAllReports`: boolean for grid view
- Data flows from composable automatically

## Period Information

When "All Reports" is selected, the subtitle shows:
```
10 reports | 2025-10-01 to 2025-10-10 (10 days)
```

This helps users understand the scope of the aggregated data.

## Performance Benefits

### With Aggregated Endpoint
- ✅ Single API call for all aggregated data
- ✅ Backend handles complex calculations
- ✅ Database-level optimization
- ✅ Consistent results
- ✅ Fast response time

### Previous Approach (Frontend Aggregation)
- ❌ Multiple API calls (one per report)
- ❌ Heavy frontend processing
- ❌ Slow with many reports
- ❌ Memory intensive

## Data Accuracy

### Aggregated Data
- Providers: Exact sums from database
- States: Exact sums from database
- Speed: Weighted averages
- Success Rate: Proper averaging
- All calculations done in backend with SQL

### Individual Data
- Exact data from report's `raw_data`
- No transformations
- As collected on that specific date

## Example Use Cases

### Use Case 1: Overall Performance
**Goal**: See how the domain is performing overall
**Action**: Keep "All Reports Combined" selected
**Result**: See total metrics across all time

### Use Case 2: Specific Day Analysis
**Goal**: Investigate what happened on 2025-10-15
**Action**: Select the report for that date
**Result**: See exact data for that day

### Use Case 3: Compare Dates
**Goal**: Compare performance between two days
**Action**: 
1. Select first report, note metrics
2. Select second report, note metrics
3. Compare values

### Use Case 4: Browse All Reports
**Goal**: See which reports exist
**Action**: Click grid view icon
**Result**: See all reports as cards, click to select

## Technical Stack

- **Charts**: ApexCharts (donut and bar types)
- **State**: Vue 3 Composition API
- **Data Flow**: Reactive computed properties
- **API Client**: Reusable ApiClient class
- **Type Safety**: Full TypeScript support

## Future Enhancements

Potential improvements:
1. **Date Range Selector**: Filter aggregated data by date range
2. **Comparison Mode**: Side-by-side comparison of two reports
3. **Export**: Download aggregated data as PDF/CSV
4. **Trends Graph**: Line chart showing metrics over time using `trends` array
5. **City/ZIP Analysis**: Additional charts for geographic data
6. **Provider Details**: Click on provider to see detailed breakdown
7. **Real-time Updates**: Auto-refresh when new reports arrive
8. **Custom Aggregation**: Select specific reports to aggregate
9. **Benchmarking**: Compare against industry averages
10. **Alerts**: Set thresholds and get notifications

## Conclusion

The Domain Dashboard provides a powerful, flexible analytics interface that:

1. ✅ Shows aggregated data by default (backend-calculated)
2. ✅ Allows drilling down to specific reports
3. ✅ Provides fast, accurate visualizations
4. ✅ Uses optimal backend endpoint for aggregation
5. ✅ Offers intuitive navigation
6. ✅ Maintains excellent performance
7. ✅ Supports both overview and detail analysis

The implementation leverages backend optimization for the best user experience and system performance.

