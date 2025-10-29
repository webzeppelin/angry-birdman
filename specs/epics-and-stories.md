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
- URL is clan-specific (e.g., `/clans/{clanId}`)

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
- Successful authentication redirects to clan home with management controls and menus enabled if the user is already associated with a clan, and to "Browse Clans" page if they are not.
- Failed authentication shows clear error message
- "Forgot Password" link is available
- Session persists across browser refreshes
- Session expires after period of inactivity
- Authentication uses Keycloak for identity management

### Story 1.7: View Admin Navigation Menu

**As a** Clan Admin, **I want to** see an admin-specific navigation menu when authenticated, **so that** I can access management tools for my clan.

**Acceptance Criteria**:
- Admin menu appears in addition to standard navigation when authenticated and associated with a clan
- Menu includes links to: Manage Roster, Record Battle, My Profile, Sign Out
- Admin menu is visually distinguished from public navigation
- Menu is only visible to authenticated admin users associated with the clan in context
- Keyboard shortcut opens admin menu

### Story 1.8: Select Clan (Anonymous)

**As an** anonymous user, **I want to** use a clan selector, **so that** I can quickly switch between viewing different clans' statistics.

**Acceptance Criteria**:
- Clan selector is accessible from any page
- Selector provides search/filter functionality
- Selecting a clan navigates to that clan's landing page
- Recently viewed clans appear at the top of the selector
- Selector works on mobile and desktop devices

### Story 1.9: Select Clan (Clan Admin)

**As a** Clan Admin that has not yet been associated with a clan or is moving between clans, **I want to** navigate to a specific clan's landing page, **so that** I can request administrative access.

**Acceptance Criteria**:
- Page displays button or link for admins to "Request Adminstrative Access"
- After "Request Administrative Access" is initiated, the user can supply a short (less than 256 characters) message that will acommpany the request
- After requesting access, a status popup tells them that their request was submitted and is now pending review and acceptance

### Story 1.10: Select Clan (Superadmin)

**As a** Superadmin, **I want to** use a clan selector to choose which clan I'm currently managing, **so that** I can administer multiple clans efficiently.

**Acceptance Criteria**:
- Clan selector is available in admin interface
- Currently selected clan is clearly indicated
- Changing selected clan updates all admin views to that clan's context
- Selector includes all registered clans
- Search/filter functionality helps find clans quickly

### Story 1.11: Sign Out

**As a** Clan Admin, **I want to** sign out of the application, **so that** I can secure my session when done.

**Acceptance Criteria**:
- Sign Out link/button is clearly visible in admin menu
- Clicking Sign Out ends the session immediately
- User is redirected to landing page after sign out
- Confirmation message indicates successful sign out
- Attempting to access admin pages after sign out redirects to sign-in page

### Story 1.12: Use Keyboard Shortcuts for Navigation

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
- Email must be valid format
- Password meets security requirements (minimum length, complexity)
- Clear validation messages guide user through any errors

### Story 2.3: Post-Registration Triage

**As a** newly registered user, **I want to** know what I need to do next, **so that** I can either register my clan if it does not exist or find my clan and request administrative access if it does.

**Acceptance Criteria**:
- When a user successfully creates their account, they will not be associated with a clan yet, so they need to do something additional
- Newly registered users can easily start registering their new clan or can find their existing clan page to request administrative access

### Story 2.4: Register New Clan

**As a** Clan Owner (newly registered admin), **I want to** register my clan in the system, **so that** I can start tracking our clan's battle data.

**Acceptance Criteria**:
- Clan registration form displayed and functional
- Form collects: clan name, Rovio ID, country
- Clan name and Rovio ID must be unique in the system
- Registering user automatically becomes Clan Owner
- Form validates all required fields
- Successful registration navigates to clan dashboard
- User can only register one clan and will give up ownership of a created clan if they create another

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
- User can edit: username and email address
- Username can be changed, but must be changed to a unique value and associated with the same IdP subject ID
- They have the option to Submit or Cancel their changes
- Form validates all changes before saving
- Success message confirms profile update
- Changes are reflected immediately upon saving changes

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
- They have the option to Submit or Cancel their edits
- Success message confirms update
- Changes are reflected immediately throughout the application

### Story 2.11: View Clan Admin Users

**As a** Clan Admin, **I want to** view all admin users for my clan, **so that** I can see who has administrative access.

**Acceptance Criteria**:
- Admin users page shows list of all admins for the clan
- Each entry shows: username, email, role (Admin/Owner), date added
- Clan Owner users are clearly marked
- Page is accessible from admin menu

