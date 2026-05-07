
# IdolBooth - UI Design Guidelines

## Design Philosophy

IdolBooth's design emphasizes simplicity, clarity, and a light-hearted, fun atmosphere appropriate for a photo booth application. The interface prioritizes intuitive navigation and focuses on showcasing the user's photos.

## Color Palette

### Primary Colors

- **Gold/Yellow Accent**: `#F6AD37` (idol-gold)
- **Black**: `#000000`
- **White**: `#FFFFFF`

### Secondary Colors

- **Light Gray**: `#F9F9F9` (background)
- **Medium Gray**: `#E5E5E5` (borders, dividers)
- **Dark Gray**: `#333333` (text)

### Accent Colors

- Various vibrant options for photo strip backgrounds
- Success: `#22C55E`
- Error: `#EF4444`

## Typography

### Font Families

- **Montserrat**: Used for headings and emphasis
- **System Fonts**: Used for body text
- **Monospace**: Used for timestamps and technical information

### Font Sizes

- **Headings**:
  - H1: 2rem (32px) - 2.5rem (40px)
  - H2: 1.5rem (24px) - 1.75rem (28px)
  - H3: 1.25rem (20px)

- **Body**:
  - Regular: 1rem (16px)
  - Small: 0.875rem (14px)
  - Extra Small: 0.75rem (12px)

## Component Styles

### Buttons

- **Primary Button** (idol-button):
  - Gold background
  - Black text
  - Subtle hover effect
  - Rounded corners

- **Secondary Button** (idol-button-outline):
  - Transparent background
  - Bordered
  - Black text
  - Subtle hover effect

### Cards and Panels

- **Glass Panel**:
  - Slight transparency
  - Subtle shadow
  - Rounded corners
  - Light border

- **Photo Frames**:
  - White border
  - Drop shadow
  - Optional hover effects

### Form Controls

- **Input Fields**:
  - Clear borders
  - Ample padding
  - Focus states

- **Checkboxes/Toggles**:
  - Custom styling aligned with brand
  - Clear active states

## Layout Guidelines

### Spacing

- **Base Unit**: 4px
- **Spacing Scale**: 4px, 8px, 16px, 24px, 32px, 48px, 64px

### Containers

- **Max Width**: 1200px for main content
- **Content Width**: 
  - Small: 640px
  - Medium: 768px
  - Large: 1024px
  - Extra Large: 1280px

### Responsive Breakpoints

- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

## Animation and Transitions

- **Duration**: 150ms - 300ms
- **Easing**: Ease-in-out for most transitions
- **Usage**: 
  - Button hover/active states
  - Modal open/close
  - View transitions

## Accessibility Guidelines

- **Color Contrast**: Minimum 4.5:1 ratio for normal text, 3:1 for large text
- **Focus States**: Clearly visible focus indicators
- **Text Sizes**: Minimum 16px for body text
- **Interactive Elements**: Minimum 44px × 44px touch target size
