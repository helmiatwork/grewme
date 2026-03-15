# `/src/lib/components` — Reusable UI Components

**Responsibility**: Shared, reusable Svelte components organized by category (layout, UI, charts, feed).

**Design Pattern**: Component composition with props-based configuration.

---

## Directory Structure

```
src/lib/components/
├── layout/                    — Layout & navigation components
│   ├── AppShell.svelte        — Main layout wrapper
│   ├── Navbar.svelte          — Top navigation bar
│   ├── Sidebar.svelte         — Left sidebar navigation
│   └── index.ts               — Exports
├── ui/                        — Basic UI components
│   ├── Button.svelte          — Styled button
│   ├── Card.svelte            — Container component
│   ├── Input.svelte           — Text input
│   ├── Alert.svelte           — Alert box
│   ├── Badge.svelte           — Label/tag
│   ├── Toast.svelte           — Toast notification
│   ├── ToastContainer.svelte  — Global toast container
│   ├── Skeleton.svelte        — Loading placeholder
│   └── index.ts               — Exports
├── charts/                    — Data visualization
│   ├── RadarChart.svelte      — Skill radar chart
│   ├── ProgressChart.svelte   — Weekly progress line chart
│   ├── index.ts               — Exports
│   └── _radar/                — Radar chart sub-components
│       ├── AxisRadial.svelte  — Radial axis
│       └── RadarArea.svelte   — Filled area
├── feed/                      — Feed-related components
│   ├── FeedCard.svelte        — Feed post display
│   ├── CommentSection.svelte  — Comments display + form
│   ├── FilePicker.svelte      — File upload UI
│   ├── MediaGallery.svelte    — Media display
│   └── index.ts               — Exports
└── index.ts                   — Root exports
```

---

## Layout Components

### `AppShell.svelte` — Main Layout Wrapper

**Purpose**: Provides consistent layout structure (sidebar + navbar + main content).

**Props**:
```typescript
interface Props {
  user: SessionUser;
  navItems: NavItem[];
  children: Snippet;
}

interface NavItem {
  label: string;
  href: string;
  icon: string;
}
```

**Structure**:
```
<div class="flex h-screen">
  <Sidebar items={navItems} />
  <div class="flex-1 flex flex-col">
    <Navbar user={user} />
    <main class="flex-1 overflow-auto p-6">
      {children}
    </main>
  </div>
</div>
```

**Usage**:
```svelte
<script>
  import { AppShell } from '$lib/components/layout';
  
  let { data } = $props();
  
  const navItems = [
    { label: 'Dashboard', href: '/teacher/dashboard', icon: '📊' },
    { label: 'Students', href: '/teacher/students', icon: '👥' },
    { label: 'Exams', href: '/teacher/exams', icon: '📝' }
  ];
</script>

<AppShell user={data.user} navItems={navItems}>
  <h1>Page Content</h1>
</AppShell>
```

---

### `Navbar.svelte` — Top Navigation Bar

**Purpose**: Display user menu, notifications, language switcher.

**Props**:
```typescript
interface Props {
  user: SessionUser;
}
```

**Features**:
1. **Notification Bell**
   - Shows unread count badge
   - Dropdown with notification list
   - Click to navigate to relevant page
   - Integrates with `notifications.svelte.ts` store

2. **Language Switcher**
   - Dropdown with available locales
   - Uses Paraglide `setLocale()`
   - Persists language preference

3. **User Menu**
   - User initials avatar
   - Logout button
   - Profile link

**Code Highlights**:
```typescript
const notifs = getNotifications();
let showDropdown = $state(false);

async function logout() {
  await fetch('/api/auth/logout', { method: 'POST' });
  window.location.href = '/login';
}

async function markAsRead(id: string) {
  await fetch('/api/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `mutation MarkNotificationRead($id: ID!) { ... }`,
      variables: { id }
    })
  });
}
```

**Notification Dropdown**:
- Shows up to 10 notifications
- Each notification shows: title, body preview, timestamp
- Click notification to navigate + mark as read
- Empty state if no notifications

---

### `Sidebar.svelte` — Left Navigation

**Purpose**: Display navigation items with active route highlighting.

**Props**:
```typescript
interface Props {
  items: NavItem[];
}
```

**Features**:
- Active route highlighting
- Icon + label for each item
- Responsive (collapse on mobile)
- Smooth transitions

---

## UI Components

### `Button.svelte` — Styled Button

**Purpose**: Reusable button with variants.

**Props**:
```typescript
interface Props {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  onclick?: () => void;
  children?: Snippet;
}
```

**Variants**:
- `primary` — Blue background, white text
- `secondary` — Gray background, dark text
- `danger` — Red background, white text

**Usage**:
```svelte
<Button variant="primary" onclick={handleClick}>
  Click Me
</Button>

<Button variant="danger" type="submit">
  Delete
</Button>
```

---

### `Card.svelte` — Container Component

**Purpose**: Reusable card container with optional hover effect.

**Props**:
```typescript
interface Props {
  hover?: boolean;
  children?: Snippet;
}
```

