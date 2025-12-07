# Major Change 01 Deployment Checklist

**Project**: Angry Birdman  
**Change**: Centralized Master Battle Schedule Implementation  
**Version**: 1.0  
**Date**: December 6, 2025  
**Related Documents**:

- `specs/major-change-01-plan.md` - Implementation plan
- `specs/major-change-01-status.md` - Implementation status

---

## Overview

This checklist guides the deployment of the centralized Master Battle schedule
system. The change introduces:

- **Master Battle schedule** - Centralized registry of all CvC battles
- **System Settings table** - Global configuration management
- **Battle Scheduler service** - Automated battle creation every 3 days
- **Updated Battle Entry** - Battle selection instead of manual date entry
- **Timezone support** - Official Angry Birds Time (EST) handling

---

## Pre-Deployment Verification

### Development Environment

- [ ] All unit tests passing (common: 249/249)
- [ ] All integration tests passing (api: 91/91)
- [ ] All component tests passing (frontend)
- [ ] E2E tests verified
- [ ] TypeScript compilation successful with no errors
- [ ] ESLint and Prettier checks pass
- [ ] Code coverage meets minimum thresholds (>80%)

### Database Readiness

- [ ] Migration file exists and is reviewed:
      `database/prisma/migrations/20251205050207_add_master_battle_schedule/`
- [ ] Seed script includes Master Battle data
- [ ] Test database migration verified successful
- [ ] Database backup created for production
- [ ] Rollback procedure documented and tested

### Configuration Review

- [ ] Environment variables documented in `.env.example`
- [ ] `BATTLE_SCHEDULER_ENABLED` configuration verified
- [ ] Timezone conversions tested (EST ↔ GMT)
- [ ] Battle creation schedule verified (3-day intervals)

### Code Review

- [ ] All Phase 1-6 code reviewed and approved
- [ ] Documentation updated (README.md, database/README.md, api/README.md)
- [ ] API endpoints tested manually
- [ ] Frontend components tested in browser
- [ ] No console errors or warnings in development

---

## Deployment Steps

### Step 1: Database Migration

**Timing**: Requires brief downtime (< 2 minutes)

```bash
# 1. Backup production database
npm run db:backup

# 2. Apply migration
cd database
npx prisma migrate deploy

# 3. Verify migration
npx prisma migrate status
```

**Verification**:

- [ ] Migration applied successfully
- [ ] `system_settings` table exists
- [ ] `master_battles` table exists
- [ ] Foreign key constraint on `clan_battles.battle_id` exists
- [ ] No errors in migration logs

**Rollback**: If migration fails, restore from backup:

```bash
# Restore from backup
psql -U angrybirdman -d angrybirdman < backup_file.sql
```

### Step 2: Seed Master Battle Schedule

**Note**: This step is only needed for fresh installations. Existing
installations with battle data will auto-populate Master Battles via the seed
script's logic.

```bash
# Run seed script (safe to run multiple times)
npm run seed
```

**Verification**:

- [ ] Master Battle entries created for historical battles
- [ ] System setting `nextBattleStartDate` is set
- [ ] System setting `schedulerEnabled` is set to `true`
- [ ] No duplicate Battle IDs

### Step 3: Deploy API Service

**Timing**: Zero-downtime deployment (if using load balancer)

```bash
# 1. Build API
cd api
npm run build

# 2. Run tests one final time
npm test

# 3. Deploy (method depends on infrastructure)
# Docker example:
docker-compose up -d api

# Kubernetes example:
kubectl apply -f k8s/api-deployment.yaml
```

**Verification**:

