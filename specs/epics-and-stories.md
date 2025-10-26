# Angry Birdman - Epics and User Stories

## Introduction

This document provides detailed user stories for the Angry Birdman clan management system. Each story follows the format:

**As a** [user role], **I want to** [action], **so that** [benefit/value].

Stories are organized by epic and include acceptance criteria where appropriate.

---

## Epic 1: General and Navigation

**Epic Goal**: Provide intuitive navigation and access to all features for all user types, with appropriate visibility based on authentication status and role.

### Story 1.1: View Landing Page

**As an** anonymous user, **I want to** visit the Angry Birdman landing page, **so that** I can understand what the system offers and decide how to proceed.

**Acceptance Criteria**:
- Landing page loads without requiring authentication
- Page explains the purpose of Angry Birdman
- Page provides links to view clan statistics and reports
- Page provides a "Sign In" button for administrators
- Page provides a "Register" button for new clan administrators
- Page is responsive and works on mobile, tablet, and desktop
- Page has a lighthearted, game-appropriate visual design

### Story 1.2: Use Global Navigation Menu

**As an** anonymous user, **I want to** use a global navigation menu, **so that** I can easily access different areas of the application.

**Acceptance Criteria**:
- Navigation menu is visible on all pages
- Menu includes links to: Home, Browse Clans, About
- Menu shows "Sign In" and "Register" buttons when not authenticated
- Menu is accessible via keyboard navigation
- Menu is responsive and collapses to a hamburger menu on mobile devices

### Story 1.3: Browse All Clans

**As an** anonymous user, **I want to** see a list of all clans using Angry Birdman, **so that** I can explore different clans' performance and statistics.

**Acceptance Criteria**:
- Page displays a searchable/filterable list of all registered clans
- Each clan entry shows: clan name, country, number of battles recorded
- List can be sorted by clan name or country
- Clicking a clan navigates to that clan's landing page
- Page supports pagination or infinite scroll for many clans

### Story 1.4: View Clan-Specific Landing Page

**As an** anonymous user, **I want to** navigate to a specific clan's landing page, **so that** I can see an overview of that clan's performance.

**Acceptance Criteria**:
- Page displays clan name, country, and Rovio ID
- Page shows recent battle results (last 5-10 battles)
- Page shows current month/year performance summary
- Page provides navigation to detailed statistics and reports
- URL is clan-specific (e.g., `/clans/{clanId}` or `/clans/{clanName}`)

### Story 1.5: Use Clan-Specific Navigation

**As an** anonymous user, **I want to** use a clan-specific navigation menu, **so that** I can access different statistics and reports for the selected clan.

**Acceptance Criteria**:
- Navigation menu appears when viewing clan-specific pages
- Menu includes links to: Clan Home, Battle History, Monthly Stats, Yearly Stats, Reports, Roster (view-only)
- Current page is highlighted in the menu
- Menu remains accessible via keyboard shortcuts

### Story 1.6: Sign In as Administrator

**As a** Clan Admin, **I want to** authenticate into the website, **so that** I can access management features for my clan.

**Acceptance Criteria**:
- Sign-in page prompts for username and password
- Successful authentication redirects to admin dashboard or clan home
- Failed authentication shows clear error message
- "Forgot Password" link is available
- Session persists across browser refreshes
- Session expires after period of inactivity
- Authentication uses Keycloak for identity management

### Story 1.7: View Admin Navigation Menu

**As a** Clan Admin, **I want to** see an admin-specific navigation menu when authenticated, **so that** I can access management tools for my clan.

**Acceptance Criteria**:
- Admin menu appears in addition to standard navigation when authenticated
- Menu includes links to: Manage Roster, Record Battle, My Profile, Sign Out
- Admin menu is visually distinguished from public navigation
- Menu is only visible to authenticated admin users
- Keyboard shortcut opens admin menu

### Story 1.8: Select Clan (Anonymous)

**As an** anonymous user, **I want to** use a clan selector, **so that** I can quickly switch between viewing different clans' statistics.

**Acceptance Criteria**:
- Clan selector is accessible from any page
- Selector provides search/filter functionality
- Selecting a clan navigates to that clan's landing page
- Recently viewed clans appear at the top of the selector
- Selector works on mobile and desktop devices

### Story 1.9: Select Clan (Superadmin)

**As a** Superadmin, **I want to** use a clan selector to choose which clan I'm currently managing, **so that** I can administer multiple clans efficiently.

**Acceptance Criteria**:
- Clan selector is available in admin interface
- Currently selected clan is clearly indicated
- Changing selected clan updates all admin views to that clan's context
- Selector includes all registered clans
- Search/filter functionality helps find clans quickly

### Story 1.10: Sign Out

**As a** Clan Admin, **I want to** sign out of the application, **so that** I can secure my session when done.

**Acceptance Criteria**:
- Sign Out link/button is clearly visible in admin menu
- Clicking Sign Out ends the session immediately
- User is redirected to landing page after sign out
- Confirmation message indicates successful sign out
- Attempting to access admin pages after sign out redirects to sign-in page

