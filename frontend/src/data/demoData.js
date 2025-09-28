// Demo data for frontend testing
export const demoCompanies = [
  {
    _id: '507f1f77bcf86cd799439011',
    name: 'TechCorp Solutions',
    code: 'TECH001',
    address: '123 Tech Street, Silicon Valley, CA 94000',
    phone: '+1-555-0123',
    email: 'info@techcorp.com',
    website: 'https://techcorp.com',
    industry: 'Technology',
    description: 'Leading technology solutions provider specializing in software development and IT consulting.',
    timezone: 'America/Los_Angeles',
    primaryColor: '#3B82F6',
    secondaryColor: '#1E40AF',
    accentColor: '#F59E0B',
    backgroundColor: '#F8FAFC',
    textColor: '#1F2937',
    fontFamily: 'Inter',
    logo: null,
    logoUrl: null,
    theme: {
      mode: 'light',
      borderRadius: '8px',
      shadow: 'sm',
      spacing: 'comfortable'
    },
    settings: {
      allowEmployeeRegistration: true,
      requireLocationForAttendance: false,
      allowMultipleShifts: true,
      autoStepOutHours: 8,
      workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      workingHours: {
        start: '09:00',
        end: '18:00'
      }
    }
  },
  {
    _id: '507f1f77bcf86cd799439012',
    name: 'GreenEarth Industries',
    code: 'GREEN002',
    address: '456 Eco Avenue, Portland, OR 97201',
    phone: '+1-555-0456',
    email: 'contact@greenearth.com',
    website: 'https://greenearth.com',
    industry: 'Environmental',
    description: 'Sustainable environmental solutions and green technology innovations.',
    timezone: 'America/Los_Angeles',
    primaryColor: '#10B981',
    secondaryColor: '#059669',
    accentColor: '#F59E0B',
    backgroundColor: '#F0FDF4',
    textColor: '#064E3B',
    fontFamily: 'Inter',
    logo: null,
    logoUrl: null,
    theme: {
      mode: 'light',
      borderRadius: '12px',
      shadow: 'md',
      spacing: 'comfortable'
    },
    settings: {
      allowEmployeeRegistration: false,
      requireLocationForAttendance: true,
      allowMultipleShifts: true,
      autoStepOutHours: 8,
      workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      workingHours: {
        start: '08:00',
        end: '17:00'
      }
    }
  },
  {
    _id: '507f1f77bcf86cd799439013',
    name: 'Creative Design Studio',
    code: 'CREATIVE003',
    address: '789 Art District, New York, NY 10001',
    phone: '+1-555-0789',
    email: 'hello@creativestudio.com',
    website: 'https://creativestudio.com',
    industry: 'Design',
    description: 'Full-service creative design agency specializing in branding, web design, and digital marketing.',
    timezone: 'America/New_York',
    primaryColor: '#8B5CF6',
    secondaryColor: '#7C3AED',
    accentColor: '#F59E0B',
    backgroundColor: '#FAF5FF',
    textColor: '#581C87',
    fontFamily: 'Inter',
    logo: null,
    logoUrl: null,
    theme: {
      mode: 'light',
      borderRadius: '16px',
      shadow: 'lg',
      spacing: 'spacious'
    },
    settings: {
      allowEmployeeRegistration: true,
      requireLocationForAttendance: false,
      allowMultipleShifts: true,
      autoStepOutHours: 8,
      workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      workingHours: {
        start: '10:00',
        end: '19:00'
      }
    }
  }
];

export const demoAdmins = [
  {
    _id: '507f1f77bcf86cd799439021',
    name: 'John Smith',
    email: 'john.smith@techcorp.com',
    role: 'admin',
    companyId: '507f1f77bcf86cd799439011',
    active: true,
    company: demoCompanies[0]
  },
  {
    _id: '507f1f77bcf86cd799439022',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@greenearth.com',
    role: 'admin',
    companyId: '507f1f77bcf86cd799439012',
    active: true,
    company: demoCompanies[1]
  },
  {
    _id: '507f1f77bcf86cd799439023',
    name: 'Mike Chen',
    email: 'mike.chen@creativestudio.com',
    role: 'admin',
    companyId: '507f1f77bcf86cd799439013',
    active: true,
    company: demoCompanies[2]
  }
];

