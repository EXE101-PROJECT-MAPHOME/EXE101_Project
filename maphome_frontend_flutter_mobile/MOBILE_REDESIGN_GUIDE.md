# MapHome Mobile UI Redesign Guide

## Overview
The MapHome mobile Flutter app has been completely redesigned to match the modern web interface design. This guide documents all changes, new design systems, and best practices for maintaining consistency.

## Design System Updates

### 1. Color Palette - Updated to Web Green Theme
**Primary Colors:**
- Primary Green: `#22C55E` (bright, energetic green)
- Primary Dark: `#16A34A` (darker shade for interactions)
- Primary Light: `#DCFCE7` (light background)

**Old vs New:**
- ❌ Old: Emerald 950 (`#022C22`) + Emerald 600 (`#059669`)
- ✅ New: Bright Green (`#22C55E`) matching web version

**Location:** `lib/constants/app_colors.dart`

### 2. Theme Configuration
**Light Theme:**
- Background: White (`#FFFFFF`)
- Card: White with 1px border
- Text: Dark foreground (`#022C22`)
- Input: Gray background (`#F9FAFB`)

**Dark Theme:**
- Background: Dark gray (`#111827`)
- Card: Darker gray (`#1F2937`)
- Text: Light gray (`#F3F4F6`)
- Input: Medium gray (`#374151`)

**Location:** `lib/main.dart`

### 3. New Components

#### FilledButton (Primary Actions)
```dart
FilledButton(
  onPressed: () {},
  style: FilledButton.styleFrom(
    backgroundColor: AppColors.primary,
    foregroundColor: Colors.white,
  ),
  child: const Text('Action'),
)
```

#### OutlinedButton (Secondary Actions)
```dart
OutlinedButton(
  onPressed: () {},
  style: OutlinedButton.styleFrom(
    foregroundColor: AppColors.primary,
    side: const BorderSide(color: AppColors.border),
  ),
  child: const Text('Action'),
)
```

#### Input Decoration
```dart
InputDecoration(
  hintText: 'Placeholder',
  filled: true,
  fillColor: AppColors.inputBackground,
  border: OutlineInputBorder(
    borderRadius: BorderRadius.circular(12),
    borderSide: const BorderSide(color: AppColors.border),
  ),
  focusedBorder: OutlineInputBorder(
    borderRadius: BorderRadius.circular(12),
    borderSide: const BorderSide(color: AppColors.primary, width: 2),
  ),
)
```

### 4. Design Tokens
**New file:** `lib/constants/design_tokens.dart`

Includes standardized:
- Spacing values (2, 4, 8, 12, 16, 20, 24, 32px)
- Border radius (8, 12, 16, 20, 24px)
- Font sizes (12-32px)
- Shadow definitions (small, medium, large)
- Gradient presets
- Reusable decoration builders

## Screen Updates

### ✅ Home Screen (`lib/views/home/home_screen.dart`)
**Changes:**
- Modern AppBar with gradient logo
- Improved hero section with gradient background
- Better search bar with gradient filter button
- Enhanced property card spacing and layout
- Section headers with visual left border
- Better visual hierarchy and spacing
- More informative section descriptions

**Key improvements:**
- Gradient logo in app bar
- Better section organization with left border accent
- Improved search & filter styling
- Better spacing between elements

### ✅ Navigation (`lib/views/navigation_wrapper.dart`)
**Changes:**
- Better bottom navigation styling
- Added top border for separation
- Improved shadow and spacing
- Better icon sizing
- Font weight adjustments

### ✅ Login Screen (`lib/views/auth/login_screen.dart`)
**Changes:**
- Gradient logo container at top
- Better typography hierarchy (black font weight)
- Improved form field styling with proper borders
- Focused state shows primary color border
- Modern divider with "hoặc" text
- Better button styling with gradient effect
- Letter spacing for better readability

### ✅ Register Screen (`lib/views/auth/register_screen.dart`)
**Changes:**
- Same modern design as login screen
- Consistent styling across all form fields
- Better role dropdown with border styling
- Improved visual hierarchy
- Matching button and divider styles

### ✅ Map Screen (`lib/views/map/map_screen.dart`)
**Changes:**
- Better search bar with border styling
- Improved shadow and spacing
- Better property preview card styling
- Improved close button appearance

## Design Patterns

### Buttons
```dart
// Primary (Filled)
FilledButton(
  onPressed: () {},
  style: FilledButton.styleFrom(
    padding: const EdgeInsets.symmetric(vertical: 14),
    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
  ),
  child: const Text('Primary Action'),
)

// Secondary (Outlined)
OutlinedButton(
  onPressed: () {},
  style: OutlinedButton.styleFrom(
    padding: const EdgeInsets.symmetric(vertical: 12),
    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
  ),
  child: const Text('Secondary Action'),
)
```

### Cards
```dart
Container(
  decoration: BoxDecoration(
    color: isDark ? AppColors.darkCard : AppColors.card,
    borderRadius: BorderRadius.circular(12),
    border: Border.all(color: AppColors.border),
    boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.1))],
  ),
  child: YourContent(),
)
```

