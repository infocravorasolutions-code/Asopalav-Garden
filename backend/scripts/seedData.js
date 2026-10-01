import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import Company from '../models/company.models.js';
import User from '../models/employee.models.js';
import dotenv from 'dotenv';

dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/attendence-management');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Sample companies data - Garden Theme
const sampleCompanies = [
  {
    name: 'Green Valley Gardens',
    code: 'GARDEN001',
    address: '123 Garden Lane, Green Valley, CA 94000',
    phone: '+1-555-0123',
    email: 'info@greenvalleygardens.com',
    website: 'https://greenvalleygardens.com',
    industry: 'Landscaping & Gardening',
    description: 'Professional landscaping and garden maintenance services for residential and commercial properties.',
    timezone: 'America/Los_Angeles',
    primaryColor: '#22C55E',
    secondaryColor: '#16A34A',
    accentColor: '#F59E0B',
    backgroundColor: '#F0FDF4',
    textColor: '#14532D',
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
      allowEmployeeRegistration: true,
      requireLocationForAttendance: true,
      allowMultipleShifts: true,
      autoStepOutHours: 8,
      workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
      workingHours: {
        start: '07:00',
        end: '17:00'
      }
    }
  },
  {
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
  },
  {
    name: 'Healthcare Plus',
    code: 'HEALTH004',
    address: '321 Medical Center, Boston, MA 02101',
    phone: '+1-555-0321',
    email: 'info@healthcareplus.com',
    website: 'https://healthcareplus.com',
    industry: 'Healthcare',
    description: 'Comprehensive healthcare services and medical technology solutions.',
    timezone: 'America/New_York',
    primaryColor: '#EF4444',
    secondaryColor: '#DC2626',
    accentColor: '#F59E0B',
    backgroundColor: '#FEF2F2',
    textColor: '#991B1B',
    fontFamily: 'Inter',
    logo: null,
    logoUrl: null,
    theme: {
      mode: 'light',
      borderRadius: '6px',
      shadow: 'sm',
      spacing: 'compact'
    },
    settings: {
      allowEmployeeRegistration: false,
      requireLocationForAttendance: true,
      allowMultipleShifts: true,
      autoStepOutHours: 12,
      workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      workingHours: {
        start: '06:00',
        end: '22:00'
      }
    }
  },
  {
    name: 'Finance First',
    code: 'FINANCE005',
    address: '654 Wall Street, New York, NY 10005',
    phone: '+1-555-0654',
    email: 'contact@financefirst.com',
    website: 'https://financefirst.com',
    industry: 'Finance',
    description: 'Professional financial services and investment management solutions.',
    timezone: 'America/New_York',
    primaryColor: '#1F2937',
    secondaryColor: '#111827',
    accentColor: '#F59E0B',
    backgroundColor: '#F9FAFB',
    textColor: '#1F2937',
    fontFamily: 'Inter',
    logo: null,
    logoUrl: null,
    theme: {
      mode: 'light',
      borderRadius: '4px',
      shadow: 'sm',
      spacing: 'compact'
    },
    settings: {
      allowEmployeeRegistration: false,
      requireLocationForAttendance: false,
      allowMultipleShifts: false,
      autoStepOutHours: 8,
      workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      workingHours: {
        start: '09:00',
        end: '17:00'
      }
    }
  }
];

// Sample admin users data - Garden Theme
const sampleAdmins = [
  {
    name: 'Garden Master Admin',
    email: 'admin@greenvalleygardens.com',
    password: 'admin123',
    role: 'admin',
    companyCode: 'GARDEN001'
  },
  {
    name: 'Mahakali Manager',
    email: 'manager@greenvalleygardens.com',
    password: 'admin123',
    role: 'manager',
    companyCode: 'GARDEN001'
  },
  {
    name: 'Garden Supervisor',
    email: 'supervisor@greenvalleygardens.com',
    password: 'admin123',
    role: 'manager',
    companyCode: 'GARDEN001'
  }
];

// Seed companies
const seedCompanies = async () => {
  try {
    console.log('🌱 Seeding companies...');
    
    for (const companyData of sampleCompanies) {
      const existingCompany = await Company.findOne({ code: companyData.code });
      
      if (!existingCompany) {
        const company = new Company(companyData);
        await company.save();
        console.log(`✅ Created company: ${company.name} (${company.code})`);
      } else {
        console.log(`⚠️ Company already exists: ${existingCompany.name} (${existingCompany.code})`);
      }
    }
    
    console.log('✅ Companies seeding completed');
  } catch (error) {
    console.error('❌ Error seeding companies:', error);
  }
};

// Seed admin users
const seedAdmins = async () => {
  try {
    console.log('🌱 Seeding admin users...');
    
    for (const adminData of sampleAdmins) {
      // Find the company
      const company = await Company.findOne({ code: adminData.companyCode });
      
      if (!company) {
        console.log(`⚠️ Company not found for admin: ${adminData.name}`);
        continue;
      }
      
      // Check if admin already exists
      const existingAdmin = await User.findOne({ 
        email: adminData.email,
        companyId: company._id 
      });
      
      if (!existingAdmin) {
        // Hash password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(adminData.password, saltRounds);
        
        const admin = new User({
          name: adminData.name,
          email: adminData.email,
          passwordHash: hashedPassword,
          role: adminData.role,
          companyId: company._id,
          active: true
        });
        
        await admin.save();
        console.log(`✅ Created admin: ${admin.name} (${admin.email}) for ${company.name}`);
      } else {
        console.log(`⚠️ Admin already exists: ${existingAdmin.name} (${existingAdmin.email})`);
      }
    }
    
    console.log('✅ Admin users seeding completed');
  } catch (error) {
    console.error('❌ Error seeding admin users:', error);
  }
};

// Main seeding function
const seedDatabase = async () => {
  try {
    await connectDB();
    
    console.log('🚀 Starting database seeding...');
    
    // Seed companies first
    await seedCompanies();
    
    // Seed admin users
    await seedAdmins();
    
    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📋 Sample Data Summary:');
    console.log('Companies: 5');
    console.log('Admin Users: 5');
    console.log('\n🔑 Login Credentials:');
    console.log('Email: john.smith@techcorp.com | Password: admin123');
    console.log('Email: sarah.johnson@greenearth.com | Password: admin123');
    console.log('Email: mike.chen@creativestudio.com | Password: admin123');
    console.log('Email: emily.davis@healthcareplus.com | Password: admin123');
    console.log('Email: robert.wilson@financefirst.com | Password: admin123');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

// Run seeding if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase();
}

export { seedDatabase, sampleCompanies, sampleAdmins };
