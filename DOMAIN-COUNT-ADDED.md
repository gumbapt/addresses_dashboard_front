# 📊 Domain Count in Groups Table

## Feature Added
Now the "Domains" column in the Domain Groups table displays the actual count of domains in each group, fetched from the API.

## Changes Made

### 1. Repository Layer - Request with Count
**File:** `infrastructure/repositories/DomainGroupRepository.ts`

Added `with_count=true` parameter to always request domain counts:

```typescript
async list(params?: {
  page?: number;
  per_page?: number;
  search?: string;
  is_active?: boolean;
  with_count?: boolean;  // New parameter
}): Promise<DomainGroupsListResponse> {
  try {
    const queryParams = new URLSearchParams();
    
    // ... other params ...
    
    // Always request domain count for display in the table
    queryParams.append('with_count', 'true');
    
    const url = `/domain-groups?${queryParams.toString()}`;
    console.log('🔍 DomainGroupRepository - list URL:', url);
    const response = await this.apiClient.get<DomainGroupsListResponse>(url);
    console.log('🔍 DomainGroupRepository - list response:', response);
    return response;
  }
  // ...
}
```

### 2. Service Layer - Debug Logging
**File:** `services/DomainGroupService.ts`

Added detailed logging to see domain counts:

```typescript
async getDomainGroups(filters?: {
  page?: number;
  per_page?: number;
  search?: string;
  is_active?: boolean;
}): Promise<ApiResponse<{ data: DomainGroup[]; pagination: any }>> {
  try {
    console.log('🔍 DomainGroupService - getDomainGroups called with filters:', filters);
    const response = await this.domainGroupRepository.list(filters);
    console.log('🔍 DomainGroupService - getDomainGroups response:', response);
    
    // Log domain counts for debugging
    if (response.data) {
      response.data.forEach((group: DomainGroup) => {
        console.log(`🔍 Group "${group.name}" has domains_count:`, group.domains_count);
      });
    }
    // ...
  }
}
```

### 3. Already Existing - UI Display
The UI was already prepared to display the count:

**Composable:** `composables/useDomainGroups.ts`
```typescript
const formattedGroups = computed(() => {
  return domainGroups.value.map(group => ({
    ...group,
    domainsCount: group.domains_count || 0,  // Maps from API field
    limitLabel: group.max_domains 
      ? `${group.domains_count || 0}/${group.max_domains}`
      : 'Unlimited',
    // ...
  }));
});
```

**Component:** `pages/domain-groups/index.vue`
```vue
<td>
  <v-chip
    color="info"
    variant="tonal"
    size="small"
    @click="viewGroupDomains(group)"
    style="cursor: pointer"
  >
    {{ group.domainsCount }} domains
  </v-chip>
</td>
```

## API Expected Response Format

The API should now return domain counts with each group:

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Production Sites",
      "slug": "production-sites",
      "description": "All production domains",
      "is_active": true,
      "max_domains": 10,
      "domains_count": 5,        // ← This field!
      "available_domains": 5,
      "has_reached_limit": false,
      "created_at": "2025-11-10T12:00:00Z",
      "updated_at": "2025-11-10T12:00:00Z"
    },
    {
      "id": 2,
      "name": "Testing",
      "slug": "testing",
      "domains_count": 3,         // ← Count for each group
      "max_domains": 23,
      // ...
    }
  ],
  "pagination": {
    "current_page": 1,
    "per_page": 15,
    "total": 2,
    "last_page": 1
  }
}
```

## How to Verify

1. **Open the Domain Groups page** (`/domain-groups`)

2. **Open Browser Console** (F12 → Console)

3. **Look for logs with 🔍 emoji**:
   ```
   🔍 DomainGroupRepository - list URL: /domain-groups?with_count=true
   🔍 DomainGroupRepository - list response: { ... }
   🔍 DomainGroupService - getDomainGroups response: { ... }
   🔍 Group "Production Sites" has domains_count: 5
   🔍 Group "Testing" has domains_count: 3
   ```

4. **Check the table** - Each group should show:
   - **Domains column:** Blue chip with "X domains"
   - **Limit column:** "X/Y" (e.g., "5/10") if limited, or "Unlimited"

## Visual Result

| Name              | Description         | **Domains**  | Limit    | Status | Created At |
|-------------------|---------------------|--------------|----------|--------|------------|
| Production Sites  | All production...   | **5 domains** | 5/10     | Active | 11/10/2025 |
| Testing           | Test environment    | **3 domains** | 3/23     | Active | 11/10/2025 |
| Development       | Dev sites           | **0 domains** | Unlimited| Active | 11/10/2025 |

## Benefits

✅ **Real-time count** - Shows actual number of domains in each group
✅ **Interactive** - Click on the count chip to view domain details
✅ **Visual feedback** - Color-coded chips (info = has domains, grey = empty)
✅ **Limit tracking** - Shows usage vs. limit in "Limit" column
✅ **Full indicator** - Red chip when group reaches max capacity

## Troubleshooting

If counts show as "0 domains" for all groups:
1. Check console logs to see if API is returning `domains_count`
2. Verify API endpoint supports `with_count=true` parameter
3. Check if backend is counting domains correctly

If the API doesn't support the parameter yet:
- Backend needs to add logic to count domains per group
- Can use SQL: `SELECT *, (SELECT COUNT(*) FROM domains WHERE domain_group_id = domain_groups.id) as domains_count FROM domain_groups`