### Story 1.11: Use Keyboard Shortcuts for Navigation

**As a** Clan Admin, **I want to** use keyboard shortcuts for common navigation tasks, **so that** I can work more efficiently without using a mouse.

**Acceptance Criteria**:
- Keyboard shortcut reference is accessible (e.g., "?" key)
- Common shortcuts include: Navigate to dashboard, Record battle, Manage roster, Search clans
- Tab navigation follows logical flow through page elements
- Shortcuts work consistently across all pages
- Shortcuts are documented in help/about section

---

## Epic 2: User and Clan Management

**Epic Goal**: Enable user registration, authentication, profile management, and clan administration with appropriate role-based permissions.

### Story 2.1: Create Superadmin Account (External)

**As a** system administrator, **I want to** create Superadmin accounts using Keycloak's administrative interface, **so that** I can grant full system access to trusted administrators.

**Acceptance Criteria**:
- Superadmin accounts can only be created via Keycloak admin console
- Superadmin role grants access to all clans and system settings
- Process is documented for system administrators
- Superadmin accounts cannot be created through the web application

### Story 2.2: Self-Register as Clan Admin

**As a** new user, **I want to** register for a Clan Admin account, **so that** I can manage my clan's data in the system.

**Acceptance Criteria**:
- Registration page is accessible from landing page and sign-in page
- Form collects: username, email, password, password confirmation
- Username must be unique across all users
- Email must be valid format and unique
- Password meets security requirements (minimum length, complexity)
- Email verification is sent upon successful registration
- User cannot sign in until email is verified
- Clear validation messages guide user through any errors

### Story 2.3: Verify Email Address

**As a** newly registered user, **I want to** verify my email address, **so that** I can activate my account and sign in.

**Acceptance Criteria**:
- Verification email is sent immediately after registration
- Email contains a verification link with secure token
- Clicking link marks account as verified
- Verified users can now sign in
- Link expires after reasonable time period (e.g., 24 hours)
- User can request a new verification email if needed

### Story 2.4: Register New Clan

**As a** Clan Owner (newly registered admin), **I want to** register my clan in the system, **so that** I can start tracking our clan's battle data.

**Acceptance Criteria**:
- Clan registration form is accessible after account verification
- Form collects: clan name, Rovio ID, country
- Clan name and Rovio ID must be unique in the system
- Registering user automatically becomes Clan Owner
- Form validates all required fields
- Successful registration navigates to clan dashboard
- User can only register one clan initially (Superadmin can associate user with multiple clans)

### Story 2.5: View My User Profile

**As a** Clan Admin, **I want to** view my user profile, **so that** I can see my account information and settings.

**Acceptance Criteria**:
- Profile page shows: username, email, clan association, role (Admin/Owner)
- Profile is accessible from admin navigation menu
- Read-only fields are clearly indicated
- Edit profile button is prominently displayed

### Story 2.6: Edit My User Profile

**As a** Clan Admin, **I want to** edit my user profile information, **so that** I can keep my account details current.

**Acceptance Criteria**:
- User can edit: email address
- Username cannot be changed (read-only)
- Email change requires verification of new email address
- Form validates all changes before saving
- Success message confirms profile update
- Changes are reflected immediately

### Story 2.7: Change My Password

**As a** Clan Admin, **I want to** change my password, **so that** I can maintain account security.

**Acceptance Criteria**:
- Change password form requires: current password, new password, confirm new password
- Current password must be correct to proceed
- New password must meet security requirements
- New and confirm passwords must match
- Success message confirms password change
- User remains signed in after password change

### Story 2.8: Reset Forgotten Password

**As a** user who has forgotten their password, **I want to** reset my password, **so that** I can regain access to my account.

**Acceptance Criteria**:
- "Forgot Password" link is available on sign-in page
- Form prompts for email address or username
- Password reset email is sent if account exists
- Email contains secure reset link with expiring token
- Reset link loads page to set new password
- New password must meet security requirements
- Success message confirms password reset
- User can now sign in with new password

### Story 2.9: View Clan Profile

**As a** Clan Owner, **I want to** view my clan's profile, **so that** I can see our clan's information.

**Acceptance Criteria**:
- Clan profile page shows: clan name, Rovio ID, country, registration date
- Profile is accessible from admin menu
- Edit button is visible for Clan Owners

### Story 2.10: Edit Clan Profile

**As a** Clan Owner, **I want to** edit my clan's profile information, **so that** I can keep clan details current.

**Acceptance Criteria**:
- Only Clan Owner can edit clan profile (not regular Clan Admins)
- User can edit: clan name, country
- Rovio ID cannot be changed (read-only)
- Form validates all changes
- Success message confirms update
- Changes are reflected immediately throughout the application

### Story 2.11: View Clan Admin Users

**As a** Clan Owner, **I want to** view all admin users for my clan, **so that** I can see who has administrative access.