export const demoEmployees = [
  {
    _id: '507f1f77bcf86cd799439031',
    name: 'Alice Johnson',
    email: 'alice.johnson@techcorp.com',
    role: 'employee',
    companyId: '507f1f77bcf86cd799439011',
    managerId: '507f1f77bcf86cd799439041',
    active: true,
    isWorking: false
  },
  {
    _id: '507f1f77bcf86cd799439032',
    name: 'Bob Wilson',
    email: 'bob.wilson@techcorp.com',
    role: 'employee',
    companyId: '507f1f77bcf86cd799439011',
    managerId: '507f1f77bcf86cd799439041',
    active: true,
    isWorking: true
  },
  {
    _id: '507f1f77bcf86cd799439033',
    name: 'Carol Davis',
    email: 'carol.davis@greenearth.com',
    role: 'employee',
    companyId: '507f1f77bcf86cd799439012',
    managerId: '507f1f77bcf86cd799439042',
    active: true,
    isWorking: false
  }
];

export const demoManagers = [
  {
    _id: '507f1f77bcf86cd799439041',
    name: 'David Brown',
    email: 'david.brown@techcorp.com',
    role: 'manager',
    companyId: '507f1f77bcf86cd799439011',
    active: true
  },
  {
    _id: '507f1f77bcf86cd799439042',
    name: 'Emma Green',
    email: 'emma.green@greenearth.com',
    role: 'manager',
    companyId: '507f1f77bcf86cd799439012',
    active: true
  }
];

export const demoAttendance = [
  {
    _id: '507f1f77bcf86cd799439051',
    employeeId: '507f1f77bcf86cd799439031',
    managerId: '507f1f77bcf86cd799439041',
    stepIn: new Date('2024-01-15T09:00:00Z'),
    stepOut: new Date('2024-01-15T17:00:00Z'),
    latitude: 37.7749,
    longitude: -122.4194,
    address: '123 Tech Street, Silicon Valley, CA',
    status: 'present',
    shift: 'morning',
    totalTime: 480
  },
  {
    _id: '507f1f77bcf86cd799439052',
    employeeId: '507f1f77bcf86cd799439032',
    managerId: '507f1f77bcf86cd799439041',
    stepIn: new Date('2024-01-15T08:30:00Z'),
    stepOut: null,
    latitude: 37.7749,
    longitude: -122.4194,
    address: '123 Tech Street, Silicon Valley, CA',
    status: 'present',
    shift: 'morning',
    totalTime: null
  }
];

// Demo login credentials
export const demoCredentials = [
  {
    companyCode: 'TECH001',
    email: 'john.smith@techcorp.com',
    password: 'admin123',
    company: demoCompanies[0]
  },
  {
    companyCode: 'GREEN002',
    email: 'sarah.johnson@greenearth.com',
    password: 'admin123',
    company: demoCompanies[1]
  },
  {
    companyCode: 'CREATIVE003',
    email: 'mike.chen@creativestudio.com',
    password: 'admin123',
    company: demoCompanies[2]
  }
];

// Demo dashboard data
export const demoDashboardData = {
  totalEmployees: 156,
  presentToday: 142,
  absentToday: 14,
  lateToday: 8,
  totalAttendance: 91,
  recentActivity: [
    {
      id: 1,
      type: 'step_in',
      employeeName: 'Alice Johnson',
      time: new Date('2024-01-15T09:00:00Z'),
      location: 'Main Office'
    },
    {
      id: 2,
      type: 'step_out',
      employeeName: 'Bob Wilson',
      time: new Date('2024-01-15T17:30:00Z'),
      location: 'Main Office'
    },
    {
      id: 3,
      type: 'late',
      employeeName: 'Carol Davis',
      time: new Date('2024-01-15T09:15:00Z'),
      location: 'Branch Office'
    }
  ]
};

export default {
  companies: demoCompanies,
  admins: demoAdmins,
  employees: demoEmployees,
  managers: demoManagers,
  attendance: demoAttendance,
  credentials: demoCredentials,
  dashboard: demoDashboardData
};
