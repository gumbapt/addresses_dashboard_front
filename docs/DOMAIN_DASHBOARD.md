# Domain Dashboard System

This document describes the Domain Dashboard feature that provides analytics and visualizations for each domain.

## Overview

The Domain Dashboard is a dedicated analytics page that displays comprehensive statistics and visualizations for a specific domain. It aggregates data from all reports associated with that domain and presents it in an easy-to-understand format with cards and charts.

## Access

### From Domains List
Users can access a domain's dashboard by clicking the eye icon (👁️) in the actions column of the domains table. This icon is visible to all users who have the `domain-read` permission.

### Route
The dashboard is accessible at: `/domains/:id/dashboard`

Where `:id` is the domain ID.

## Dashboard Components

### 1. Top Statistics Cards

Four key metric cards are displayed at the top of the dashboard:

#### Total Requests
- **Icon**: Chart line (mdi-chart-line)
- **Color**: Primary (blue)
- **Description**: Total number of requests made to this domain
- **Format**: Abbreviated (e.g., 1.2K, 1.5M)

#### Success Rate
- **Icon**: Check circle (mdi-check-circle)
- **Color**: Success (green)
- **Description**: Percentage of successful requests
- **Format**: Percentage with 1 decimal place (e.g., 98.5%)

#### Daily Average
- **Icon**: Calendar today (mdi-calendar-today)
- **Color**: Info (blue)
- **Description**: Average number of requests per day
- **Format**: Decimal with 2 places (e.g., 150.25)

#### Unique Providers
- **Icon**: Domain (mdi-domain)
- **Color**: Warning (orange)
- **Description**: Number of unique internet service providers
- **Format**: Whole number

### 2. Charts

#### Provider Distribution (Donut Chart)
- **Type**: Donut Chart
- **Position**: Top Left
- **Description**: Shows the distribution of requests across different internet service providers
- **Data**: Provider name and count
- **Features**:
  - Percentage labels on each segment
  - Total count in the center
  - Legend at the bottom
  - Responsive design

#### Top States by Requests (Bar Chart)
- **Type**: Vertical Bar Chart
- **Position**: Top Right
- **Description**: Shows which states (UF) have the most requests
- **Data**: State name and request count
- **Features**:
  - Blue bars
  - Y-axis shows request count
  - X-axis shows state names
  - Grid lines for easier reading

#### Average Speed by State (Bar Chart)
- **Type**: Vertical Bar Chart
- **Position**: Bottom Left
- **Description**: Shows average internet speed (Mbps) by state
- **Data**: State name and average speed
- **Features**:
  - Green bars
  - Y-axis shows speed in Mbps
  - X-axis shows state names
  - Grid lines for easier reading

#### Technology Distribution (Donut Chart)
- **Type**: Donut Chart
- **Position**: Bottom Right
- **Description**: Shows the distribution of connection technologies (Fiber, Cable, DSL, etc.)
- **Data**: Technology type and count
- **Features**:
  - Percentage labels on each segment
  - Total count in the center
  - Legend at the bottom
  - Responsive design

## Data Structure

### API Response Format

```typescript
interface DomainDashboardStats {
  total_requests: number;
  success_rate: number;
  daily_average: number;
  unique_providers: number;
  provider_distribution: ProviderDistribution[];
  top_states: StateStats[];
  average_speed_by_state: StateSpeedStats[];
  technology_distribution: TechnologyDistribution[];
}

interface ProviderDistribution {
  provider: string;
  count: number;
  percentage: number;
}

interface StateStats {
  state: string;           // UF code (e.g., "SP", "RJ")
  state_name: string;      // Full name (e.g., "São Paulo")
  requests: number;
}

interface StateSpeedStats {
  state: string;
  state_name: string;
  average_speed: number;   // In Mbps
}

interface TechnologyDistribution {
  technology: string;      // e.g., "Fiber", "Cable", "DSL"
  count: number;
  percentage: number;
}
```

## API Endpoint