### Story 2.12: Accept or Reject Pending Admin Requests

**As a** Clan Admin **I want to** be notified when a new admin user requests administrative access to my clan **so that** I can accept or deny the request.

**Acceptance Criteria**:
- Admin navigation area shows indicator of how many admin requests are waiting
- Interacting with the indicator displays a popup list of admin requests that are pending, including the optional short request message that was entered by the requestor
- For each pending request, the admin has controls for "Accept" or "Reject" that allow them to accept or reject the request
- When an admin accepts the request, the requesting user is associated with the admin's clan
- If the requesting user is an admin of another clan already, that user loses their association with the old clan because a user can only be admin of one clan at a time unless they are the Superadmin

### Story 2.13: Promote Clan Admin to Owner

**As a** Clan Owner, **I want to** promote another Clan Admin to Owner, **so that** I can share ownership responsibilities.

**Acceptance Criteria**:
- Promote to Owner button is available next to each Clan Admin
- Promotion is immediate upon confirmation
- Activity is logged

### Story 2.14: Demote Clan Admin

**As a** Clan Owner, **I want to** remove Clan Admin privileges from a user, **so that** I can control access to management features.

**Acceptance Criteria**:
- Remove admin button is available next to each Clan Admin (not Owner)
- Confirmation dialog prevents accidental removal
- Removed user can no longer access admin features
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
- Superadmin can change or delete user's clan association
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
- Active players are shown by default, with inactive players filtered out
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
- Has option to Submit or Cancel changes to the player information
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
- Import feature accepts CSV 
- Format: player name, joined date (date optional, defaults to current)
- Import validates all entries before committing
- Error report shows any invalid entries
- Valid entries are imported even if some entries fail
- Success message shows count of players imported
- Duplicate names within import are flagged

---

## Epic 4: Record Clan Battle Data

**Epic Goal**: Provide an efficient, keyboard-friendly workflow for capturing battle results from the game UI, minimizing data entry time and errors.

### Story 4.1: Start New Battle Entry

**As a** Clan Admin, **I want to** start recording a new battle, **so that** I can capture the results before the details become unavailable in the game.

**Acceptance Criteria**:
- "Record Battle" button/link is prominently available in admin menu
- Clicking launches battle entry workflow
- Workflow is optimized for keyboard-only data entry
- Can save draft and return later to complete

### Story 4.2: Enter Battle Metadata

**As a** Clan Admin, **I want to** enter basic battle information, **so that** I can identify when and against whom the battle occurred.

**Acceptance Criteria**:
- Form fields in order: start date, end date, opponent name, opponent Rovio ID, opponent country
- System checks for existing battle on selected date and warns if duplicate
- Start date defaults to most recent battle date + 3 days (typical cycle)
- End date defaults to start date + 1 day
- Battle ID (YYYYMMDD) is generated automatically from start date
- Tab key advances through fields in optimal order
- Field validation prevents invalid dates and missing required fields

### Story 4.3: Enter Clan Performance Data

**As a** Clan Admin, **I want to** enter my clan's performance data, **so that** I can record how well we did.

**Acceptance Criteria**:
- Form fields in order: clan score, clan baseline FP
- Fields accept numeric input only
- Tab advances between fields
- Validation ensures positive integers

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
- Can start typing player name for autoselect
- Tab advances through fields, Enter adds next player
- Score can be 0 (player participated but scored nothing)
- FP must be positive integer
- Ratio is calculated automatically
- Can reorder or remove entries before submission
- Interface supports rapid entry of 20-50 players

### Story 4.6: Enter Non-Player Data

**As a** Clan Admin, **I want to** record which roster members didn't play, **so that** I can track participation and manage reserve players.

**Acceptance Criteria**:
- Non-player list shows active roster members not yet entered as players
- Automatically populates list with all non-entered active members
- For each non-player, fields: name (pre-filled), FP, reserve status (checkbox)
- Tab advances through fields, Enter adds next non-player
- Reserve checkbox indicates player is intentionally kept inactive and cannot be edited

### Story 4.7: Assign Action Codes

**As a** Clan Admin, **I want to** assign action codes to all roster members, **so that** I can track intended roster changes after the battle.