**Acceptance Criteria**:
- Admin users page shows list of all admins for the clan
- Each entry shows: username, email, role (Admin/Owner), date added
- Clan Owner entry is clearly marked
- Page is accessible from admin menu

### Story 2.12: Promote User to Clan Admin

**As a** Clan Owner, **I want to** promote an existing user to Clan Admin for my clan, **so that** I can share management responsibilities.

**Acceptance Criteria**:
- Add admin form prompts for username or email
- System validates that user exists
- System prevents adding user who is already an admin
- New admin receives email notification
- New admin can now access management features for the clan
- Activity is logged

### Story 2.13: Promote Clan Admin to Owner

**As a** Clan Owner, **I want to** promote another Clan Admin to Owner, **so that** I can transfer ownership responsibilities.

**Acceptance Criteria**:
- Promote to Owner button is available next to each Clan Admin
- Confirmation dialog warns that current owner will become regular admin
- Promotion is immediate upon confirmation
- Former owner becomes regular Clan Admin
- New owner receives email notification
- Activity is logged

### Story 2.14: Demote Clan Admin

**As a** Clan Owner, **I want to** remove Clan Admin privileges from a user, **so that** I can control access to management features.

**Acceptance Criteria**:
- Remove admin button is available next to each Clan Admin (not Owner)
- Confirmation dialog prevents accidental removal
- Removed user can no longer access admin features
- Removed user receives email notification
- Activity is logged

### Story 2.15: Make Clan Inactive (Superadmin/Owner)

**As a** Clan Owner or Superadmin, **I want to** mark my clan as inactive, **so that** it no longer appears in active clan lists but data is retained.

**Acceptance Criteria**:
- "Make Inactive" option is available in clan settings
- Confirmation dialog warns about consequences
- Inactive clans don't appear in default clan lists
- Historical data remains accessible
- Clan can be reactivated by Superadmin if needed
- Activity is logged

### Story 2.16: Manage Users (Superadmin)

**As a** Superadmin, **I want to** manage any user account in the system, **so that** I can provide support and enforce policies.

**Acceptance Criteria**:
- Superadmin can view all user accounts
- Superadmin can reset any user's password
- Superadmin can disable/enable user accounts
- Superadmin can change user's clan association
- All admin actions are logged with timestamp and admin ID

### Story 2.17: View Audit Log (Superadmin)

**As a** Superadmin, **I want to** view an audit log of administrative actions, **so that** I can monitor system activity and troubleshoot issues.

**Acceptance Criteria**:
- Audit log shows all significant admin actions
- Log entries include: timestamp, user, action type, affected entity, result
- Log can be filtered by date range, user, action type, clan
- Log can be exported for analysis
- Log entries cannot be modified or deleted

---

## Epic 3: Maintain Clan Roster

**Epic Goal**: Enable clan administrators to maintain an accurate roster of clan members, tracking joins, departures, and status changes.

### Story 3.1: View Clan Roster

**As a** Clan Admin, **I want to** view my clan's roster, **so that** I can see all current and past members.

**Acceptance Criteria**:
- Roster page shows all players with: name, active status, joined date, left/kicked date
- Active players are shown by default, separate from inactive
- List can be sorted by name, join date, or status
- Search/filter functionality helps find specific players
- Roster shows total count of active and inactive members

### Story 3.2: View Roster (Anonymous)

**As an** anonymous user, **I want to** view a clan's roster, **so that** I can see who is in the clan.

**Acceptance Criteria**:
- Public roster view shows active players only
- Read-only view (no edit buttons)
- Shows: player name, join date
- Does not show: left dates, kicked dates, action history

### Story 3.3: Add Player to Roster

**As a** Clan Admin, **I want to** add a new player to the roster, **so that** I can track their participation in battles.

**Acceptance Criteria**:
- Add player form is accessible from roster page
- Form collects: player name, joined date
- Player name must be unique within the clan
- Joined date defaults to current date
- New player is marked as active by default
- Success message confirms addition
- New player appears in roster immediately
- Form is optimized for quick entry (supports Enter key to submit)

### Story 3.4: Edit Player Information

**As a** Clan Admin, **I want to** edit a player's information, **so that** I can correct mistakes or update their details.

**Acceptance Criteria**:
- Edit button appears next to each player in roster
- Form allows editing: player name, joined date
- Player name must remain unique within clan
- Changes are validated before saving
- Success message confirms update
- Updated information is reflected immediately

### Story 3.5: Record Player Leaving Clan

**As a** Clan Admin, **I want to** record when a player leaves the clan voluntarily, **so that** I can distinguish between departures and kicks.

**Acceptance Criteria**:
- "Left Clan" action is available for active players
- Form prompts for left date (defaults to current date)
- Player status changes to inactive
- Left date is recorded and displayed
- Player's historical battle data remains intact
- Action can be undone if recorded in error

### Story 3.6: Record Player Being Kicked