**Features**:
- White background with shadow
- Rounded corners
- Optional hover effect (scale + shadow)
- Padding

**Usage**:
```svelte
<Card hover>
  <h3>Classroom Name</h3>
  <p>School Name</p>
</Card>
```

---

### `Input.svelte` — Text Input

**Purpose**: Styled text input with label.

**Props**:
```typescript
interface Props {
  label?: string;
  type?: 'text' | 'email' | 'password' | 'number';
  placeholder?: string;
  value?: string;
  onchange?: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
}
```

**Usage**:
```svelte
<Input
  label="Email"
  type="email"
  placeholder="user@example.com"
  bind:value={email}
  required
/>
```

---

### `Alert.svelte` — Alert Box

**Purpose**: Display alert messages.

**Props**:
```typescript
interface Props {
  variant?: 'info' | 'warning' | 'error' | 'success';
  title?: string;
  children?: Snippet;
}
```

**Usage**:
```svelte
<Alert variant="error" title="Error">
  Something went wrong. Please try again.
</Alert>
```

---

### `Badge.svelte` — Label/Tag

**Purpose**: Display small labels or tags.

**Props**:
```typescript
interface Props {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  children?: Snippet;
}
```

**Usage**:
```svelte
<Badge variant="success">Active</Badge>
<Badge variant="warning">Pending</Badge>
```

---

### `Toast.svelte` — Toast Notification

**Purpose**: Display temporary notification messages.

**Props**:
```typescript
interface Props {
  id: string;
  title: string;
  body: string;
  variant?: 'info' | 'success' | 'error' | 'warning';
  href?: string;
  onclose?: () => void;
}
```

**Features**:
- Auto-dismiss after 5 seconds
- Click to navigate (if href provided)
- Close button
- Color-coded by variant

---

### `ToastContainer.svelte` — Global Toast Container

**Purpose**: Render all active toasts (rendered in root layout).

**Usage**:
```svelte
<!-- src/routes/+layout.svelte -->
<script>
  import ToastContainer from '$lib/components/ui/ToastContainer.svelte';
</script>

{@render children()}
<ToastContainer />
```

**How It Works**:
1. Toasts store in `toasts.svelte.ts`
2. `addToast()` adds to store
3. ToastContainer reads store and renders all toasts
4. Auto-dismiss removes from store

---

### `Skeleton.svelte` — Loading Placeholder

**Purpose**: Show loading state while data fetches.

**Props**:
```typescript
interface Props {
  width?: string;
  height?: string;
  count?: number;
}
```

**Usage**:
```svelte
{#if loading}
  <Skeleton height="h-12" count={3} />
{:else}
  <!-- Content -->
{/if}
```

---

## Chart Components

### `RadarChart.svelte` — Skill Radar Visualization

**Purpose**: Display student skills as MLBB-style radar chart.

**Props**:
```typescript
interface Props {
  skills: RadarSkills;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}
```

**Data Structure**:
```typescript
interface RadarSkills {
  reading: number | null;
  math: number | null;
  writing: number | null;
  logic: number | null;
  social: number | null;
}
```

**Features**:
- 5-axis radar (Reading, Math, Writing, Logic, Social)
- Scale: 0-100
- Color-coded by skill (from constants.ts)
- Responsive sizing (sm/md/lg)
- Uses LayerCake + D3

**Code Highlights**:
```typescript
const skillKeys = ['READING', 'MATH', 'WRITING', 'LOGIC', 'SOCIAL'] as const;
const data = [{
  name: label,
  reading: skills.reading ?? 0,
  math: skills.math ?? 0,
  writing: skills.writing ?? 0,
  logic: skills.logic ?? 0,
  social: skills.social ?? 0
}];

<LayerCake
  padding={{ top: 30, right: 10, bottom: 10, left: 10 }}
  x={['reading', 'math', 'writing', 'logic', 'social']}
  xDomain={[0, 100]}
  xRange={({ height }) => [0, height / 2]}
  {data}
>
  <Svg>
    <AxisRadial colors={axisColors} labels={axisLabels} />
    <RadarArea />
  </Svg>
</LayerCake>
```

**Usage**:
```svelte
<RadarChart skills={studentRadar.skills} label="John Doe" size="md" />
```

---

### `ProgressChart.svelte` — Weekly Progress Line Chart

**Purpose**: Display skill progress over weeks.

**Props**:
```typescript
interface Props {
  progress: ProgressData;
}

interface ProgressData {
  weeks: ProgressWeek[];
}

interface ProgressWeek {
  period: string;  // e.g., "Week 1", "2024-03-01"
  skills: RadarSkills;
}
```

**Features**:
- 5 skill lines (one per skill)
- X-axis: weeks/periods
- Y-axis: 0-100 scale
- Grid lines for readability
- Legend with color coding
- Uses D3 scales + d3-shape

