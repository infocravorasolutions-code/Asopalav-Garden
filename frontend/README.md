# Employee Management System

A comprehensive React.js-based employee management system with role-based access control, attendance tracking with camera functionality, and report generation capabilities.

## Features

### 🔐 Authentication & Authorization

- Role-based access control (Admin, Manager, Employee)
- Secure login/logout functionality
- Protected routes based on user roles

### 👥 User Management
- **Admin**: Create and manage managers and employees
- **Manager**: Create and manage their team employees
- **Super Admin**: Full system access
- **Read-only Admin**: View-only access

### 📸 Attendance Management
- Camera-based attendance capture
- Mobile-responsive webcam integration
- GPS location tracking
- Clock-in/Clock-out functionality
- Image storage and verification

### 📊 Reports & Analytics
- Comprehensive reporting system
- Export reports in CSV and PDF formats
- Attendance reports
- Employee performance reports
- Manager team reports

### 📱 Mobile Responsive
- Optimized for mobile webview
- Touch-friendly interface
- Responsive design for all screen sizes
- Mobile camera integration

## Technology Stack

- **Frontend**: React.js 18
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **HTTP Client**: Axios
- **Routing**: React Router DOM
- **Forms**: React Hook Form
- **Notifications**: React Hot Toast
- **Camera**: React Webcam
- **PDF Generation**: jsPDF with AutoTable
- **CSV Export**: PapaParse
- **Date Handling**: date-fns

## Project Structure

```
src/
├── components/
│   ├── admin/           # Admin-specific components
│   ├── auth/            # Authentication components
│   ├── layout/          # Layout and navigation
│   ├── manager/         # Manager-specific components
│   └── attendance/      # Attendance capture components
├── contexts/            # React contexts
├── services/            # API services
├── utils/               # Utility functions
└── index.css           # Global styles
```

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd employee-management-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   Create a `.env` file in the root directory:
   ```env
   REACT_APP_API_URL=http://localhost:3001/api
   ```

4. **Start the development server**
   ```bash
   npm start
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

## Demo Credentials

### Super Admin
- Email: `admin@company.com`
- Password: `admin123`

### Read-only Admin
- Email: `readonly@company.com`
- Password: `readonly123`

### Manager
- Email: `manager@company.com`
- Password: `manager123`

## API Integration

The application is designed to work with a backend API. Update the API endpoints in `src/services/api.js` to match your backend:

```javascript
export const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});
```

## Key Features Implementation

### Camera Integration
The attendance capture component uses `react-webcam` for mobile-compatible camera access:

```javascript
import Webcam from 'react-webcam';

const videoConstraints = {
  width: { ideal: 1280 },
  height: { ideal: 720 },
  facingMode: 'user', // or 'environment' for back camera
};
```

### Report Export
Export functionality supports both CSV and PDF formats:

```javascript
import { exportToCSV, exportToPDF } from '../utils/exportUtils';

// Export as CSV
exportToCSV(data, 'attendance_report');

// Export as PDF
exportToPDF(data, 'attendance_report', 'Attendance Report');
```

### Mobile Optimization
The application is optimized for mobile webview with:
- Responsive design using Tailwind CSS
- Touch-friendly interface
- Mobile-specific camera controls
- Optimized navigation for small screens

## Building for Production

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Serve the build**
   ```bash
   npx serve -s build
   ```

## Deployment

### For Mobile Webview
1. Build the application: `npm run build`
2. Host the `build` folder on a web server
3. Configure your mobile app to load the hosted URL in a WebView

### For Web Deployment
1. Build the application: `npm run build`
2. Deploy the `build` folder to your hosting provider (Netlify, Vercel, etc.)

## Customization

### Styling
The application uses Tailwind CSS for styling. Customize the design by modifying:
- `tailwind.config.js` for theme configuration
- `src/index.css` for custom styles
- Component-specific classes

### Adding New Features
1. Create new components in the appropriate directory
2. Add routes in the main App component
3. Update the sidebar navigation
4. Implement API integration in `src/services/api.js`

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge
- Mobile browsers (iOS Safari, Chrome Mobile)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please contact the development team or create an issue in the repository.

---

**Note**: This is a frontend application. You'll need to implement or integrate with a backend API to handle data persistence, authentication, and business logic.
