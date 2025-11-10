# 🔍 Domain Groups - View Domains Debug Fix

## Problem
When clicking the "eye" icon to view domains in a group:
- First time: List appears but shows no domains
- Second time: List appears empty

## Root Cause Analysis
The issue was that the API response was not being parsed correctly. The actual API response format is:

```json
{
  "success": true,
  "data": {
    "group_name": "Testing",
    "domains": [...],      // <- Array of domains here!
    "total": 5,
    "max_domains": 23,
    "available": 18
  }
}
```

The code was trying to access `data.data` or treating `data` as an array, when it should have been accessing `data.domains`.

## Solution Implemented

### 1. Added Debug Logging (3 levels)
**Repository Level** (`DomainGroupRepository.ts`):
```typescript
async getGroupDomains(id: number): Promise<any> {
  console.log('🔍 DomainGroupRepository - getGroupDomains called with id:', id);
  const response = await this.apiClient.get<any>(`/domain-groups/${id}/domains`);
  console.log('🔍 DomainGroupRepository - getGroupDomains raw response:', response);
  return response;
}
```

**Service Level** (`DomainGroupService.ts`):
```typescript
async getGroupDomains(id: number): Promise<ApiResponse<Domain[]>> {
  console.log('🔍 DomainGroupService - getGroupDomains called with id:', id);
  const response = await this.domainGroupRepository.getGroupDomains(id);
  console.log('🔍 DomainGroupService - getGroupDomains response:', response);
  
  // Handle response format: { success: true, data: { group_name, domains: [...], total, max_domains, available } }
  if (response.success) {
    const domains = response.data?.domains || [];
    console.log('🔍 DomainGroupService - extracted domains:', domains);
    
    return { success: true, data: domains };
  }
  // ...
}
```

**Component Level** (`pages/domain-groups/index.vue`):
```typescript
const loadGroupDomainsData = async (groupId: number) => {
  console.log('🔍 Loading domains for group ID:', groupId);
  const result = await getGroupDomains(groupId);
  console.log('🔍 Result from getGroupDomains:', result);
  
  if (result.success && result.data) {
    // API returns: { success: true, data: Domain[] } after service processes it
    const domains = result.data;
    console.log('🔍 Setting groupDomains to:', domains);
    groupDomains.value = domains;
  }
  // ...
}
```

### 2. Refactored Domain Loading
Created dedicated function `loadGroupDomainsData()` that:
- Handles loading state
- Logs all steps
- Handles multiple response formats
- Sets `groupDomains.value` correctly

### 3. Fixed DELETE with Body
Changed from `delete()` to `deleteWithBody()` for removing domains:
```typescript
async removeDomainsFromGroup(id: number, domainIds: number[]): Promise<ApiResponse<any>> {
  return await this.apiClient.deleteWithBody<ApiResponse<any>>(
    `/domain-groups/${id}/domains`, 
    { domain_ids: domainIds }
  );
}
```

## How to Debug

1. **Open Browser Console** (F12 → Console tab)

2. **Click the eye icon** on any domain group

3. **Look for logs with 🔍 emoji**:
   ```
   🔍 Loading domains for group ID: 1
   🔍 DomainGroupRepository - getGroupDomains called with id: 1
   🔍 DomainGroupRepository - getGroupDomains raw response: { ... }
   🔍 DomainGroupService - getGroupDomains response: { ... }
   🔍 DomainGroupService - extracted domains: [ ... ]
   🔍 Result from getGroupDomains: { ... }
   🔍 Setting groupDomains to: [ ... ]
   ```

4. **Check the response format**:
   - Raw API response: `{ success: true, data: { group_name, domains: [...], total, max_domains, available } }`
   - After service processing: `{ success: true, data: Domain[] }`
   - Are there domains in the response?
   - Is the array being extracted correctly from `data.domains`?

## Actual API Response Format

```json
{
  "success": true,
  "data": {
    "group_name": "Testing",
    "domains": [
      {
        "id": 1,
        "domain_group_id": 2,
        "name": "zip.50g.io",
        "slug": "zip-50g-io",
        "domain_url": "http://zip.50g.io",
        "site_id": "wp-zip-daily-test",
        "status": "active",
        "is_active": true,
        ...
      }
    ],
    "total": 5,
    "max_domains": 23,
    "available": 18
  }
}
```

The key fix was changing from `response.data.data` to `response.data.domains` in the service layer.

## Expected Behavior

✅ **Working correctly**:
- Logs show domains being returned from API
- Logs show domains being extracted correctly
- UI displays the domains in the table

❌ **Still not working**:
- Check if API is returning domains at all
- Verify the response structure matches what we're expecting
- Look for any error messages (❌ emoji)

## Files Modified
- `/infrastructure/repositories/DomainGroupRepository.ts`
- `/services/DomainGroupService.ts`
- `/composables/useDomainGroups.ts`
- `/pages/domain-groups/index.vue`

## Next Steps
If the issue persists after these changes:
1. Share the console logs showing the response format
2. Verify the API endpoint `/domain-groups/{id}/domains` is working
3. Check if the domains are actually assigned to the group in the database