**Code Highlights**:
```typescript
const xScale = scalePoint<string>()
  .domain(periods)
  .range([0, innerW])
  .padding(0.1);

const yScale = scaleLinear()
  .domain([0, 100])
  .range([innerH, 0]);

const lines = skillKeys.map((key) => {
  const pathGen = line<{ x: number; y: number }>()
    .x((d) => d.x)
    .y((d) => d.y)
    .curve(curveMonotoneX);
  
  const points = progress.weeks.map((w) => ({
    x: xScale(w.period) ?? 0,
    y: yScale(w.skills[key] ?? 0)
  }));
  
  return { key, label, color, d: pathGen(points), points };
});
```

**Usage**:
```svelte
<ProgressChart progress={studentProgress} />
```

---

### `_radar/AxisRadial.svelte` — Radial Axis

**Purpose**: Render radial axis for radar chart.

**Props**:
```typescript
interface Props {
  colors: string[];
  labels: string[];
}
```

**Renders**:
- Radial grid lines
- Axis labels (Reading, Math, Writing, Logic, Social)
- Color-coded labels

---

### `_radar/RadarArea.svelte` — Filled Area

**Purpose**: Render filled area for radar chart.

**Features**:
- Filled polygon for each data point
- Semi-transparent fill
- Smooth curves

---

## Feed Components

### `FeedCard.svelte` — Feed Post Display

**Purpose**: Display a feed post with media, comments, likes.

**Props**:
```typescript
interface Props {
  post: FeedPost;
  onlike?: (postId: string) => void;
  oncomment?: (postId: string, body: string) => void;
  ondelete?: (postId: string) => void;
}
```

**Features**:
- Post body (text)
- Media gallery (images, videos)
- Tagged students list
- Like button + count
- Comments section
- Delete button (if owner)
- Timestamp

**Code Highlights**:
```typescript
let { post }: Props = $props();

const isOwner = post.teacher.id === user.id;
const liked = post.likedByMe;

async function toggleLike() {
  await fetch('/api/graphql', {
    method: 'POST',
    body: JSON.stringify({
      query: `mutation LikePost($id: ID!) { likePost(id: $id) { ... } }`,
      variables: { id: post.id }
    })
  });
  onlike?.(post.id);
}
```

---

### `CommentSection.svelte` — Comments Display + Form

**Purpose**: Display comments and allow adding new comments.

**Props**:
```typescript
interface Props {
  postId: string;
  comments: FeedPostComment[];
  oncomment?: (body: string) => void;
}
```

**Features**:
- List of comments
- Comment author, body, timestamp
- Add comment form
- Delete comment (if owner)

---

### `FilePicker.svelte` — File Upload UI

**Purpose**: Allow users to select and upload files.

**Props**:
```typescript
interface Props {
  accept?: string;
  multiple?: boolean;
  onchange?: (files: File[]) => void;
}
```

**Features**:
- Drag-and-drop support
- File input with accept filter
- File preview
- Upload progress

---

### `MediaGallery.svelte` — Media Display

**Purpose**: Display media attachments (images, videos).

**Props**:
```typescript
interface Props {
  attachments: MediaAttachment[];
}

interface MediaAttachment {
  url: string;
  filename: string;
  contentType: string;
}
```

**Features**:
- Grid layout for images
- Lightbox/modal for full view
- Video player for videos
- Fallback for unsupported types

---

## Component Composition Example

### Building a Student Card

```svelte
<script>
  import { Card, Badge } from '$lib/components/ui';
  import { RadarChart } from '$lib/components/charts';
  
  let { student, radar } = $props();
</script>

<Card hover>
  <div class="flex justify-between items-start">
    <div>
      <h3 class="text-lg font-semibold">{student.name}</h3>
      <Badge variant="success">Active</Badge>
    </div>
    <RadarChart skills={radar.skills} size="sm" />
  </div>
</Card>
```

---

## Best Practices

### ✅ Do
- Use TypeScript for prop types
- Keep components focused and single-responsibility
- Use Svelte 5 reactivity (`$state`, `$derived`)
- Accept `Snippet` for flexible content
- Provide sensible defaults for optional props
- Document props with JSDoc comments

### ❌ Don't
- Mix business logic with UI
- Hardcode colors/sizes (use constants)
- Create deeply nested component hierarchies
- Pass too many props (consider composition)
- Ignore accessibility (ARIA labels, keyboard nav)

---

## Testing

### Unit Tests
```typescript
import { render } from '@testing-library/svelte';
import Button from './Button.svelte';

describe('Button', () => {
  it('should render with label', () => {
    const { getByText } = render(Button, { props: { children: 'Click' } });
    expect(getByText('Click')).toBeInTheDocument();
  });

  it('should call onclick handler', async () => {
    const onclick = vi.fn();
    const { getByRole } = render(Button, { props: { onclick } });
    await userEvent.click(getByRole('button'));
    expect(onclick).toHaveBeenCalled();
  });
});
```

### Visual Tests
```typescript
import { test, expect } from '@playwright/test';

test('RadarChart renders correctly', async ({ page }) => {
  await page.goto('/test/radar-chart');
  const chart = page.locator('[data-testid="radar-chart"]');
  await expect(chart).toBeVisible();
  await expect(chart).toHaveScreenshot();
});
```

---

**Last Updated**: March 15, 2026