- [ ] API service starts without errors
- [ ] Health check endpoint responding (`GET /health`)
- [ ] Scheduler plugin initialized (check logs)
- [ ] Scheduler cron job registered (check logs for "Battle scheduler
      initialized")
- [ ] No memory leaks (monitor for 1 hour)
- [ ] Database connection pool healthy

**Logs to Monitor**:

```
✓ "Battle scheduler initialized"
✓ "Running battle scheduler check..." (should appear hourly)
✓ No "Battle scheduler error" messages
```

### Step 4: Deploy Frontend

**Timing**: Zero-downtime deployment (CDN/static hosting)

```bash
# 1. Build frontend
cd frontend
npm run build

# 2. Deploy static assets (method depends on hosting)
# Example: Copy to CDN or static hosting
cp -r dist/* /path/to/cdn/

# S3 example:
aws s3 sync dist/ s3://your-bucket/
```

**Verification**:

- [ ] Frontend loads without errors
- [ ] Battle selector component displays correctly
- [ ] Battle entry form uses dropdown (not date pickers)
- [ ] Dashboard shows next battle information
- [ ] No console errors in browser
- [ ] All existing pages still functional

### Step 5: Verify Scheduler Operation

**Timing**: Monitor for 24 hours

```bash
# Check scheduler logs
docker logs -f angrybirdman-api | grep "scheduler"

# Or in Kubernetes:
kubectl logs -f deployment/api | grep "scheduler"
```

**Verification**:

- [ ] Scheduler runs at top of each hour
- [ ] Scheduler checks `nextBattleStartDate` correctly
- [ ] No errors during scheduler execution
- [ ] Battle created when due (if test date is near)
- [ ] Next battle date updated after creation

**Test Battle Creation** (Optional, Development Only):

```bash
# Manually update next battle date to 1 minute from now
# Wait for scheduler to run
# Verify new Master Battle created
```

---

## Post-Deployment Verification

### Functional Testing

#### Test 1: View Available Battles

- [ ] Navigate to battle entry form
- [ ] Battle selector loads with battles
- [ ] Battles sorted by most recent first
- [ ] Dates display in local timezone correctly
- [ ] No future battles shown in selector

#### Test 2: Create Battle Entry

- [ ] Select a battle from dropdown
- [ ] Enter opponent information
- [ ] Enter clan performance data
- [ ] Add player stats
- [ ] Submit form successfully
- [ ] Battle data saved correctly
- [ ] Cannot select same battle twice for same clan

#### Test 3: View Battle Schedule (Superadmin)

- [ ] Login as Superadmin
- [ ] Navigate to schedule manager
- [ ] View next battle date (in EST)
- [ ] Update next battle date
- [ ] Verify update saved correctly
- [ ] View master battle list

#### Test 4: Dashboard Display

- [ ] View dashboard
- [ ] Next battle information displays
- [ ] Countdown timer works (if implemented)
- [ ] Dates show in local timezone

#### Test 5: Cross-Clan Comparison (Future Feature)

- [ ] Multiple clans can enter data for same battleId
- [ ] Battle IDs consistent across clans
- [ ] Data queryable for cross-clan comparison

### Performance Testing

- [ ] Battle selector loads in < 500ms
- [ ] Battle list queries performant (< 200ms)
- [ ] Scheduler job completes in < 5 seconds
- [ ] No degradation in existing page load times
- [ ] Database query performance acceptable

### Error Handling Testing

- [ ] Attempt to select invalid battle ID → Error message shown
- [ ] Attempt to create duplicate battle → Error message shown
- [ ] Attempt to update next battle to past date → Error rejected
- [ ] Scheduler handles database errors gracefully
- [ ] API returns proper error codes (400, 403, 404, 500)

---

## Monitoring Setup

### Metrics to Track

**Scheduler Metrics**:

- [ ] Scheduler execution count (should be ~24/day)
- [ ] Scheduler success rate (should be 100%)
- [ ] Battle creation count (should be ~1 every 3 days)
- [ ] Scheduler execution duration (should be < 5s)

**API Metrics**:

- [ ] `/api/master-battles/available` response time
- [ ] Battle creation API success rate
- [ ] Database connection pool utilization
- [ ] Error rate for battle-related endpoints

**Database Metrics**:

- [ ] Master Battle table row count (grows by ~10/month)
- [ ] Query performance on battle joins
- [ ] Foreign key constraint violations (should be 0)

### Alerting

Configure alerts for:

- [ ] Scheduler fails to create battle when due
- [ ] `nextBattleStartDate` not set in system_settings
- [ ] Scheduler execution time > 10 seconds
- [ ] High error rate on battle endpoints (>5%)
- [ ] Database constraint violations

### Log Aggregation

- [ ] Scheduler logs aggregated and searchable
- [ ] Error logs filtered and monitored
- [ ] Superadmin actions logged (next battle date changes)
- [ ] Battle creation events logged

---

## Rollback Procedures

### Quick Rollback (< 1 hour, maintains data)

**Scenario**: Scheduler causing issues, but data is intact

```bash
# 1. Disable scheduler via environment variable
# Edit .env or docker-compose.yml:
BATTLE_SCHEDULER_ENABLED=false

# 2. Restart API service
docker-compose restart api

# 3. Verify scheduler stopped (check logs)
```

**Impact**: Scheduler stops, but all data remains. Manual battle creation
available via Superadmin interface.

### Partial Rollback (< 2 hours, API only)

**Scenario**: Frontend working, but API has issues

```bash
# 1. Revert API deployment to previous version
git checkout <previous-commit>
cd api
npm run build
docker-compose up -d api

# 2. Keep database schema (backward compatible)
# Master Battle and System Settings tables don't break old API
```

**Impact**: Old API functionality restored. Frontend may need rollback too if
relying on new endpoints.

### Full Rollback (2-4 hours, requires maintenance window)

**Scenario**: Critical issues, need to revert everything

```bash
# 1. Stop all services
docker-compose down

# 2. Restore database from pre-migration backup
psql -U angrybirdman -d angrybirdman < backup_YYYYMMDD_HHMMSS.sql

# 3. Checkout previous code version
git checkout <pre-migration-commit>

# 4. Rebuild and restart services
npm install
npm run build
docker-compose up -d

# 5. Verify data integrity
npm run db:validate
```

**Impact**: Full revert to pre-migration state. Any battle data entered after
migration will be lost (should be minimal in first 24 hours).

### Rollback Considerations

- Master Battle and System Settings tables don't break existing functionality
- ClanBattle table still has `startDate` and `endDate` (denormalized)
- Old frontend can operate with date pickers if new endpoints unavailable
- Foreign key on `battleId` will prevent orphaned battles (feature, not bug)

---

## Success Criteria

### Data Integrity ✓

- [ ] All existing battles have Master Battle entries
- [ ] No orphaned or duplicate Battle IDs
- [ ] Foreign key relationships intact
- [ ] System settings properly configured
- [ ] No data loss during migration

### Functionality ✓

- [ ] Scheduler automatically creates battles every 3 days
- [ ] Battle entry uses selection instead of date entry
- [ ] Superadmin can manage schedule
- [ ] All dates display correctly in user timezones
- [ ] Existing features still functional

### Performance ✓

- [ ] Battle selector loads quickly (< 500ms)
- [ ] Scheduler job completes quickly (< 5 seconds)
- [ ] No degradation in battle list/view performance
- [ ] Database queries remain fast

### Testing ✓

- [ ] All unit tests pass (>90% coverage for business logic)
- [ ] All integration tests pass (>85% coverage for API)
- [ ] E2E tests pass for critical workflows
- [ ] No regressions in existing functionality

### Operations ✓

- [ ] Scheduler runs reliably for 7+ days without issues
- [ ] Zero data loss or corruption
- [ ] Monitoring and alerting functional
- [ ] Documentation complete and accurate
- [ ] Team trained on new functionality

---

## Post-Deployment Tasks

### Week 1 (Days 1-7)

- [ ] Monitor scheduler execution daily
- [ ] Review error logs for issues
- [ ] Verify battle creation on day 3
- [ ] Check performance metrics
- [ ] Gather user feedback

### Week 2 (Days 8-14)

- [ ] Verify scheduler stability (2 battle creations)
- [ ] Monitor database growth
- [ ] Check for any edge cases
- [ ] Review alert thresholds
- [ ] Document any issues discovered

### Month 1 (Days 1-30)

- [ ] Confirm ~10 battles created successfully
- [ ] Analyze scheduler reliability (should be 100%)
- [ ] Review performance trends
- [ ] Optimize queries if needed
- [ ] Plan for future enhancements

---

## Contacts & Resources

**Documentation**:

- Implementation Plan: `specs/major-change-01-plan.md`
- Implementation Status: `specs/major-change-01-status.md`
- Implementation Logs: `implog/major-change-01-phase*-log.md`

**Support**:

- Database issues: Check `database/README.md`
- API issues: Check `api/README.md`
- Frontend issues: Check `frontend/README.md`

**Monitoring**:

- Application logs: `docker logs angrybirdman-api`
- Database logs: `docker logs angrybirdman-postgres`
- Scheduler logs: `grep "scheduler" <log-file>`

---

## Sign-Off

- [ ] Deployment completed successfully
- [ ] All verification steps passed
- [ ] Monitoring configured and operational
- [ ] Team notified of completion
- [ ] Documentation updated

**Deployed By**: ************\_\_\_************  
**Date/Time**: ************\_\_\_************  
**Version**: ************\_\_\_************  
**Notes**: ************\_\_\_************

---

**Status**: ✅ Ready for Deployment

This checklist ensures a smooth, safe deployment of Major Change 01 with clear
rollback procedures and comprehensive verification steps.
