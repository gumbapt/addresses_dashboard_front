# Global Domain Ranking Dashboard

## Overview

The Global Domain Ranking Dashboard provides a comprehensive view of all domains' performance, allowing administrators to compare and rank domains based on various metrics.

## Access

**Route**: `/global-dashboard`

**Sidebar**: "Global Dashboard" (under Home section)

**Icon**: `chart-pie-outline`

**Permission Required**: `report-read`

## Features

### 1. Global Statistics Cards (Top Row)

Four key metrics showing overall platform statistics:

#### Total Domains
- **Icon**: Domain (blue)
- **Value**: Number of active domains with reports
- **Description**: Total domains being tracked

#### Total Requests
- **Icon**: Chart line (green)
- **Value**: Sum of all requests across all domains
- **Format**: Abbreviated (1.2K, 1.5M)
- **Description**: Cumulative requests

#### Average Success Rate
- **Icon**: Check circle (blue)
- **Value**: Average success rate across all domains
- **Format**: Percentage (XX.X%)
- **Description**: Platform-wide success metric

#### Average Speed
- **Icon**: Speedometer (orange)
- **Value**: Average speed across all domains
- **Format**: Mbps or N/A
- **Description**: Average connection speed

### 2. Top 3 Podium

Visual podium display for the top 3 performing domains:

#### 1st Place (Center, Larger)
- **Background**: Gold/warning color
- **Icon**: Trophy 👑
- **Size**: Larger card, elevated
- **Displays**:
  - Domain name
  - Score (large)
  - Total requests
  - Success rate
  - "View Dashboard" button (gold)

#### 2nd Place (Left)
- **Background**: Silver/grey color
- **Icon**: Medal (grey)
- **Displays**: Same metrics as 1st place
- **Button**: "View Dashboard" (primary tonal)

#### 3rd Place (Right)
- **Background**: Bronze/orange color
- **Icon**: Medal (orange)
- **Displays**: Same metrics as 1st place
- **Button**: "View Dashboard" (primary tonal)

### 3. Complete Ranking Table

Full table with all domains ranked:

#### Columns

1. **Rank**
   - Shows position number
   - Top 3 have medal chips (gold, silver, bronze)
   - Others have numbered chips

2. **Domain**
   - Domain name (bold)
   - Slug (caption, grey)

3. **Score**
   - Overall performance score
   - Primary colored chip

4. **Total Requests**
   - Abbreviated format
   - Bold text

5. **Success Rate**
   - Percentage
   - Color-coded chip:
     - >= 90%: Green (success)
     - >= 70%: Yellow (warning)
     - < 70%: Red (error)

6. **Avg Speed**
   - In Mbps
   - Shows "N/A" if no speed data

7. **Providers**
   - Number of unique providers
   - Outlined chip

8. **States**
   - Number of unique states
   - Outlined chip

9. **Reports**
   - Total number of reports
   - Plain number

10. **Period**
    - Start and end dates
    - Days covered

11. **Actions**
    - Eye icon to view domain dashboard

### 4. Sort Options

Dropdown selector at the top right with four sorting options:

- **Overall Score** (default): Ranks by calculated score
- **Total Requests**: Ranks by volume (highest first)
- **Success Rate**: Ranks by success percentage (highest first)
- **Average Speed**: Ranks by connection speed (fastest first)

## API Endpoint

```
GET /api/admin/reports/global/domain-ranking?sort_by={sortBy}
Authorization: Bearer {token}

Query Parameters:
- sort_by: score | volume | success | speed (default: score)

Response:
{
  "success": true,
  "data": {
    "ranking": [
      {
        "rank": 1,
        "domain": {
          "id": 3,
          "name": "domain3.com",
          "slug": "domain3-com"
        },
        "metrics": {
          "total_requests": 3000,
          "success_rate": 92.0,
          "avg_speed": 150.5,
          "score": 95.5,
          "unique_providers": 15,
          "unique_states": 20
        },
        "coverage": {
          "total_reports": 10,
          "period_start": "2025-10-01",
          "period_end": "2025-10-10",
          "days_covered": 10
        }
      }
    ],
    "sort_by": "score",
    "total_domains": 3
  }
}
```

## Sorting Behavior