**Acceptance Criteria**:
- After entering all player and non-player data, action code assignment screen appears
- Shows all active roster members (players and non-players)
- For each member: name, played status, action code dropdown, optional reason field
- Action codes: HOLD, WARN, KICK, RESERVE, PASS
- Can set default action (e.g., HOLD) for all, then override individuals
- Tab and Enter keys support rapid assignment
- Optional reason field for KICK, WARN, or PASS
- Changes in status (e.g. KICK, RESERVE) are executed in bulk at the time that final battle data is submitted

### Story 4.8: Review Battle Data

**As a** Clan Admin, **I want to** review all entered battle data before submitting, **so that** I can catch and correct any errors.

**Acceptance Criteria**:
- Review screen shows all entered data in organized sections
- Calculated fields are displayed: battle result, ratios, counts
- Edit buttons allow jumping back to specific sections
- Clear visual indication of any missing or invalid data
- Summary statistics help verify accuracy: total players, total non-players, FP totals
- Check made to verify that the total points recorded when entering individual performance data matches the score that was recorded (used like checksum) 

### Story 4.9: Submit Battle Data

**As a** Clan Admin, **I want to** submit completed battle data, **so that** it's saved and calculations are performed.

**Acceptance Criteria**:
- Submit button is prominent on review screen
- Final validation ensures all required data is present and valid
- Submission triggers all calculated field updates
- Success message confirms battle was recorded
- Battle ID and basic results are displayed
- User is directed to view the battle stats for the battle just recorded
- Monthly/yearly summaries are automatically updated

### Story 4.10: Save Battle Draft

**As a** Clan Admin, **I want to** save a partially completed battle entry, **so that** I can return to finish it later without losing my work.

**Acceptance Criteria**:
- "Save Draft" button is available at any stage of entry
- Draft is saved to user's session, not the database
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
- Monthly/yearly summaries are recalculated

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
- Pagination for many battles
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
- Columns: ratio rank, rank (by score), player name, score, FP, ratio, 
- Can sort by any column (ratio rank, rank, name, score, etc.)
- Ratio rank highlights normalized performance, and the default sort is ratio rank ascending
- Color coding or icons indicate performance tiers (excellent/good/average/poor)
- Shows count of players

### Story 5.6: View Player Performance Details

**As an** anonymous user, **I want to** view detailed statistics for a specific player in a battle, **so that** I can understand their individual contribution.

**Acceptance Criteria**:
- Clicking a player opens detailed view or expands row
- Shows: all basic stats (rank, score, FP, ratio, ratio rank)
- Shows action code assigned after battle (for admin transparency)

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

### Story 5.9: View Reserve Player Summary

**As an** anonymous user, **I want to** see summary statistics for reserve players separately, **so that** I can understand the strategic FP management.

**Acceptance Criteria**:
- Reserve summary shows: count of reserve players, total reserve FP
- Shows reserve FP as percentage of total potential FP
- Explains purpose of reserve players (tooltip or note)

### Story 5.10: Compare Battle to Averages

**As an** anonymous user, **I want to** see how this battle compares to the clan's averages, **so that** I can understand if it was typical or exceptional.

**Acceptance Criteria**:
- Comparison section shows current battle stat next to clan average
- Includes: ratio, participation rate, nonplaying FP ratio
- Visual indicators (arrows, colors) show above/below average
- Uses monthly average, yearly average, or all-time average (configurable)

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

### Story 7.4: View Win/Loss Margin Report

**As an** anonymous user, **I want to** view a report showing margin ratios over time, **so that** I can see how closely matched our battles are.

**Acceptance Criteria**:
- Report shows margin ratio (win/loss margin as % of our score) over time
- Bar chart with positive values (wins) and negative values (losses)
- Shows average margin for wins and losses
- Identifies competitive close battles vs. blowouts

### Story 7.5: View Custom Date Range Report

**As an** anonymous user, **I want to** select a custom date range for reports, **so that** I can analyze any time period of interest.

**Acceptance Criteria**:
- Date range picker allows selecting start and end dates
- All report charts update to show only selected date range

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
- For each opponent: country, battles played, win/loss/tie record, average FP difference
- Identifies "rival" clans (frequent matchups)
- Can view head-to-head history with specific opponent
- Can view statistics on the precentage of matches against clans from each country in a selected time period (e.g. over the last month, over the last year, all time)

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
- Shows alerts: incomplete battle drafts, admin user requests
- Quick links to common tasks: Record Battle, Manage Roster, View Reports
- Dashboard is the landing page after sign-in if the admin user has a clan affiliation

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
- Advanced features in all epics
- Performance optimizations
- Mobile-specific improvements

Each epic can be further prioritized based on dependencies and user value.
