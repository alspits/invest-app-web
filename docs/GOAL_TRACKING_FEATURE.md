# Goal Tracking Feature Documentation

## Overview

The Goal Tracking feature enables users to set, monitor, and achieve investment goals with automatic progress tracking, deadline management, and intelligent alerts. Goals are automatically updated based on portfolio performance and provide visual feedback on progress.

## Features

### 🎯 Multiple Goal Types
- **Target Portfolio Value**: Reach a specific total portfolio value (e.g., 1,000,000 RUB)
- **Target Return %**: Achieve a specific return percentage (e.g., 20% ROI)
- **Save Amount**: Save a specific amount by a deadline
- **Target Position**: Accumulate specific number of shares (manual tracking)
- **Diversification**: Achieve target diversification score

### 📊 Automatic Progress Tracking
- Real-time progress calculation
- Automatic value updates from portfolio metrics
- Progress percentage (0-100%)
- Remaining amount display
- Days until deadline countdown

### ⚠️ Smart Alerts
- **Goal Achieved**: Celebration when 100% reached
- **Deadline Near**: Warning 7 days before deadline
- **Deadline Passed**: Notification when deadline missed
- **At Risk**: Alert when progress lags expectations

### 📈 Status Indicators
- **On-Track**: Progress matches or exceeds expected pace (green)
- **At-Risk**: Progress below expected pace (yellow)
- **Overdue**: Deadline passed without completion (red)
- **Completed**: Goal successfully achieved (green checkmark)

### 💾 localStorage Persistence
- Goals saved in browser localStorage
- Survives page refreshes
- No backend required
- Per-browser storage

## Setup

No additional setup required! The feature works out of the box with your existing portfolio data.

## Usage

### Creating a Goal

1. Navigate to Portfolio → Goals tab
2. Click "Новая цель" (New Goal) button
3. Fill in the form:
   - **Name**: Goal title (e.g., "Reach 1M RUB")
   - **Description**: Optional details
   - **Type**: Select goal type
   - **Target Value**: Amount to reach
   - **Current Value**: Starting value (0 for auto-update)
   - **Deadline**: Target date
4. Click "Создать цель" (Create Goal)

### Managing Goals

**Complete a Goal**:
- Click "Завершить" (Complete) button on goal card
- Marks as completed and sets value to target

**Reset Progress**:
- Click "Сбросить" (Reset) on completed goals
- Resets to active state with 0 current value

**Delete a Goal**:
- Click trash icon on goal card
- Confirms deletion with browser prompt

### Understanding Progress

**Progress Bar Colors**:
- 🟢 Green: Completed (100%)
- 🔵 Blue: On-track
- 🟡 Yellow: At-risk
- 🔴 Red: Overdue

**Status Badges**:
- ✅ Достигнута (Completed)
- 📈 В процессе (On-Track)
- ⚠️ Под угрозой (At-Risk)
- ❌ Просрочена (Overdue)

## Technical Architecture

### Data Flow

```
Portfolio/Analytics Change
        ↓
useGoalAutoUpdate Hook
        ↓
Calculate Metrics
        ↓
Auto-Update Goals
        ↓
Refresh Progress
        ↓
Generate Alerts
        ↓
Update UI
```

### Components

#### GoalList
**Location**: `src/components/features/Goals/GoalList.tsx`

Main container component that:
- Displays all goals for selected account
- Shows alert banners
- Provides "New Goal" button
- Handles empty states
- Integrates auto-update hook

**Props**: None (uses stores)

#### GoalCard
**Location**: `src/components/features/Goals/GoalCard.tsx`

Individual goal display:
- Status badge with icon
- Animated progress bar
- Current/target values
- Days remaining
- Action buttons (Complete/Reset/Delete)

**Props**:
```typescript
{
  goal: Goal;
  progress: GoalProgress;
  onDelete: (id: string) => void;
  onReset: (id: string) => void;
  onComplete: (id: string) => void;
}
```

#### GoalForm
**Location**: `src/components/features/Goals/GoalForm.tsx`

Create/edit form with:
- Name and description inputs
- Goal type selector
- Target value input
- Current value input
- Deadline date picker
- Form validation
- Error messages

**Props**:
```typescript
{
  portfolioId: string;
  onSubmit: (input: CreateGoalInput) => void;
  onCancel: () => void;
}
```

### Service Layer

**GoalService** (`src/lib/goal-service.ts`):

Static class with methods:
```typescript
// CRUD
getAllGoals(): Goal[]
getGoalsByPortfolio(portfolioId: string): Goal[]
getGoalById(id: string): Goal | null
createGoal(input: CreateGoalInput): Goal
updateGoal(input: UpdateGoalInput): Goal
deleteGoal(id: string): void

// Operations
updateGoalProgress(id: string, currentValue: number): Goal
completeGoal(id: string): Goal
resetGoalProgress(id: string): Goal

// Auto-update
autoUpdateGoals(portfolioId: string, metrics: {...}): Goal[]
getPortfolioAlerts(portfolioId: string): GoalAlert[]
```

