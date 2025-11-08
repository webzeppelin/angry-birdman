# Angry Birdman - User Experience Specification

## Table of Contents

1. [User Personas](#1-user-personas)
2. [User Journey](#2-user-journey)
3. [Global UI Components](#3-global-ui-components)
4. [Screen Specifications](#4-screen-specifications)
5. [Design System](#5-design-system)
6. [Accessibility Guidelines](#6-accessibility-guidelines)
7. [Responsive Design Guidelines](#7-responsive-design-guidelines)
8. [Interaction Patterns](#8-interaction-patterns)

---

## 1. User Personas

### 1.1 Anonymous User / Clan Member

**Primary Characteristics**:

- Wants to view clan battle statistics and performance
- May be a clan member checking their clan's progress
- Could be from a competing clan researching opponents
- Primarily consumes data rather than creating it
- Uses variety of devices (mobile, tablet, desktop)

**Goals**:

- Quickly find and view clan battle history
- Understand clan performance trends
- Compare individual player performance
- Access information without registration barriers

**Pain Points**:

- Information overload with too many statistics
- Difficulty finding specific battles or time periods
- Poor mobile experience when checking stats on-the-go

**UX Priorities**:

- Fast, mobile-first browsing experience
- Clear information hierarchy
- Minimal friction to access data

### 1.2 Clan Admin

**Primary Characteristics**:

- Manages battle data entry and roster maintenance
- Time-pressed (often entering data between battles)
- May use mobile device for data entry during/after battles
- Wants efficient workflows to minimize administrative overhead
- Responsible for accuracy of clan data

**Goals**:

- Quickly capture battle results from Angry Birds 2 UI
- Manage roster changes (additions, departures, status changes)
- Review clan performance to make strategic decisions
- Assign action codes after battles (warnings, kicks, etc.)

**Pain Points**:

- Data entry is time-consuming and error-prone
- Mobile data entry is often clunky
- Switching between Angry Birds 2 and management system
- Forgetting to capture data immediately after battles

**UX Priorities**:

- Keyboard-first data entry workflows
- Mobile-optimized input forms
- Field order matching Angry Birds 2 UI presentation
- Quick-save and draft functionality

### 1.3 Clan Owner

**Primary Characteristics**:

- Has all Clan Admin responsibilities plus ownership duties
- Strategic decision-maker for clan direction
- May delegate daily admin tasks but retains oversight
- Responsible for clan member management and long-term planning

**Goals**:

- All Clan Admin goals plus:
- Manage admin permissions and roles
- Make strategic roster decisions based on analytics
- Transfer ownership when stepping down
- Maintain clan's competitive standing

**Pain Points**:

- Balancing administrative overhead with strategic planning
- Ensuring data quality when delegating to other admins
- Making difficult roster decisions without sufficient data

**UX Priorities**:

- Administrative control panels
- Analytics and reporting dashboards
- Delegation and permission management tools

### 1.4 Superadmin

**Primary Characteristics**:

- System administrator with cross-clan access
- Technical user comfortable with advanced features
- Responsible for system integrity and global settings
- May provide support to clan administrators

**Goals**:

- Manage system-wide settings and configurations
- Monitor data quality across all clans
- Provide support to clan administrators
- Manage action codes and global system parameters

**Pain Points**:

- Context switching between different clans
- Identifying data quality issues across large dataset
- Providing effective support without full clan context

**UX Priorities**:

- Powerful administrative interfaces
- System monitoring and health dashboards
- Efficient clan switching and context management

---

## 2. User Journey

### 2.1 Anonymous User Journey

**Discovery Phase**:

1. **Landing Page** → learns about Angry Birdman's purpose
2. **Browse Clans** → explores available clan data
3. **Clan Selection** → chooses specific clan to investigate

**Exploration Phase**: 4. **Clan Overview** → gets high-level clan statistics 5.
**Battle History** → browses through battle results 6. **Battle Details** →
dives deep into specific battle performance 7. **Analytics** → views trends and
comparative statistics

**Key Touchpoints**:

- First impression on landing page (fun, professional, clear purpose)
- Clan discovery and selection (easy browsing, good filtering)
- Data consumption (clear charts, intuitive navigation)

### 2.2 Clan Admin Journey

**Authentication Phase**:

1. **Sign In** → authenticates with clan credentials
2. **Dashboard** → sees clan overview and pending tasks

**Data Entry Phase**: 3. **Battle Entry** → captures battle results from Angry
Birds 2 4. **Player Management** → updates roster status and information 5.
**Action Assignment** → assigns post-battle action codes

**Review Phase**: 6. **Data Verification** → reviews entered data for
accuracy 7. **Analytics Review** → analyzes clan performance trends 8.
**Strategic Planning** → makes roster and strategy decisions

**Key Touchpoints**:

- Authentication flow (simple, secure, remembers preferences)
- Data entry forms (fast, mobile-friendly, follows AB2 field order)
- Review and analytics (comprehensive but not overwhelming)

### 2.3 Ownership Transfer Journey

**Preparation Phase**:

1. **Admin Promotion** → current owner promotes target user to admin
2. **Access Verification** → confirms new admin can access system

**Transfer Phase**: 3. **Ownership Transfer** → initiates transfer process 4.
**Confirmation** → both parties confirm the transfer 5. **Handoff** → access
levels are updated

**Key Touchpoints**:

- Clear transfer process (no confusion about steps)
- Security confirmation (protects against accidental transfers)
- Smooth transition (no service interruption)

---

## 3. Global UI Components

### 3.1 Header

**Purpose**: Primary navigation and branding, authentication status

**Components**:

- **Logo/Branding**: "Angry Birdman" with playful bird icon
- **Primary Navigation**: Home, Browse Clans, About
- **Authentication Area**: Sign In/Register (anon) or User Menu (auth)
- **Clan Context**: Current clan indicator (when applicable)

**Behavior**:

- Sticky/fixed position for constant access
- Responsive collapse to hamburger menu on mobile
- Clan context appears when viewing clan-specific content
- User menu shows role, clan, and logout option

**Specifications**:

- Height: 64px desktop, 56px mobile
- Background: Primary brand color with subtle gradient
- Typography: Logo in display font, navigation in interface font
- Keyboard: Tab navigation, Enter/Space activation

### 3.2 Navigation

**Primary Navigation (Global)**:

- **Home**: Landing page with system overview
- **Browse Clans**: Searchable directory of all clans
- **About**: System information and help

**Secondary Navigation (Clan-Specific)**:

- **Overview**: Clan dashboard and summary statistics
- **Battles**: Battle history and detailed battle views
- **Roster**: Current and historical roster management
- **Analytics**: Charts, trends, and comparative analysis

**Admin Navigation (Authenticated)**:

- **Dashboard**: Admin-specific overview and pending tasks
- **Enter Battle**: Battle data entry forms
- **Manage Roster**: Roster editing and action assignments
- **Reports**: Administrative reports and exports

**Specifications**:

- Breadcrumbs for deep navigation
- Active state indicators
- Keyboard shortcuts (Alt+H for Home, Alt+B for Battles, etc.)
- Touch-friendly sizing (minimum 44px tap targets)

### 3.3 Branding

**Visual Identity**:

- **Primary Colors**:
  - Red (#E74C3C) - primary brand color, inspired by Angry Birds
  - Blue (#3498DB) - secondary color for data and analytics
  - Green (#27AE60) - success states and positive metrics
  - Orange (#F39C12) - warnings and attention areas
- **Typography**:
  - Display: "Fredoka One" for headings (playful, game-like)
  - Interface: "Inter" for UI elements (clean, readable)
  - Data: "JetBrains Mono" for numbers and statistics
- **Iconography**:
  - Feather icons for UI elements
  - Custom bird-themed icons for clan/battle concepts
  - Consistent 24px grid system

**Tone and Voice**:

- Friendly and approachable but professional
- Game-aware terminology (uses AB2 concepts naturally)
- Encouraging rather than judgmental about performance
- Clear and direct instructions for efficiency

### 3.4 Footer

**Purpose**: Secondary links, legal information, system status

**Components**:

- **Links**: Privacy Policy, Terms of Service, Help/Support
- **System Info**: Version number, last updated timestamp
- **Credits**: "Made for Angry Birds 2 clan managers"
- **Legal**: Copyright notice, third-party attributions

**Behavior**:

- Minimal, unobtrusive design
- Consistent across all pages
- Links open appropriately (external in new tabs)

**Specifications**:

- Background: Neutral gray (#F8F9FA)
- Typography: Small text (14px), muted color
- Padding: Adequate spacing but compact overall

---

## 4. Screen Specifications

### 4.1 Landing Page

**Purpose**: System introduction and primary entry point

**Layout**:

- **Hero Section**:
  - Prominent heading: "Clan Management for Angry Birds 2"
  - Subtitle explaining purpose and value proposition
  - Primary CTA: "Browse Clans" button
  - Secondary CTA: "Sign In" for administrators
- **Feature Highlights**:
  - Three-column layout showcasing key features
  - Icons + brief descriptions for battle tracking, analytics, roster management
- **Getting Started**:
  - Simple explanation of how to use the system
  - Links to browse clans or register new clan

**Responsive Behavior**:

- Desktop: Full hero with side-by-side feature columns
- Tablet: Stacked hero with 2-column features
- Mobile: Single column throughout, condensed hero

**Key Interactions**:

- Hover effects on CTAs and feature cards
- Smooth scrolling to sections
- Keyboard navigation support

### 4.2 Clan Directory (Browse Clans)

**Purpose**: Discover and select clans to explore

**Layout**:

- **Search/Filter Bar**:
  - Search input (placeholder: "Search clan names...")
  - Country filter dropdown
  - Sort options (Name A-Z, Name Z-A, Battle Count)
- **Clan Grid**:
  - Card-based layout showing clan preview information
  - Each card: Clan name, country flag, battle count, latest battle date
  - Hover/focus states indicate clickability
- **Pagination/Loading**:
  - "Load More" button or infinite scroll for large lists
  - Loading states and empty states

**Responsive Behavior**:

- Desktop: 3-4 column grid
- Tablet: 2-3 column grid
- Mobile: Single column list

**Key Interactions**:

- Real-time search (debounced)
- Filter state persistence in URL
- Keyboard navigation through cards

### 4.3 Clan Overview Page

**Purpose**: High-level clan information and navigation hub

**Layout**:

- **Clan Header**:
  - Clan name and country
  - Key statistics: Total battles, Win rate, Current streak
  - Quick actions (admin only): "Enter Battle", "Manage Roster"
- **Recent Activity**:
  - Last 5 battles with results and dates
  - "View All Battles" link
- **Performance Summary**:
  - Charts showing recent trends (win rate, ratio scores)
  - Current roster count and active/reserve breakdown
- **Quick Links**:
  - Prominent navigation to major sections
  - Admin-specific links when authenticated

**Responsive Behavior**:

- Desktop: Multi-column dashboard layout
- Tablet: Stacked sections with maintained proportions
- Mobile: Single column with collapsible sections

**Key Interactions**:

- Interactive charts with hover details
- Expandable sections for space efficiency
- Quick action buttons prominently placed

### 4.4 Battle Entry Form

**Purpose**: Efficient capture of battle data from Angry Birds 2

**Layout**:

- **Battle Information** (Step 1):
  - Start Date, End Date (auto-calculated +1 day)
  - Opponent Rovio ID, Name, Country
  - Battle scores (Clan score, Opponent score)
  - Baseline FP input
- **Player Performance** (Step 2):
  - Dynamic table with rank, name, score, FP columns
  - Auto-calculation of ratios
  - Add/remove player rows
  - Bulk import option
- **Non-Players** (Step 3):
  - List of roster members who didn't participate
  - Reserve status toggles
- **Review and Submit** (Step 4):
  - Summary of all entered data
  - Calculated statistics preview
  - Save as draft or submit final

**Field Order** (matching Angry Birds 2 UI):

1. Start Date → End Date → Opponent Rovio ID → Opponent Name → Country
2. Clan Score → Baseline FP → Opponent Score → Opponent FP
3. For each player: Rank → Name → Score → FP
4. Non-player names and FP values

**Responsive Behavior**:

- Desktop: Side-by-side form sections
- Tablet: Stacked sections with optimized input sizing
- Mobile: Single column with large touch targets

**Key Interactions**:

- Tab navigation follows field order exactly
- Auto-save drafts every 30 seconds
- Smart defaults and validation
- Keyboard shortcuts for common actions

### 4.5 Battle Detail Page

**Purpose**: Comprehensive view of a single battle's results

**Layout**:

- **Battle Header**:
  - Date, opponents, final scores, result (W/L/T)
  - Key statistics: Ratio scores, margins, participation rate
- **Clan Performance Tab**:
  - Detailed clan statistics and calculations
  - Player performance table with sortable columns
  - Performance tier indicators (color coding)
- **Opponent Analysis Tab**:
  - Opponent information and historical matchups
  - Comparative analysis (FP advantage, score efficiency)
- **Non-Players Tab**:
  - List of non-participating roster members
  - Impact analysis (projected scores if all played)

**Responsive Behavior**:

- Desktop: Tabbed interface with data tables
- Tablet: Stacked sections with horizontal scroll for tables
- Mobile: Accordion sections with simplified table views

**Key Interactions**:

- Sortable columns in all data tables
- Expandable rows for additional player details
- Export functionality for data sharing

### 4.6 Roster Management

**Purpose**: Maintain clan member information and status

**Layout**:

- **Active Roster Section**:
  - Table with member name, join date, FP, battle count
  - Status indicators (active, reserve, warned)
  - Quick action buttons (edit, warn, kick, reserve)
- **Roster History Section**:
  - Former members with departure dates and reasons
  - Filter by date ranges and departure types
- **Add Member Form**:
  - Simple form for new member addition
  - Bulk import from CSV option
- **Action Assignment**:
  - Post-battle action code assignment interface
  - Batch operations for multiple members

**Responsive Behavior**:

- Desktop: Full table with all columns visible
- Tablet: Horizontal scroll for table, simplified actions
- Mobile: Card-based layout instead of table

**Key Interactions**:

- Inline editing for member information
- Confirmation dialogs for destructive actions
- Batch selection for bulk operations

### 4.7 Analytics Dashboard

**Purpose**: Visual analysis of clan performance trends

**Layout**:

- **Time Period Selector**:
  - Tabs for different periods (Last 30 days, Monthly, Yearly)
  - Custom date range picker
- **Performance Charts**:
  - Win rate trends over time
  - Ratio score distributions and averages
  - Participation rate tracking
- **Comparative Analysis**:
  - Player performance rankings
  - Historical comparisons
  - Peer clan benchmarking (if available)
- **Summary Statistics**:
  - Key metrics and improvements/declines
  - Achievement highlights and areas for improvement

**Responsive Behavior**:

- Desktop: Multi-chart dashboard layout
- Tablet: Stacked charts with touch-friendly controls
- Mobile: Single chart view with swipe navigation

**Key Interactions**:

- Interactive charts with zoom and drill-down
- Date range brushing for detailed analysis
- Export charts as images or data

### 4.8 User Authentication

**Purpose**: Secure access for administrative functions

**Sign In Layout**:

- **Simple Form**:
  - Email/username field
  - Password field
  - "Remember me" checkbox
  - "Forgot password" link
- **OAuth Options**:
  - Keycloak-based authentication
  - Clear privacy and security messaging
- **Registration Link**:
  - Clear path to account creation

**Registration Layout**:

- **Account Information**:
  - Email, password, confirm password
  - Display name for system use
- **Clan Association**:
  - Option to register new clan or join existing
  - Clan verification process
- **Terms Acceptance**:
  - Clear terms of service and privacy policy links
  - Required acceptance checkbox

**Responsive Behavior**:

- Desktop: Centered form with ample whitespace
- Mobile: Full-width form with large touch targets

**Key Interactions**:

- Real-time validation feedback
- Clear error messaging
- Progressive disclosure for complex workflows

---

## 5. Design System

### 5.1 Color Palette

**Primary Colors**:

- **Red (#E74C3C)**: Primary brand, CTAs, important actions
- **Blue (#3498DB)**: Secondary brand, information, links
- **Green (#27AE60)**: Success, positive metrics, confirmations
- **Orange (#F39C12)**: Warnings, attention, pending states
- **Gray (#95A5A6)**: Neutral text, borders, inactive states

**Semantic Colors**:

- **Success**: Green variants for positive outcomes
- **Warning**: Orange/yellow for caution states
- **Error**: Red variants for problems and failures
- **Info**: Blue variants for informational content

**Background Colors**:

- **Primary**: White (#FFFFFF) for main content areas
- **Secondary**: Light gray (#F8F9FA) for subtle backgrounds
- **Accent**: Very light brand colors for highlighting

### 5.2 Typography Scale

**Headings**:

- **H1**: 2.5rem (40px) - Page titles
- **H2**: 2rem (32px) - Section headers
- **H3**: 1.5rem (24px) - Subsection headers
- **H4**: 1.25rem (20px) - Component titles
- **H5**: 1rem (16px) - Small headers
- **H6**: 0.875rem (14px) - Captions

**Body Text**:

- **Large**: 1.125rem (18px) - Important content
- **Base**: 1rem (16px) - Standard body text
- **Small**: 0.875rem (14px) - Supporting text
- **Extra Small**: 0.75rem (12px) - Captions, metadata

**Line Heights**:

- Headings: 1.2 for tight, impactful spacing
- Body text: 1.5 for optimal readability
- UI elements: 1.4 for compact but readable

### 5.3 Spacing System

**Base Unit**: 8px for consistent spacing throughout

**Scale**:

- **XS**: 4px (0.25rem)
- **SM**: 8px (0.5rem)
- **MD**: 16px (1rem)
- **LG**: 24px (1.5rem)
- **XL**: 32px (2rem)
- **2XL**: 48px (3rem)
- **3XL**: 64px (4rem)

**Usage**:

- Component padding: SM to MD
- Section spacing: LG to XL
- Page margins: XL to 2XL
- Element gaps: XS to SM

### 5.4 Component Library

**Buttons**:

- **Primary**: Red background, white text, rounded corners
- **Secondary**: Blue outline, blue text, transparent background
- **Tertiary**: Gray text, no background, underline on hover
- **Sizes**: Small (32px), Medium (40px), Large (48px)
- **States**: Default, hover, active, disabled, loading

**Form Elements**:

- **Inputs**: Clean borders, focus states, error styling
- **Labels**: Clear hierarchy, required field indicators
- **Validation**: Inline messages, color-coded feedback
- **Touch targets**: Minimum 44px for mobile accessibility

**Cards**:

- **Standard**: White background, subtle shadow, rounded corners
- **Interactive**: Hover effects, clickable states
- **Variants**: Information, warning, success styling

**Data Tables**:

- **Headers**: Sortable indicators, sticky positioning
- **Rows**: Alternating colors, hover states, selection
- **Responsive**: Horizontal scroll, card-based mobile views

---

## 6. Accessibility Guidelines

### 6.1 WCAG 2.1 Compliance

**Level AA Conformance**:

- Color contrast ratios meet 4.5:1 minimum for normal text
- Color contrast ratios meet 3:1 minimum for large text
- All functionality available via keyboard navigation
- Focus indicators clearly visible on all interactive elements

**Semantic HTML**:

- Proper heading hierarchy (h1 → h2 → h3)
- Form labels correctly associated with inputs
- Lists use appropriate ul/ol/li structure
- Tables include proper headers and captions

**Screen Reader Support**:

- Alt text for all meaningful images
- ARIA labels for complex interactions
- Live regions for dynamic content updates
- Skip links for navigation efficiency

### 6.2 Keyboard Navigation

**Tab Order**:

- Logical flow through page content
- Visible focus indicators on all interactive elements
- Skip links to main content and navigation

**Keyboard Shortcuts**:

- **Global**: Alt+H (Home), Alt+B (Battles), Alt+R (Roster)
- **Data Entry**: Tab (next field), Shift+Tab (previous), Enter (submit)
- **Tables**: Arrow keys for cell navigation, Space for selection
- **Forms**: Enter to submit, Escape to cancel

**Focus Management**:

- Focus moves logically through forms
- Modal dialogs trap focus appropriately
- Focus returns to trigger element when modals close

### 6.3 Screen Reader Considerations

**Content Structure**:

- Headings provide clear page outline
- Landmarks identify major page regions
- Lists group related items logically

**Dynamic Content**:

- Loading states announced to screen readers
- Form validation messages read aloud
- Data table updates communicated clearly

**Image Descriptions**:

- Charts include text alternatives describing data
- Decorative images marked appropriately
- Complex graphics include extended descriptions

---

## 7. Responsive Design Guidelines

### 7.1 Breakpoint Strategy

**Breakpoints**:

- **Mobile**: 320px - 767px (small screens, phones)
- **Tablet**: 768px - 1023px (medium screens, tablets)
- **Desktop**: 1024px+ (large screens, computers)

**Approach**:

- Mobile-first design philosophy
- Progressive enhancement for larger screens
- Flexible layouts using CSS Grid and Flexbox

### 7.2 Mobile Optimizations

**Touch Targets**:

- Minimum 44px tap target size
- Adequate spacing between interactive elements
- Large, thumb-friendly button sizing

**Content Strategy**:

- Prioritize essential information
- Collapsible sections for secondary content
- Simplified navigation patterns

**Performance**:

- Optimized images and assets
- Lazy loading for non-critical content
- Minimal JavaScript for core functionality

### 7.3 Cross-Device Considerations

**Data Entry**:

- Large input fields on mobile devices
- Appropriate keyboard types (numeric, email)
- Auto-complete and smart defaults

**Navigation**:

- Hamburger menu collapse on mobile
- Breadcrumbs for deep navigation
- Bottom navigation bar for frequent actions

**Content Display**:

- Horizontal scroll for data tables
- Card-based layouts for mobile
- Prioritized content above the fold

---

## 8. Interaction Patterns

### 8.1 Data Entry Workflows

**Battle Entry Pattern**:

1. **Progressive Disclosure**: Multi-step form with clear progress
2. **Smart Defaults**: Auto-fill based on previous battles
3. **Validation**: Real-time feedback with helpful error messages
4. **Draft Saving**: Auto-save every 30 seconds, manual save option
5. **Review Step**: Summary before final submission

**Field Order Consistency**:

- Match Angry Birds 2 UI presentation order exactly
- Tab navigation follows reading/entry pattern
- Logical grouping of related fields

**Error Handling**:

- Inline validation with specific guidance
- Form-level error summary at submission
- Preservation of entered data during errors

### 8.2 Data Visualization

**Chart Interactions**:

- **Hover/Touch**: Show detailed values in tooltips
- **Click/Tap**: Drill down to underlying data
- **Zoom**: Support for detailed time range analysis
- **Export**: Save charts as images or download data

**Table Interactions**:

- **Sorting**: Click headers to sort, visual indicators
- **Filtering**: Inline filters with clear reset options
- **Selection**: Checkbox selection for batch operations
- **Pagination**: Clear navigation with page size options

### 8.3 Administrative Actions

**Confirmation Patterns**:

- **Low Risk**: Simple confirmation dialogs
- **Medium Risk**: Type confirmation (type "DELETE" to confirm)
- **High Risk**: Multi-step confirmation with delay

**Batch Operations**:

- Clear selection indicators
- Bulk action confirmation
- Progress indication for long operations
- Undo functionality where possible

**Permission-Based UI**:

- Hide unavailable actions rather than disable
- Clear role indicators where relevant
- Graceful degradation for insufficient permissions

### 8.4 Loading and Empty States

**Loading States**:

- **Skeleton screens** for predictable content layouts
- **Progress indicators** for file uploads and long operations
- **Optimistic updates** for quick actions with rollback

**Empty States**:

- **Helpful messaging** explaining why content is empty
- **Clear next steps** for users to populate content
- **Visual elements** to maintain design consistency

**Error States**:

- **Friendly error messages** with clear resolution steps
- **Retry mechanisms** for transient failures
- **Fallback content** when partial data is available

---

## Implementation Notes

### Framework Integration

**React + TypeScript**:

- Component-based architecture following design system
- Shared component library for consistency
- Type-safe props and state management

**Styling Approach**:

- Tailwind CSS for utility-first styling
- CSS modules for component-specific styles
- Design tokens for consistent theming

**State Management**:

- React Query for server state management
- Context API for global UI state
- Local state for component interactions

### Performance Considerations

**Code Splitting**:

- Route-based code splitting for optimal loading
- Lazy loading of heavy components (charts, complex forms)
- Preloading of likely next pages

**Asset Optimization**:

- WebP images with fallbacks
- Icon sprite sheets or SVG symbols
- Compressed and minified production builds

**User Experience**:

- Optimistic updates for immediate feedback
- Background data fetching for smooth navigation
- Progressive enhancement for core functionality

This specification provides the foundation for implementing a user experience
that meets our objectives of being clean, modern, responsive, efficient, and fun
while serving the specific needs of Angry Birds 2 clan management.
