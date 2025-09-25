# Custom Notification System

This replaces `react-hot-toast` with a custom, mobile-friendly notification system.

## Features

- ✅ **Mobile-optimized** design
- ✅ **Stacked notifications** (up to 3 at once)
- ✅ **Smooth animations** with enter/exit transitions
- ✅ **Multiple types**: success, error, warning, info
- ✅ **Customizable duration** and position
- ✅ **Manual dismiss** with close button
- ✅ **Auto-dismiss** after specified duration
- ✅ **Beautiful design** with icons and colors

## Usage

### 1. In Components

```jsx
import { useNotification } from '../../contexts/NotificationContext';

const MyComponent = () => {
  const { success, error, warning, info } = useNotification();

  const handleSuccess = () => {
    success('Operation completed successfully!');
  };

  const handleError = () => {
    error('Something went wrong!');
  };

  const handleWarning = () => {
    warning('Please check your input!');
  };

  const handleInfo = () => {
    info('Here is some information!');
  };

  return (
    <div>
      <button onClick={handleSuccess}>Success</button>
      <button onClick={handleError}>Error</button>
      <button onClick={handleWarning}>Warning</button>
      <button onClick={handleInfo}>Info</button>
    </div>
  );
};
```

### 2. In Contexts/API Calls

```jsx
// Replace toast.success with success
success('Manager created successfully');

// Replace toast.error with error
error('Failed to load managers');

// Replace toast.warning with warning
warning('Please check your input');

// Replace toast.info with info
info('Operation in progress...');
```

## API Reference

### useNotification Hook

```jsx
const { 
  success, 
  error, 
  warning, 
  info, 
  addNotification, 
  removeNotification, 
  clearAll 
} = useNotification();
```

### Methods

#### success(message, duration?)
- Shows a green success notification
- `message`: The notification text
- `duration`: Optional duration in milliseconds (default: 4000ms)

#### error(message, duration?)
- Shows a red error notification
- `message`: The notification text
- `duration`: Optional duration in milliseconds (default: 4000ms)

#### warning(message, duration?)
- Shows a yellow warning notification
- `message`: The notification text
- `duration`: Optional duration in milliseconds (default: 4000ms)

#### info(message, duration?)
- Shows a blue info notification
- `message`: The notification text
- `duration`: Optional duration in milliseconds (default: 4000ms)

#### addNotification({ type, message, duration })
- Advanced method for custom notifications
- `type`: 'success' | 'error' | 'warning' | 'info'
- `message`: The notification text
- `duration`: Duration in milliseconds (0 = no auto-dismiss)

#### removeNotification(id)
- Manually remove a specific notification
- `id`: The notification ID returned by addNotification

#### clearAll()
- Remove all active notifications

## Migration from Hot Toast

### Before (Hot Toast)
```jsx
import toast from 'react-hot-toast';

// Success
toast.success('Manager created successfully');

// Error
toast.error('Failed to load managers');

// Custom
toast('Custom message', {
  duration: 5000,
  icon: '🔥',
});
```

### After (Custom Notifications)
```jsx
import { useNotification } from '../../contexts/NotificationContext';

const { success, error, addNotification } = useNotification();

// Success
success('Manager created successfully');

// Error
error('Failed to load managers');

// Custom
addNotification({
  type: 'info',
  message: 'Custom message',
  duration: 5000
});
```

## Styling

The notifications use Tailwind CSS classes and are fully responsive:

- **Success**: Green background with checkmark icon
- **Error**: Red background with X icon
- **Warning**: Yellow background with alert icon
- **Info**: Blue background with info icon

## Mobile Optimization

- **Touch-friendly** close buttons
- **Proper spacing** for mobile screens
- **Readable text** sizes
- **Smooth animations** that work on mobile
- **Stacked layout** that doesn't overwhelm the screen

## Configuration

You can customize the notification system by modifying the `NotificationManager` component:

- **Position**: Change `position` prop (top-right, top-left, bottom-right, etc.)
- **Max notifications**: Change `maxNotifications` prop
- **Styling**: Modify the CSS classes in the component
- **Duration**: Set default duration in the context

## Examples

### Basic Usage
```jsx
const { success, error } = useNotification();

// Simple notifications
success('Data saved successfully!');
error('Network connection failed');
```

### With Custom Duration
```jsx
const { success, error } = useNotification();

// Show for 10 seconds
success('Long operation completed!', 10000);

// Show for 2 seconds
error('Quick error message', 2000);
```

### Advanced Usage
```jsx
const { addNotification } = useNotification();

// Custom notification
const notificationId = addNotification({
  type: 'info',
  message: 'Processing your request...',
  duration: 0 // No auto-dismiss
});

// Remove manually
removeNotification(notificationId);
```