### By Score (Default)
- Uses overall calculated score
- Combines multiple metrics
- Best overall performance first

### By Volume
- Orders by total_requests (descending)
- Shows domains with most traffic first
- Useful for identifying high-traffic domains

### By Success
- Orders by success_rate (descending)
- Shows most reliable domains first
- Useful for quality assessment

### By Speed
- Orders by avg_speed (descending)
- Shows fastest domains first
- Useful for performance comparison
- Domains without speed data appear last

## Features

### Inactive Domain Exclusion
- Only shows active domains
- Inactive domains are automatically filtered out
- Ensures ranking reflects current operations

### Empty State
- Shows message when no domains have reports
- Returns empty ranking array
- Total domains count is 0

### Error Handling
- Invalid sort_by parameter returns 400 error
- Shows error message to user
- Valid options: score, volume, success, speed

## User Experience

### Visual Hierarchy
1. **Global stats** show platform overview
2. **Top 3 podium** highlights best performers
3. **Complete table** allows detailed comparison

### Color Coding
- **Success Rate**:
  - Green (>= 90%): Excellent
  - Yellow (>= 70%): Good
  - Red (< 70%): Needs attention

- **Rank Medals**:
  - Gold (#1)
  - Silver (#2)
  - Bronze (#3)

### Navigation
- Click any domain's dashboard icon
- Goes directly to that domain's analytics
- Maintains context

## Use Cases

### Use Case 1: Platform Overview
**Goal**: See overall platform health
**View**: Global stats cards
**Insight**: Total domains, requests, average success rate

### Use Case 2: Identify Top Performers
**Goal**: Find best domains
**View**: Top 3 podium
**Action**: Learn from best performers

### Use Case 3: Find Problem Domains
**Goal**: Identify underperforming domains
**Sort By**: Success rate (ascending would be nice - future)
**View**: Bottom of ranking
**Action**: Investigate issues

### Use Case 4: Traffic Leaders
**Goal**: See which domains have most traffic
**Sort By**: Volume
**View**: Top of ranking
**Insight**: Resource allocation

### Use Case 5: Speed Comparison
**Goal**: Compare connection speeds
**Sort By**: Speed
**View**: Full ranking
**Insight**: Geographic or provider patterns

## Technical Implementation

### Architecture
```
Page (global-dashboard/index.vue)
       ↓
Composable (useGlobalRanking.ts)
       ↓
Service (ReportService.ts)
       ↓
Repository (ReportRepository.ts)
       ↓
API (/reports/global/domain-ranking)
```

### Composable Features
- Reactive ranking data
- Loading and error states
- Current sort tracking
- Formatted ranking with display-ready data
- Top 3 extraction
- Global stats calculation

### Page Features
- Responsive design
- Sort selector
- Visual podium for top 3
- Comprehensive data table
- Color-coded metrics
- Direct navigation to domain dashboards

## Permissions

- **Required**: `report-read`
- **Super Admin**: Automatic access
- **Unauthenticated**: Redirected to login

## Future Enhancements

Potential improvements:

1. **Filtering**: Filter by domain status, date range
2. **Export**: Download ranking as CSV/PDF
3. **Charts**: Visual comparison charts
4. **Trends**: Show ranking changes over time
5. **Grouping**: Group by category or region
6. **Search**: Search domains in ranking
7. **Comparison**: Select 2+ domains to compare
8. **Alerts**: Notify when domain drops in ranking
9. **Historical**: View past rankings
10. **Custom Scores**: Configure score calculation
11. **Benchmarks**: Industry comparison
12. **Detailed Metrics**: Expandable rows with more data

## Performance

- Single API call for all data
- Backend calculates ranking
- Efficient table rendering
- Responsive design
- Fast sort switching

## Security

- Authentication required
- Permission-based access
- Only active domains shown
- Secure API communication

## Conclusion

The Global Domain Ranking Dashboard provides administrators with:

1. ✅ Platform-wide overview
2. ✅ Performance comparison across domains
3. ✅ Multiple sorting options
4. ✅ Visual top 3 podium
5. ✅ Detailed metrics table
6. ✅ Easy navigation to domain details
7. ✅ Color-coded performance indicators
8. ✅ Responsive design

This dashboard helps identify top performers, problem domains, and understand overall platform health at a glance.

