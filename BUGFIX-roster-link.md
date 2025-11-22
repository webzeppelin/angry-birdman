# Bug Fix: Anonymous Roster Access (Story 3.2)

**Date**: November 22, 2025  
**Story**: Epic 3, Story 3.2 - View Roster (Anonymous)  
**Status**: ✅ Fixed

## Problem Description

When a user viewed a clan page and clicked on the "Clan Roster" quick link, they
received an "Access Denied: You must be a clan admin or owner to manage the
roster" error message instead of seeing the public roster view.

## Root Cause Analysis

Story 3.2 specifies that anonymous users should be able to view a read-only
version of the active clan roster. The implementation was actually correct:

1. ✅ **Backend API**: The `GET /api/clans/:clanId/roster` endpoint correctly
   allows anonymous access (no `authenticate` middleware)
2. ✅ **Frontend Component**: The `PublicRosterPage` component was correctly
   implemented
3. ✅ **Routing**: The route `/clans/:clanId/roster/public` was correctly
   configured in `App.tsx`

However, the `ClanPage.tsx` component was linking to the wrong route:

- **Incorrect**: `/clans/${clan.clanId}/roster` (admin-only page requiring
  authentication)
- **Correct**: `/clans/${clan.clanId}/roster/public` (public read-only page)

## Solution Implemented

Updated `frontend/src/pages/ClanPage.tsx` line 225:

```typescript
// Before:
<Link to={`/clans/${clan.clanId}/roster`} ...>

// After:
<Link to={`/clans/${clan.clanId}/roster/public`} ...>
```

## Story 3.2 Acceptance Criteria Verification

✅ **Public roster view shows active players only**

- The PublicRosterPage queries with `?active=true` parameter
- Only active roster members are displayed

✅ **Read-only view (no edit buttons)**

- PublicRosterPage has no edit functionality
- Just displays player names and join dates in a simple table

✅ **Shows: player name, join date**

- Table displays exactly these two columns
- Join dates are formatted using `toLocaleDateString()`

✅ **Does not show: left dates, kicked dates, action history**

- API response includes these fields but PublicRosterPage ignores them
- Only `playerName` and `joinedDate` are rendered

## Files Modified

1. `/home/aford/projects/angrybirdman/frontend/src/pages/ClanPage.tsx`
   - Changed roster link from `/roster` to `/roster/public` (line 225)

2. `/home/aford/projects/angrybirdman/implog/5.3 - Implementation Log.md`
   - Added documentation of this bug fix

## Verification

- ✅ Frontend builds successfully with no TypeScript errors
- ✅ ESLint passes with no new errors
- ✅ Link now correctly points to public roster route
- ✅ Anonymous users can view active roster without authentication

## Impact

This fix ensures that Story 3.2 is fully functional. Anonymous users can now
successfully view the clan roster from the clan landing page, seeing only active
players with their names and join dates, exactly as specified in the acceptance
criteria.

## Related Documentation

- Specification: `specs/epics-and-stories.md` - Story 3.2 (lines 482-492)
- Implementation: `implog/5.3 - Implementation Log.md`
- Component: `frontend/src/pages/PublicRosterPage.tsx`
- API Endpoint: `api/src/routes/roster.ts` - GET /:clanId/roster (line 346)