**As a** Clan Admin, **I want to** record when a player is kicked from the clan, **so that** I can track enforcement of clan policies.

**Acceptance Criteria**:
- "Kick Player" action is available for active players
- Form prompts for kicked date (defaults to current date)
- Optional reason field for notes
- Player status changes to inactive
- Kicked date is recorded and displayed
- Player's historical battle data remains intact
- Action can be undone if recorded in error

### Story 3.7: Reactivate Player

**As a** Clan Admin, **I want to** reactivate an inactive player, **so that** I can track their participation when they rejoin the clan.

**Acceptance Criteria**:
- "Reactivate" button appears for inactive players
- Form prompts for new joined date (defaults to current date)
- Left date and/or kicked date are cleared
- Player status changes to active
- Success message confirms reactivation
- Player's complete history is preserved

### Story 3.8: View Player History

**As a** Clan Admin, **I want to** view a player's complete history in the clan, **so that** I can see their activity over time.

**Acceptance Criteria**:
- Player detail page shows: all join/leave/kick dates, active status
- Shows summary of battle participation: total battles, average ratio
- Shows recent action codes from battles (HOLD, WARN, KICK, etc.)
- Links to individual battle performances
- History helps inform roster decisions

### Story 3.9: Bulk Import Roster

**As a** Clan Admin, **I want to** import multiple players at once, **so that** I can quickly populate the roster when first setting up.

**Acceptance Criteria**:
- Import feature accepts CSV or simple text list
- Format: player name, joined date (date optional, defaults to current)
- Import validates all entries before committing
- Error report shows any invalid entries
- Valid entries are imported even if some entries fail
- Success message shows count of players imported
- Duplicate names within import are flagged

### Story 3.10: Export Roster

**As a** Clan Admin, **I want to** export the roster data, **so that** I can use it for external analysis or backup.

**Acceptance Criteria**:
- Export button generates CSV file
- Export includes: player name, active status, joined date, left date, kicked date
- Can export active only or all players
- File name includes clan name and export date
- Export includes header row with column labels

---

## Epic 4: Record Clan Battle Data

**Epic Goal**: Provide an efficient, keyboard-friendly workflow for capturing battle results from the game UI, minimizing data entry time and errors.

### Story 4.1: Start New Battle Entry

**As a** Clan Admin, **I want to** start recording a new battle, **so that** I can capture the results before I forget the details.

**Acceptance Criteria**:
- "Record Battle" button/link is prominently available in admin menu
- Clicking launches battle entry workflow
- System checks for existing battle on selected date and warns if duplicate
- Workflow is optimized for keyboard-only data entry
- Can save draft and return later to complete

### Story 4.2: Enter Battle Metadata

**As a** Clan Admin, **I want to** enter basic battle information, **so that** I can identify when and against whom the battle occurred.

**Acceptance Criteria**:
- Form fields in order: start date, end date, opponent Rovio ID, opponent name, opponent country
- Start date defaults to most recent battle date + 3 days (typical cycle)
- End date defaults to start date + 1 day
- Battle ID (YYYYMMDD) is generated automatically from start date
- Tab key advances through fields in optimal order
- Field validation prevents invalid dates and missing required fields
- Opponent information can be auto-filled from previous battles (dropdown of recent opponents)

### Story 4.3: Enter Clan Performance Data

**As a** Clan Admin, **I want to** enter my clan's performance data, **so that** I can record how well we did.

**Acceptance Criteria**:
- Form fields in order: clan score, clan baseline FP
- Fields accept numeric input only
- Tab advances between fields
- Validation ensures positive integers
- Baseline FP can default to previous battle's baseline FP (with option to override)

### Story 4.4: Enter Opponent Performance Data

**As a** Clan Admin, **I want to** enter opponent performance data, **so that** I can record how our opponent performed.

**Acceptance Criteria**:
- Form fields in order: opponent score, opponent FP
- Fields accept numeric input only
- Tab advances between fields
- Validation ensures positive integers
- Win/loss/tie result is calculated automatically based on scores

### Story 4.5: Enter Player Performance Data

**As a** Clan Admin, **I want to** enter performance data for each player who participated, **so that** I can track individual contributions.

**Acceptance Criteria**:
- For each player, fields in order: rank, player name, score, FP
- Player name dropdown shows active roster members
- Can also type player name for autocomplete
- Tab advances through fields, Enter adds next player
- Duplicate player names are prevented
- Score can be 0 (player participated but scored nothing)
- FP must be positive integer
- Ratio is calculated automatically
- Can reorder or remove entries before submission
- Interface supports rapid entry of 20-50 players

### Story 4.6: Enter Non-Player Data

**As a** Clan Admin, **I want to** record which roster members didn't play, **so that** I can track participation and manage reserve players.

**Acceptance Criteria**:
- Non-player list shows active roster members not yet entered as players
- Can automatically populate list with all non-entered active members
- For each non-player, fields: name (pre-filled), FP, reserve status (checkbox)
- Tab advances through fields, Enter adds next non-player
- Reserve checkbox indicates player is intentionally kept inactive
- Can mark multiple players as reserve in batch operation

