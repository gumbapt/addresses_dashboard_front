# Domains Management System

This document describes the Domains management system implemented in the frontend.

## Overview

The Domains system allows administrators to manage ISP domains and their WordPress integrations. Each domain represents a client website that connects to the platform through an API.

## Features

### 1. Domain Listing
- View all domains with pagination
- Search by name or domain URL
- Filter by active/inactive status
- Display domain information: name, URL, site ID, timezone, status, creation date

### 2. Domain CRUD Operations

#### Create Domain
- Required fields:
  - Name (will auto-generate slug)
  - Domain URL (without http/https)
- Optional fields:
  - Site ID
  - Timezone (default: UTC)
  - WordPress Version
  - Plugin Version
  - Active status (default: true)

#### Update Domain
- All fields are editable
- Slug is auto-regenerated when name changes
- Can activate/deactivate domains

#### Delete Domain
- Permanently remove domain from the system
- Confirmation dialog required

### 3. API Key Management
- Each domain has a unique API key (format: `dmn_live_XXXXXX`)
- View API key in a secure dialog
- Copy to clipboard functionality
- Regenerate API key (with confirmation)
- Only users with `domain-update` permission can regenerate

## Permissions

The system uses the following permissions:

- `domain-read`: View domains list and details
- `domain-create`: Create new domains
- `domain-update`: Edit domains and regenerate API keys
- `domain-delete`: Delete domains

Super admins have access to all operations regardless of specific permissions.

## Architecture

### Type Definitions (`types/api.d.ts`)

```typescript
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
```

### Repository Layer (`infrastructure/repositories/DomainRepository.ts`)

Handles direct API communication:
- `getDomains(page, perPage, search?, isActive?)` - List domains with filters
- `getDomain(id)` - Get single domain
- `createDomain(data)` - Create new domain
- `updateDomain(id, data)` - Update domain
- `deleteDomain(id)` - Delete domain
- `regenerateApiKey(id)` - Regenerate domain API key

### Service Layer (`services/DomainService.ts`)

Business logic layer that wraps repository calls and handles errors consistently.

### Composable (`composables/useDomains.ts`)

State management and reactive data:
- Domain list state
- Pagination state
- Loading and error states
- Formatted domain data for display
- Navigation functions (nextPage, prevPage, goToPage)
- CRUD operation functions

### UI Component (`pages/domains/index.vue`)

Full-featured domain management interface with:
- Search and filter controls
- Data table with actions
- Create/Edit/Delete dialogs
- API key viewer with regeneration
- Responsive design
- Loading states
- Error handling
- Success notifications

## API Endpoints

All endpoints are prefixed with `/api/admin/domains`:

- `GET /api/admin/domains?page={page}&per_page={perPage}&search={search}&is_active={boolean}`
  - List domains with optional filters
  
- `GET /api/admin/domains/{id}`
  - Get single domain details
  
- `POST /api/admin/domains`
  - Create new domain
  
- `PUT /api/admin/domains/{id}`
  - Update domain
  
- `DELETE /api/admin/domains/{id}`
  - Delete domain
  
- `POST /api/admin/domains/{id}/regenerate-api-key`
  - Regenerate domain API key

## UI Features

### Filters
- **Search**: Filter by domain name or URL
- **Status**: Filter by active/inactive status
- Clear filters button

### Table Columns
1. Name (with slug subtitle)
2. Domain URL (clickable link)
3. Site ID
4. Status (chip: green for active, red for inactive)
5. Timezone
6. Created At
7. Actions (View API Key, Edit, Delete)

### Dialogs

#### Create/Edit Domain Dialog
Form fields:
- Name (required)
- Domain URL (required)
- Site ID (optional)
- Timezone (select dropdown)
- WordPress Version (optional)
- Plugin Version (optional)
- Active toggle

#### API Key Dialog
- Displays current API key
- Copy to clipboard button
- Regenerate button (requires confirmation)
- Security notice

#### Delete Confirmation Dialog
- Shows domain name
- Requires explicit confirmation
- Cancel/Delete actions

## Navigation

The Domains link appears in the sidebar under the "Management" section, but only if the user has the `domain-read` permission.

Icon: `global-outline`

## Security

- All routes are protected by authentication middleware
- Permission-based access control for all operations
- API keys are only shown in secure dialog (not in table)
- API key regeneration requires confirmation
- Delete operations require confirmation
- Super admin can perform all operations

## Notifications

The system provides user feedback through notifications:
- Success: "Domain created/updated/deleted successfully"
- Success: "API key regenerated successfully"
- Success: "API key copied to clipboard"
- Error: Displays specific error messages from API

## Pagination

- Default: 15 items per page
- Options: 10, 15, 25, 50 items per page
- Shows current page, total pages, and item range
- Navigation: Previous, Next, Direct page selection
- Disabled when only 1 page exists

## Unique Features

1. **Auto-generated Slug**: The backend automatically generates unique slugs from domain names
2. **API Key Format**: Keys follow the pattern `dmn_live_XXXXX`
3. **Timezone Support**: Allows setting timezone for each domain
4. **WordPress Integration**: Tracks WordPress and plugin versions
5. **Settings**: Flexible JSON settings field for future extensibility

## Error Handling

- Network errors are caught and displayed to users
- Validation errors from API are shown in forms
- Loading states prevent duplicate submissions
- Graceful fallbacks for missing data

## Testing

The system aligns with backend tests in `DomainManagementTest.php`, including:
- Pagination
- Search functionality
- Status filtering
- Permission-based access
- CRUD operations
- API key regeneration
- Unique slug generation

## Future Enhancements

Potential improvements:
- Bulk operations (activate/deactivate multiple domains)
- Domain statistics and usage metrics
- Connection status monitoring
- Activity logs
- Advanced settings editor
- Domain import/export
- Custom API key prefix