### State Management

**GoalStore** (`src/stores/goalStore.ts`):

Zustand store with:
```typescript
interface GoalState {
  goals: Goal[];
  goalProgresses: Map<string, GoalProgress>;
  alerts: GoalAlert[];
  isLoadingGoals: boolean;
  goalError: string | null;

  loadGoals: (portfolioId: string) => void;
  createGoal: (input: CreateGoalInput) => void;
  updateGoal: (input: UpdateGoalInput) => void;
  deleteGoal: (id: string) => void;
  completeGoal: (id: string) => void;
  resetGoalProgress: (id: string) => void;
  autoUpdateGoals: (...) => void;
  refreshProgresses: () => void;
}
```

### Auto-Update Hook

**useGoalAutoUpdate** (`src/hooks/useGoalAutoUpdate.ts`):

Custom hook that:
- Monitors portfolio and analytics stores
- Calculates total portfolio value
- Extracts ROI percentage
- Extracts diversification score
- Calls `autoUpdateGoals()` on changes

**Usage**:
```typescript
// In GoalList component
useGoalAutoUpdate();
```

## Goal Types Reference

### TARGET_VALUE
**Description**: Target total portfolio value

**Auto-Update**: Yes (from portfolio total value)

**Example**: Reach 1,000,000 RUB

**Value Format**: Currency (RUB)

### TARGET_RETURN
**Description**: Target return percentage

**Auto-Update**: Yes (from analytics ROI)

**Example**: Achieve 20% ROI

**Value Format**: Percentage

### TARGET_POSITION
**Description**: Accumulate specific position

**Auto-Update**: No (manual only)

**Example**: Own 100 shares of SBER

**Value Format**: Number of shares

### SAVE_AMOUNT
**Description**: Save specific amount

**Auto-Update**: Yes (from portfolio total value)

**Example**: Save 500,000 RUB by year-end

**Value Format**: Currency (RUB)

### DIVERSIFICATION
**Description**: Achieve diversification score

**Auto-Update**: Yes (from analytics)

**Example**: Reach 80% diversification

**Value Format**: Percentage

## Progress Calculation

### Formula
```typescript
progress = (currentValue / targetValue) * 100
```

Clamped between 0-100%.

### On-Track Algorithm

1. Calculate time elapsed since creation
2. Calculate expected progress: `(elapsed / totalDuration) * 100`
3. Compare actual vs. expected
4. On-track if: `actual >= expected * 0.8` (80% threshold)

**Example**:
- Created: Jan 1, 2025
- Deadline: Dec 31, 2025
- Today: Jul 1, 2025 (50% elapsed)
- Expected progress: 50%
- Actual progress: 45%
- Status: On-track (45% >= 40%)

## Alerts System

### Alert Generation

Alerts auto-generated when:
- Progress reaches 100% → **Goal Achieved**
- Days remaining ≤ 7 → **Deadline Near**
- Deadline passed → **Deadline Passed**
- On-track check fails → **At Risk**

### Alert Display

- Shown at top of GoalList
- Color-coded by severity
- Includes goal name and message
- Dismissible (hidden until page refresh)
- Multiple alerts can show simultaneously

### Alert Colors

| Severity | Color | Border | Icon |
|----------|-------|--------|------|
| success | Green | border-green-200 | CheckCircle |
| warning | Yellow | border-yellow-200 | AlertTriangle |
| error | Red | border-red-200 | AlertCircle |
| info | Blue | border-blue-200 | Info |

## localStorage Schema

**Key**: `investment_goals`

**Value**: Array of Goal objects

**Example**:
```json
[
  {
    "id": "goal_1705334400000_abc123",
    "portfolioId": "2149205432",
    "name": "Reach 1M RUB",
    "description": "Long-term savings goal",
    "goalType": "TARGET_VALUE",
    "targetValue": 1000000,
    "currentValue": 750000,
    "deadline": "2025-12-31T00:00:00.000Z",
    "status": "ACTIVE",
    "createdAt": "2025-01-15T12:00:00.000Z",
    "updatedAt": "2025-01-15T14:30:00.000Z"
  }
]
```

## Form Validation

### Required Fields
- Name (min 1 character)
- Goal Type (selection)
- Target Value (> 0)
- Deadline (future date)

### Validation Rules

**Name**:
- Cannot be empty
- Error: "Название цели обязательно"

**Target Value**:
- Must be positive number
- Error: "Целевое значение должно быть больше 0"