### Story 4.7: Assign Action Codes

**As a** Clan Admin, **I want to** assign action codes to all roster members, **so that** I can track intended roster changes after the battle.

**Acceptance Criteria**:
- After entering all player and non-player data, action code assignment screen appears
- Shows all active roster members (players and non-players)
- For each member: name, played status, action code dropdown, optional reason field
- Action codes: HOLD, WARN, KICK, RESERVE, PASS
- Can set default action (e.g., HOLD) for all, then override individuals
- Non-players default to suggested actions based on participation history
- Tab and Enter keys support rapid assignment
- Optional reason field for KICK, WARN, or other significant actions

### Story 4.8: Review Battle Data

**As a** Clan Admin, **I want to** review all entered battle data before submitting, **so that** I can catch and correct any errors.

**Acceptance Criteria**:
- Review screen shows all entered data in organized sections
- Calculated fields are displayed: battle result, ratios, counts
- Edit buttons allow jumping back to specific sections
- Clear visual indication of any missing or invalid data
- Summary statistics help verify accuracy: total players, total non-players, FP totals
- Can print or export review for offline verification

### Story 4.9: Submit Battle Data

**As a** Clan Admin, **I want to** submit completed battle data, **so that** it's saved and calculations are performed.

**Acceptance Criteria**:
- Submit button is prominent on review screen
- Final validation ensures all required data is present and valid
- Submission triggers all calculated field updates
- Success message confirms battle was recorded
- Battle ID and basic results are displayed
- User is directed to view the battle stats or return to dashboard
- Monthly/yearly summaries are automatically updated if applicable

### Story 4.10: Save Battle Draft

**As a** Clan Admin, **I want to** save a partially completed battle entry, **so that** I can return to finish it later without losing my work.

**Acceptance Criteria**:
- "Save Draft" button is available at any stage of entry
- Draft is saved to user's session or database
- User can return to draft from dashboard "Incomplete Battles" section
- Draft expires after reasonable period (e.g., 7 days)
- Only one draft per battle date is allowed
- Can delete draft if no longer needed

### Story 4.11: Edit Existing Battle

**As a** Clan Admin, **I want to** edit a previously submitted battle, **so that** I can correct errors discovered after submission.

**Acceptance Criteria**:
- Edit button appears on battle detail pages
- Edit loads same workflow as initial entry, pre-filled with existing data
- All sections can be modified
- Recalculation occurs on save
- Edit history is logged (who edited, when, what changed)
- Monthly/yearly summaries are recalculated if affected

### Story 4.12: Delete Battle

**As a** Clan Admin, **I want to** delete an incorrectly entered battle, **so that** I can remove duplicate or erroneous data.

**Acceptance Criteria**:
- Delete button available on battle detail page
- Confirmation dialog requires explicit confirmation
- Deletion removes battle and all associated player/non-player stats
- Monthly/yearly summaries are recalculated if affected
- Deletion is logged in audit trail (Superadmin can see)
- Cannot be undone (consider soft delete for Superadmin recovery)

### Story 4.13: Copy Battle for Quick Entry

**As a** Clan Admin, **I want to** copy data from a previous battle, **so that** I can speed up entry when rosters are similar.

**Acceptance Criteria**:
- "Copy from Previous" option is available when starting new battle
- User selects which battle to copy from
- Copies: baseline FP, player list with names and FPs
- Does not copy: scores, ranks, action codes, specific dates
- User can then update only what changed
- Saves significant time for stable rosters

---

## Epic 5: View Clan Battle Stats

**Epic Goal**: Enable all users to view detailed statistics for individual battles, understanding clan and player performance.

### Story 5.1: View Battle List

**As an** anonymous user, **I want to** see a list of all battles for a clan, **so that** I can browse through battle history.

**Acceptance Criteria**:
- Battle list shows: date, opponent, result (W/L/T), clan score, opponent score, clan ratio
- List is sorted by date (most recent first) by default
- Can filter by: date range, opponent, result (won/lost/tied)
- Can search by opponent name
- Pagination or infinite scroll for many battles
- Clicking a battle navigates to detailed battle stats

### Story 5.2: View Battle Overview

**As an** anonymous user, **I want to** view overview statistics for a specific battle, **so that** I can understand how the clan performed.

**Acceptance Criteria**:
- Battle detail page shows: date, opponent information, result
- Shows clan stats: score, baseline FP, ratio, projected score
- Shows opponent stats: score, FP
- Shows calculated stats: margin ratio, FP margin
- Shows participation stats: player count, non-player count, reserve count
- Visual indicators (color coding, icons) highlight wins/losses and good/poor ratios
- Page is responsive for mobile viewing

### Story 5.3: View Clan Performance in Battle

**As an** anonymous user, **I want to** see detailed clan performance statistics, **so that** I can analyze how well the clan did.

