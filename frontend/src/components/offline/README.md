# Offline Components

This directory contains components for handling offline states in the Panther Secure System.

## Components

### 1. OfflinePage
Main offline page displayed when the user is completely offline and not authenticated.

**Usage:**
```jsx
import OfflinePage from './components/offline/OfflinePage';

// Automatically shows when user is offline and not authenticated
<OfflinePage />
```

**Features:**
- Network status indicators
- Troubleshooting tips
- Retry functionality
- Go to home button

### 2. FeatureOfflinePage
Feature-specific offline page for when users try to access specific features while offline.

**Usage:**
```jsx
import FeatureOfflinePage from './components/offline/FeatureOfflinePage';

<FeatureOfflinePage
  featureName="Employee Management"
  onRetry={fetchEmployees}
  showCachedData={employees.length > 0}
  lastSyncTime={localStorage.getItem('lastEmployeeSync')}
/>
```

**Props:**
- `featureName` (string): Name of the feature that's unavailable
- `onRetry` (function): Function to call when retry is clicked
- `onGoBack` (function): Function to call when go back is clicked
- `showCachedData` (boolean): Whether to show cached data notice
- `lastSyncTime` (string): Last sync timestamp

### 3. OfflineBanner
Banner component that appears at the top of pages when user goes offline.

**Usage:**
```jsx
import OfflineBanner from './components/offline/OfflineBanner';

<OfflineBanner 
  show={true}
  onRetry={handleRetry}
  dismissible={true}
/>
```

**Props:**
- `show` (boolean): Whether to show the banner
- `onRetry` (function): Custom retry function
- `dismissible` (boolean): Whether banner can be dismissed
- `className` (string): Additional CSS classes

### 4. OfflineIndicator
Small indicator component for showing offline status in headers/navigation.

**Usage:**
```jsx
import OfflineIndicator from './components/offline/OfflineIndicator';

<OfflineIndicator 
  showText={true}
  size="md"
  className="ml-2"
/>
```

**Props:**
- `showText` (boolean): Whether to show "Offline" text
- `size` (string): Size of indicator ("sm", "md", "lg")
- `className` (string): Additional CSS classes

## Hook

### useOffline
Custom hook for managing offline state throughout the app.

**Usage:**
```jsx
import { useOffline } from '../../hooks/useOffline';

const { isOffline, isOnline, lastOnline, offlineSince, getOfflineDuration, checkConnection } = useOffline();
```

**Returns:**
- `isOffline` (boolean): Whether user is currently offline
- `isOnline` (boolean): Whether user is currently online
- `lastOnline` (Date): When user was last online
- `offlineSince` (Date): When user went offline
- `getOfflineDuration()` (function): Returns offline duration
- `checkConnection()` (function): Tests connection by fetching a resource

## Integration Examples

### In a Component
```jsx
import React from 'react';
import { useOffline } from '../../hooks/useOffline';
import FeatureOfflinePage from '../offline/FeatureOfflinePage';

const MyComponent = () => {
  const { isOffline } = useOffline();
  
  if (isOffline) {
    return (
      <FeatureOfflinePage
        featureName="My Feature"
        onRetry={() => window.location.reload()}
      />
    );
  }
  
  return <div>Your component content</div>;
};
```

### In Layout/Header
```jsx
import OfflineIndicator from '../offline/OfflineIndicator';

const Header = () => {
  return (
    <header className="flex items-center justify-between">
      <h1>Panther Secure</h1>
      <OfflineIndicator showText={true} />
    </header>
  );
};
```

## Best Practices

1. **Use FeatureOfflinePage** for feature-specific offline states
2. **Use OfflinePage** for general app offline state
3. **Use OfflineBanner** for non-intrusive offline notifications
4. **Use OfflineIndicator** for subtle status indicators
5. **Always provide retry functionality**
6. **Show helpful troubleshooting tips**
7. **Consider showing cached data when available**

## Styling

All components use Tailwind CSS classes and are responsive. They follow the app's design system with:
- Consistent color scheme (red for offline, blue for actions)
- Proper spacing and typography
- Mobile-friendly layouts
- Smooth transitions and animations