### Section Headers
```dart
Row(
  children: [
    Container(
      width: 4,
      height: 24,
      decoration: BoxDecoration(
        color: AppColors.primary,
        borderRadius: BorderRadius.circular(2),
      ),
    ),
    const SizedBox(width: 10),
    Text(
      'Section Title',
      style: TextStyle(
        fontSize: 17,
        fontWeight: FontWeight.bold,
        color: isDark ? AppColors.darkForeground : AppColors.foreground,
      ),
    ),
  ],
)
```

### Search Input
```dart
Container(
  decoration: BoxDecoration(
    color: isDark ? AppColors.darkSecondary : AppColors.inputBackground,
    borderRadius: BorderRadius.circular(12),
    border: Border.all(color: AppColors.border),
  ),
  child: TextField(
    decoration: InputDecoration(
      hintText: 'Search...',
      border: InputBorder.none,
      prefixIcon: Icon(Icons.search),
      contentPadding: const EdgeInsets.symmetric(vertical: 12),
    ),
  ),
)
```

## Typography

### Text Styles Used
- **Headlines:** Bold, letter-spacing: -0.5, fontSize: 28
- **Titles:** Semi-bold (w600), fontSize: 16-20
- **Body:** Regular, fontSize: 14-16
- **Labels:** Semi-bold, fontSize: 12-13
- **Hints:** Muted foreground, fontSize: 14

### Font Weights
- Regular: `FontWeight.w500`
- Semi-bold: `FontWeight.w600`
- Bold: `FontWeight.bold` or `FontWeight.w700`
- Black: `FontWeight.black` or `FontWeight.w900`

## Dark Mode Support

All screens properly support dark mode with:
- `isDark = Theme.of(context).brightness == Brightness.dark`
- Conditional color assignment for all elements
- Proper contrast in dark mode
- AppColors.dark* variants for dark theme

## How to Apply Design System to Other Screens

### 1. Update Colors
```dart
// Bad (old)
color: isDark ? AppColors.darkForeground : AppColors.primary,

// Good (new)
color: isDark ? AppColors.darkForeground : AppColors.foreground,
// Then use the color scheme for primary actions
```

### 2. Update Buttons
```dart
// Bad (old)
ElevatedButton(
  style: ElevatedButton.styleFrom(
    backgroundColor: AppColors.emerald900,
  ),
)

// Good (new)
FilledButton(
  style: FilledButton.styleFrom(
    backgroundColor: AppColors.primary, // Auto uses theme colors
  ),
)
```

### 3. Update Form Fields
```dart
// Bad (old)
TextField(
  decoration: InputDecoration(
    border: OutlineInputBorder(
      borderSide: BorderSide.none,
    ),
  ),
)

// Good (new)
TextField(
  decoration: InputDecoration(
    border: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: BorderSide(color: AppColors.border),
    ),
    focusedBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: const BorderSide(color: AppColors.primary, width: 2),
    ),
  ),
)
```

### 4. Update Containers
```dart
// Bad (old)
Container(
  decoration: BoxDecoration(
    borderRadius: BorderRadius.circular(10),
  ),
)

// Good (new)
Container(
  decoration: BoxDecoration(
    borderRadius: BorderRadius.circular(12),
    border: Border.all(color: AppColors.border),
    boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.1))],
  ),
)
```

## Spacing System
Always use these standard spacings:
- `SizedBox(height: 4)` - Tiny gaps
- `SizedBox(height: 8)` - Small gaps
- `SizedBox(height: 12)` - Medium gaps
- `SizedBox(height: 16)` - Standard gap
- `SizedBox(height: 20)` - Large gap
- `SizedBox(height: 24)` - Extra large gap
- `SizedBox(height: 32)` - XXL gap

## Border Radius System
Standard border radius values:
- `BorderRadius.circular(8)` - Small (buttons, small chips)
- `BorderRadius.circular(12)` - Medium (inputs, cards)
- `BorderRadius.circular(16)` - Large (property cards)
- `BorderRadius.circular(20)` - Extra large
- `BorderRadius.circular(24)` - XXL (hero cards)

## Next Steps
1. Apply same design system to Dashboard screens
2. Update Detail screens with improved styling
3. Ensure all dialogs use the modern design
4. Add subtle animations (fade-in, slide-up)
5. Test on various device sizes
6. Verify dark mode on all screens

## Files Modified
1. ✅ `lib/constants/app_colors.dart` - Color scheme update
2. ✅ `lib/constants/design_tokens.dart` - New design system
3. ✅ `lib/main.dart` - Theme configuration
4. ✅ `lib/views/navigation_wrapper.dart` - Bottom navigation
5. ✅ `lib/views/home/home_screen.dart` - Home screen redesign
6. ✅ `lib/views/auth/login_screen.dart` - Login redesign
7. ✅ `lib/views/auth/register_screen.dart` - Register redesign
8. ✅ `lib/views/map/map_screen.dart` - Map screen improvements

## Migration Checklist
- [ ] Test on light mode
- [ ] Test on dark mode
- [ ] Test on various screen sizes (small phones, tablets)
- [ ] Verify all buttons are accessible
- [ ] Check contrast ratios for accessibility
- [ ] Test form validation messages display correctly
- [ ] Verify navigation transitions are smooth
- [ ] Update remaining screens (Dashboard, Details, etc.)