**Acceptance Criteria**:
- Clan performance section shows:
  - Score, FP, baseline FP, ratio, average ratio, projected score
  - Nonplaying FP ratio, reserve FP ratio
  - Margin ratio (win/loss margin)
  - FP margin (power advantage/disadvantage)
- Each statistic has a brief tooltip explanation
- Visual representation (gauges, charts) where helpful
- Comparison to clan's average performance (if available)

### Story 5.4: View Opponent Performance

**As an** anonymous user, **I want to** see opponent performance statistics, **so that** I can understand the competition level.

**Acceptance Criteria**:
- Opponent section shows: name, Rovio ID, country, score, FP
- Shows opponent's ratio (calculated from their score and FP)
- Shows matchup quality (was opponent stronger/weaker based on FP)
- Historical matchup record if clans have battled before

### Story 5.5: View Player Performance Rankings

**As an** anonymous user, **I want to** see how individual players performed in the battle, **so that** I can identify top performers and participation issues.

**Acceptance Criteria**:
- Player stats table shows all players who participated
- Columns: rank (by score), player name, score, FP, ratio, ratio rank
- Can sort by any column (rank, name, score, ratio, etc.)
- Ratio rank highlights normalized performance
- Color coding or icons indicate performance tiers (excellent/good/average/poor)
- Shows count of players

### Story 5.6: View Player Performance Details

**As an** anonymous user, **I want to** view detailed statistics for a specific player in a battle, **so that** I can understand their individual contribution.

**Acceptance Criteria**:
- Clicking a player opens detailed view or expands row
- Shows: all basic stats (rank, score, FP, ratio, ratio rank)
- Shows action code assigned after battle (for admin transparency)
- Shows player's average ratio across all battles (for comparison)
- Shows player's trend (improving/declining) if available

### Story 5.7: View Non-Player List

**As an** anonymous user, **I want to** see which roster members didn't play in the battle, **so that** I can understand participation levels.

**Acceptance Criteria**:
- Non-player section lists all members who didn't participate
- Separate sections for: non-players (non-reserve) and reserve players
- For each non-player: name, FP, reserve status
- Shows count of non-players and percentage of roster
- Reserve players are visually distinguished (separate list or different styling)

### Story 5.8: View Non-Player Summary Statistics

**As an** anonymous user, **I want to** see summary statistics for non-players, **so that** I can understand the impact of missed participation.

**Acceptance Criteria**:
- Summary shows: total non-player count, total non-player FP
- Shows: nonplaying FP ratio, reserve FP ratio
- Shows projected score if all had played
- Visual indicator of participation rate (e.g., "85% participation")
- Comparison to clan's typical participation rate

### Story 5.9: View Reserve Player Summary

**As an** anonymous user, **I want to** see summary statistics for reserve players separately, **so that** I can understand the strategic FP management.

**Acceptance Criteria**:
- Reserve summary shows: count of reserve players, total reserve FP
- Shows reserve FP as percentage of total potential FP
- Explains purpose of reserve players (tooltip or note)
- Shows how reserves affect matchmaking (lower reported FP)

### Story 5.10: Compare Battle to Averages

**As an** anonymous user, **I want to** see how this battle compares to the clan's averages, **so that** I can understand if it was typical or exceptional.

**Acceptance Criteria**:
- Comparison section shows current battle stat next to clan average
- Includes: ratio, participation rate, nonplaying FP ratio
- Visual indicators (arrows, colors) show above/below average
- Uses monthly average, yearly average, or all-time average (configurable)

### Story 5.11: Export Battle Data

**As a** Clan Admin, **I want to** export battle data, **so that** I can perform external analysis or keep offline records.

**Acceptance Criteria**:
- Export button generates CSV or JSON file
- Export includes all battle metadata and calculated fields
- Includes complete player and non-player lists with all fields
- File name includes clan name, battle ID, and export date

---

## Epic 6: View Rolled-Up Monthly and Yearly Stats

**Epic Goal**: Enable users to view aggregated performance statistics over time periods, identifying trends and patterns.

### Story 6.1: View Monthly Stats List

**As an** anonymous user, **I want to** see a list of months with recorded battles, **so that** I can select a month to analyze.

**Acceptance Criteria**:
- Monthly stats page shows list of months (YYYY-MM format)
- Shows for each month: battle count, win/loss/tie record, average ratio
- Months are sorted most recent first
- Clicking a month navigates to detailed monthly stats
- Shows current month separately if it's incomplete
- Shows which months are marked complete vs. in-progress

### Story 6.2: View Monthly Clan Summary

**As an** anonymous user, **I want to** view summary clan statistics for a specific month, **so that** I can understand overall performance for that period.

**Acceptance Criteria**:
- Monthly clan summary shows:
  - Battle count, won/lost/tied counts, win percentage
  - Average FP, average baseline FP, average ratio
  - Average margin ratio, average FP margin
  - Average nonplaying count, average nonplaying FP ratio
  - Average reserve count, average reserve FP ratio