```
GET /api/admin/domains/:id/dashboard
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": {
    "total_requests": 150000,
    "success_rate": 98.5,
    "daily_average": 150.25,
    "unique_providers": 15,
    "provider_distribution": [
      {
        "provider": "Vivo",
        "count": 50000,
        "percentage": 33.33
      },
      {
        "provider": "Claro",
        "count": 40000,
        "percentage": 26.67
      }
    ],
    "top_states": [
      {
        "state": "SP",
        "state_name": "São Paulo",
        "requests": 50000
      },
      {
        "state": "RJ",
        "state_name": "Rio de Janeiro",
        "requests": 30000
      }
    ],
    "average_speed_by_state": [
      {
        "state": "SP",
        "state_name": "São Paulo",
        "average_speed": 150.5
      }
    ],
    "technology_distribution": [
      {
        "technology": "Fiber",
        "count": 80000,
        "percentage": 53.33
      },
      {
        "technology": "Cable",
        "count": 50000,
        "percentage": 33.33
      }
    ]
  }
}
```

## Features

### Loading State
- Shows a spinner while data is being loaded
- Prevents user interaction during loading

### Error Handling
- Displays error message if data fails to load
- Provides clear feedback to the user

### Empty States
- Each chart shows a placeholder when no data is available
- Includes an icon and message
- Maintains layout consistency

### Responsive Design
- Cards stack on mobile devices
- Charts resize appropriately
- Legends move to bottom on smaller screens

### Navigation
- "Back to Domains" button at the top
- Returns user to domains list

## Permissions

- **Required Permission**: `domain-read`
- **Route Protection**: Enforced by middleware
- **Super Admin**: Has automatic access

## User Experience

### Visual Design
- Clean, modern interface
- Color-coded cards for quick identification
- Consistent chart styling
- Adequate spacing and padding

### Data Visualization
- Easy-to-read charts
- Percentage indicators on donut charts
- Clear axis labels on bar charts
- Responsive legend placement

### Performance
- Single API call for all data
- Efficient data processing
- Smooth chart rendering with ApexCharts

## Number Formatting

### Large Numbers (Cards)
- Numbers >= 1,000,000: "1.2M"
- Numbers >= 1,000: "1.5K"
- Numbers < 1,000: Displayed as-is

### Percentages
- Format: "XX.X%" (one decimal place)
- Example: "98.5%"

### Decimals
- Format: "XX.XX" (two decimal places)
- Example: "150.25"

## Technical Implementation

### Composable (`useDomainDashboard.ts`)
- Fetches dashboard data from API
- Provides computed properties for chart data
- Handles loading and error states
- Formats data for ApexCharts

### Page Component (`pages/domains/[id]/dashboard.vue`)
- Uses Nuxt 3 dynamic routing
- Implements chart configurations
- Handles responsive layouts
- Manages navigation

### Chart Library
- **Library**: ApexCharts
- **Wrapper**: vue3-apexcharts
- **Chart Types**: Donut, Bar

## Future Enhancements

Potential improvements:

1. **Date Range Filter**: Allow users to select date range for statistics
2. **Export Features**: Download charts as images or PDF
3. **Comparison**: Compare multiple domains side-by-side
4. **Real-time Updates**: WebSocket integration for live data
5. **Drill-down**: Click on chart segments to see detailed data
6. **Additional Metrics**: More KPIs and charts
7. **Historical Trends**: Line charts showing trends over time
8. **Predictive Analytics**: Forecast future metrics
9. **Alerts**: Set thresholds and receive notifications
10. **Custom Dashboards**: User-configurable layouts

## Best Practices

### Data Refresh
- Data is loaded on page mount
- Consider adding a refresh button for manual updates
- Could implement auto-refresh every X minutes

### Error Recovery
- Retry button on error states
- Clear error messages
- Fallback to cached data if available

### Performance
- Lazy load charts for better initial load time
- Use chart animations sparingly
- Optimize API response size

## Integration

### With Reports System
- Dashboard data is aggregated from reports
- Linked to the same domain
- Filters processed reports only

### With Domains System
- Accessed from domains table
- Shows domain name in header
- Back button returns to domains list

## Accessibility

- Proper color contrast ratios
- Icon descriptions (title attributes)
- Keyboard navigation support
- Screen reader friendly labels

## Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Responsive on mobile and tablet
- Graceful degradation for older browsers

## Conclusion

The Domain Dashboard provides a comprehensive, visual overview of domain performance and statistics. It helps administrators quickly understand:

- How many requests the domain receives
- Success rate of those requests
- Which providers are most common
- Geographic distribution of users
- Connection technologies in use
- Average internet speeds by region

The dashboard is designed for ease of use, with clear visualizations and instant access from the domains table.