**Deadline**:
- Must be in the future
- Error: "Срок должен быть в будущем"

**Current Value**:
- Optional (defaults to 0)
- Must be non-negative

## Responsive Design

### Breakpoints

- **Mobile** (< 768px): 1 column grid
- **Tablet** (768px - 1024px): 2 columns grid
- **Desktop** (≥ 1024px): 3 columns grid

### Component Adaptations

- Alert banners: Full width on all screens
- Goal cards: Stack vertically on mobile
- Form: Full width on mobile, fixed max-width on desktop
- Buttons: Full width on mobile, auto on desktop

## Accessibility

### Keyboard Navigation
- Tab through goals
- Enter to activate buttons
- Escape to close form

### ARIA Labels
- Goal cards have `role="article"`
- Buttons have descriptive `aria-label`
- Form inputs have associated labels

### Screen Readers
- Status announced on change
- Progress percentage announced
- Alerts have appropriate severity

## Performance Considerations

### Optimization Strategies

1. **Lazy Calculation**: Progress/alerts calculated only when needed
2. **Memoization**: Progress map cached in store
3. **Batch Updates**: All goals updated together
4. **localStorage**: Fast synchronous reads
5. **No Network**: All operations local

### Performance Metrics

- Goal creation: < 10ms
- Progress update: < 5ms
- Alert generation: < 3ms per goal
- localStorage read: < 1ms
- localStorage write: < 2ms

## Error Handling

### Error Types

1. **Validation Errors**: Invalid form data
2. **Storage Errors**: localStorage full/unavailable
3. **Update Errors**: Goal not found

### Error Display

- Form errors: Inline red text under field
- Operation errors: Toast notification (if implemented)
- Critical errors: Error boundary fallback

### Error Recovery

- Validation: Show errors, prevent submission
- Storage: Fallback to in-memory (non-persistent)
- Not found: Remove from UI, log warning

## Best Practices

### Creating Goals

✅ **Do**:
- Use specific, measurable targets
- Set realistic deadlines
- Start with currentValue = 0 for auto-update
- Use descriptive names
- Add context in description

❌ **Don't**:
- Set deadlines in the past
- Use zero or negative targets
- Create duplicate goals
- Use vague names

### Managing Goals

✅ **Do**:
- Review progress regularly
- Update deadlines if needed
- Complete goals when achieved
- Delete obsolete goals
- Monitor alerts

❌ **Don't**:
- Ignore at-risk warnings
- Reset completed goals unnecessarily
- Delete goals with valuable history
- Set unrealistic targets

## Troubleshooting

### Goals Not Auto-Updating

**Problem**: Current value not changing

**Solutions**:
1. Check if goal type supports auto-update
2. Verify portfolio is loaded
3. Check analytics metrics available
4. Refresh portfolio data
5. Check browser console for errors

### localStorage Quota Exceeded

**Problem**: "QuotaExceededError" in console

**Solutions**:
1. Delete old/completed goals
2. Clear other localStorage data
3. Use incognito mode (temporary)
4. Consider backend implementation

### Progress Not Showing

**Problem**: Progress bar empty/incorrect

**Solutions**:
1. Check targetValue > 0
2. Verify currentValue is set
3. Refresh goals with F5
4. Check store state in devtools

### Alerts Not Appearing

**Problem**: No alerts despite conditions met

**Solutions**:
1. Check if alert was dismissed
2. Verify deadline/progress values
3. Refresh page to regenerate
4. Check console for errors

## Future Enhancements

### Planned Features

- [ ] **Cloud Sync**: Sync goals across devices
- [ ] **Recurring Goals**: Monthly/yearly targets
- [ ] **Sub-Goals**: Milestones within main goal
- [ ] **Templates**: Pre-defined goal templates
- [ ] **History**: Track completed goals
- [ ] **Categories**: Organize by category
- [ ] **Notifications**: Email/push alerts
- [ ] **Sharing**: Share with advisor
- [ ] **Charts**: Progress visualization
- [ ] **AI Recommendations**: Suggested goals

### API Integration (Future)

Potential backend endpoints:
```typescript
POST   /api/goals          // Create goal
GET    /api/goals          // List goals
GET    /api/goals/:id      // Get goal
PATCH  /api/goals/:id      // Update goal
DELETE /api/goals/:id      // Delete goal
POST   /api/goals/:id/complete  // Complete goal
```

## Support

For issues or questions:
1. Check this documentation
2. Review console logs
3. Verify localStorage access
4. Check goal store state
5. Review code in `src/lib/goal-service.ts`

## Credits

- **Icons**: Lucide React
- **State Management**: Zustand
- **Validation**: Zod
- **Date Formatting**: date-fns