- Each statistic is explained with tooltip
- Visual charts show distributions and trends
- Can compare to other months or yearly average

### Story 6.3: View Monthly Individual Performance

**As an** anonymous user, **I want to** view individual player performance statistics for a month, **so that** I can identify consistent performers and participation patterns.

**Acceptance Criteria**:
- Monthly individual stats show only players with 3+ battles that month
- Table shows for each player:
  - Name, battles played, average score, average FP, average ratio
  - Average rank (by score), average ratio rank
- Can sort by any column
- Highlights top performers (e.g., top 3 by average ratio)
- Shows participation rate (battles played / total battles)
- Can filter to show only highly active players (e.g., 80%+ participation)

### Story 6.4: View Monthly Trends

**As an** anonymous user, **I want to** see trend visualizations for the month, **so that** I can understand how performance changed over time.

**Acceptance Criteria**:
- Charts show day-by-day or battle-by-battle progression:
  - Ratio trend, participation trend, win/loss progression
- Identifies upward or downward trends
- Highlights best and worst performances
- Can toggle between different metrics

### Story 6.5: Compare Multiple Months

**As an** anonymous user, **I want to** compare statistics across multiple months, **so that** I can identify longer-term trends.

**Acceptance Criteria**:
- Multi-month comparison view allows selecting 2-12 months
- Shows same statistics side-by-side for comparison
- Charts overlay multiple months' trends
- Highlights biggest changes month-over-month
- Can export comparison data

### Story 6.6: View Yearly Stats List

**As an** anonymous user, **I want to** see a list of years with recorded battles, **so that** I can select a year to analyze.

**Acceptance Criteria**:
- Yearly stats page shows list of years
- Shows for each year: battle count, win/loss/tie record, average ratio
- Years are sorted most recent first
- Clicking a year navigates to detailed yearly stats
- Shows current year separately if it's incomplete
- Shows which years are marked complete

### Story 6.7: View Yearly Clan Summary

**As an** anonymous user, **I want to** view summary clan statistics for a specific year, **so that** I can understand overall performance for that period.

**Acceptance Criteria**:
- Yearly clan summary shows same statistics as monthly (aggregated over year)
- Includes: battle count, win/loss/tie record, all average statistics
- Shows month-by-month breakdown within the year
- Can compare to other years or all-time average
- Charts visualize yearly trends and distributions

### Story 6.8: View Yearly Individual Performance

**As an** anonymous user, **I want to** view individual player performance statistics for a year, **so that** I can identify consistent long-term performers.

**Acceptance Criteria**:
- Yearly individual stats show only players with 3+ battles that year
- Table shows for each player:
  - Name, battles played, average score, average FP, average ratio
  - Average rank, average ratio rank
- Can sort by any column
- Highlights top performers for the year
- Shows participation rate over the year
- Can show month-by-month breakdown for specific player

### Story 6.9: View Yearly Trends

**As an** anonymous user, **I want to** see trend visualizations for the year, **so that** I can understand how performance evolved.

**Acceptance Criteria**:
- Charts show month-by-month progression for the year
- Shows trends in: ratio, participation, win rate
- Identifies seasonal patterns or trends
- Highlights best and worst months
- Can toggle between different metrics

### Story 6.10: Mark Month/Year Complete

**As a** Clan Admin, **I want to** mark a month or year as complete, **so that** the system knows the period is finalized for reporting purposes.

**Acceptance Criteria**:
- "Mark Complete" button appears for in-progress months/years
- Confirmation dialog prevents accidental marking
- Completed months/years are visually indicated in lists
- Can unmark if needed (Clan Admin/Superadmin only)
- Completing a year automatically marks all its months complete

---

## Epic 7: Analyze and Visualize Clan Data

**Epic Goal**: Provide advanced visualizations and reports to help clans understand performance trends and make strategic decisions.

### Story 7.1: View Flock Power Report

**As an** anonymous user, **I want to** view a report showing FP trends over time, **so that** I can see how the clan's power level is changing.

**Acceptance Criteria**:
- Report shows line chart of FP and baseline FP over time
- X-axis is time (battles or dates), Y-axis is FP value
- Two lines: total FP (calculated) and baseline FP (reported)
- Can toggle between battle-by-battle and monthly averages
- Hovering over data points shows exact values and date
- Shows overall trend (increasing/decreasing) with statistics

### Story 7.2: View Ratio Report

**As an** anonymous user, **I want to** view a report showing ratio performance over time, **so that** I can assess skill/performance trends independent of FP growth.

**Acceptance Criteria**:
- Report shows line chart of ratio and average ratio over time
- Two lines: official clan ratio (score/baseline FP) and average ratio (score/total FP)
- Can toggle between battle-by-battle and monthly averages
- Identifies performance peaks and valleys
- Shows moving average trend line
- Highlights periods of strong or weak performance

### Story 7.3: View Participation Report

**As an** anonymous user, **I want to** view a report showing participation trends, **so that** I can understand engagement patterns.

**Acceptance Criteria**:
- Report shows nonplaying FP ratio and reserve FP ratio over time
- Charts show: participation rate (% of roster playing), nonplaying FP ratio, reserve FP ratio
- Can toggle between battle-by-battle and monthly averages
- Identifies participation trends (improving/declining)
- Correlates participation with battle outcomes (do better participation = more wins?)

### Story 7.4: View Win/Loss Margin Report

**As an** anonymous user, **I want to** view a report showing margin ratios over time, **so that** I can see how closely matched our battles are.

**Acceptance Criteria**:
- Report shows margin ratio (win/loss margin as % of our score) over time
- Bar chart with positive values (wins) and negative values (losses)
- Shows average margin for wins and losses
- Identifies close battles vs. blowouts
- Can filter to show only wins, only losses, or all

### Story 7.5: View Custom Date Range Report

**As an** anonymous user, **I want to** select a custom date range for reports, **so that** I can analyze any time period of interest.

**Acceptance Criteria**:
- Date range picker allows selecting start and end dates
- All report charts update to show only selected date range
- Can save custom ranges as bookmarks
- Can compare multiple custom ranges
- Export includes date range in filename

### Story 7.6: View Player Performance Over Time

**As an** anonymous user, **I want to** view an individual player's performance trends, **so that** I can see their development over time.

**Acceptance Criteria**:
- Player-specific report shows their ratio over time
- Shows battles played, average ratio trend
- Compares player to clan average ratio
- Identifies improvement or decline
- Shows participation consistency

### Story 7.7: View Matchup Analysis

**As an** anonymous user, **I want to** view statistics about opponents we've faced, **so that** I can understand our competitive environment.

**Acceptance Criteria**:
- Matchup report lists all opponents faced
- For each opponent: battles played, win/loss/tie record, average FP difference
- Identifies "rival" clans (frequent matchups)
- Shows win rate against opponents of different FP levels
- Can view head-to-head history with specific opponent

### Story 7.8: View Roster Churn Report

**As a** Clan Admin, **I want to** view roster stability statistics, **so that** I can understand member retention patterns.

**Acceptance Criteria**:
- Roster churn report shows: members joined, members left, members kicked (by month)
- Shows retention rate and average member tenure
- Lists current longest-tenured members
- Shows action code frequency (how often using KICK vs. HOLD vs. WARN)
- Helps inform roster management decisions

### Story 7.9: Dashboard Summary View

**As a** Clan Admin, **I want to** see a dashboard with key metrics, **so that** I can get a quick overview of clan status.

**Acceptance Criteria**:
- Dashboard shows: recent battles (last 5), current month stats summary, next battle countdown
- Shows key metrics: win rate (month/year), average ratio (month/year), participation rate
- Shows alerts: upcoming actions (pending kicks), incomplete battle drafts
- Quick links to common tasks: Record Battle, Manage Roster, View Reports
- Dashboard is the landing page after sign-in

### Story 7.10: Export Report Data

**As an** anonymous user, **I want to** export report data and charts, **so that** I can use them in presentations or external analysis.

**Acceptance Criteria**:
- Export button available on all reports
- Can export as: CSV (data), PNG (chart image), PDF (formatted report)
- Export includes date range and report parameters
- File names are descriptive with clan name and date range

### Story 7.11: Share Report Link

**As an** anonymous user, **I want to** share a direct link to a specific report view, **so that** I can discuss results with others.

**Acceptance Criteria**:
- Share button generates a permanent URL for current report view
- URL includes all parameters (date range, filters, selected metrics)
- Shared link works for anyone (no authentication required)
- Shared link includes clan context

### Story 7.12: Set Performance Goals

**As a** Clan Admin, **I want to** set performance goals for my clan, **so that** we can track progress toward targets.

**Acceptance Criteria**:
- Goals setting page allows defining targets:
  - Target win rate, target average ratio, target participation rate
- Dashboard and reports show progress toward goals
- Visual indicators (progress bars) show how close to goals
- Can set monthly or yearly goals
- Notifications when goals are achieved

---

## Appendix: Story Prioritization Guidelines

For implementation planning, stories should generally be prioritized as follows:

**Phase 1 - Core Foundation**:
- Epic 1 stories for navigation and authentication
- Epic 2 stories for user registration and basic clan management
- Core roster management (Epic 3: stories 3.1-3.7)

**Phase 2 - Data Entry**:
- Complete Epic 4 for battle data recording
- Remaining Epic 3 stories for roster features

**Phase 3 - Viewing & Analysis**:
- Epic 5 for battle stats viewing
- Epic 6 for monthly/yearly summaries
- Epic 7 for reports and visualizations

**Phase 4 - Enhancements**:
- Advanced features in all epics (export, share, goals, etc.)
- Performance optimizations
- Mobile-specific improvements

Each epic can be further prioritized based on dependencies and user value.
