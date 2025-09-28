import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import Company from '../models/company.models.js';
import Admin from '../models/admin.models.js';

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI;

const companies = [
  {
    name: 'Neelkanth Landscape',
    code: 'NEELKANTH',
    address: '123 Garden Street, Mumbai, Maharashtra',
    timezone: 'Asia/Kolkata',
    phone: '+91-9876543210',
    email: 'info@neelkanthlandscape.com',
    website: 'https://neelkanthlandscape.com',
    industry: 'Landscaping',
    description: 'Professional landscaping and garden design services',
    primaryColor: '#2E7D32',
    secondaryColor: '#1B5E20',
    accentColor: '#4CAF50',
    backgroundColor: '#F1F8E9',
    textColor: '#1B3E1F',
    fontFamily: 'Inter'
  },
  {
    name: 'Hari Krishna Nursery and Plantation',
    code: 'HARIKRISHNA',
    address: '456 Plant Avenue, Delhi, Delhi',
    timezone: 'Asia/Kolkata',
    phone: '+91-9876543211',
    email: 'info@harikrishnanursery.com',
    website: 'https://harikrishnanursery.com',
    industry: 'Nursery & Plantation',
    description: 'Premium nursery and plantation services',
    primaryColor: '#1976D2',
    secondaryColor: '#0D47A1',
    accentColor: '#2196F3',
    backgroundColor: '#E3F2FD',
    textColor: '#0D47A1',
    fontFamily: 'Roboto'
  },
  {
    name: 'Asopalav Garden Consultant',
    code: 'ASOPALAV',
    address: '789 Garden Road, Bangalore, Karnataka',
    timezone: 'Asia/Kolkata',
    phone: '+91-9876543212',
    email: 'info@asopalavgarden.com',
    website: 'https://asopalavgarden.com',
    industry: 'Garden Consulting',
    description: 'Expert garden consultation and design services',
    primaryColor: '#7B1FA2',
    secondaryColor: '#4A148C',
    accentColor: '#9C27B0',
    backgroundColor: '#F3E5F5',
    textColor: '#4A148C',
    fontFamily: 'Poppins'
  }
];

const admins = [
  {
    name: 'Rajesh Kumar',
    email: 'rajesh@neelkanthlandscape.com',
    password: 'admin123',
    mobile: '+91-9876543210',
    address: '123 Garden Street, Mumbai, Maharashtra',
    role: 'superadmin',
    companyName: 'Neelkanth Landscape'
  },
  {
    name: 'Priya Sharma',
    email: 'priya@harikrishnanursery.com',
    password: 'admin123',
    mobile: '+91-9876543211',
    address: '456 Plant Avenue, Delhi, Delhi',
    role: 'superadmin',
    companyName: 'Hari Krishna Nursery and Plantation'
  },
  {
    name: 'Amit Patel',
    email: 'amit@asopalavgarden.com',
    password: 'admin123',
    mobile: '+91-9876543212',
    address: '789 Garden Road, Bangalore, Karnataka',
    role: 'superadmin',
    companyName: 'Asopalav Garden Consultant'
  },
  {
    name: 'Sneha Reddy',
    email: 'sneha@neelkanthlandscape.com',
    password: 'readonly123',
    mobile: '+91-9876543213',
    address: '123 Garden Street, Mumbai, Maharashtra',
    role: 'readonly',
    companyName: 'Neelkanth Landscape'
  }
];

async function setupTestData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing test data
    await Company.deleteMany({ code: { $in: ['NEELKANTH', 'HARIKRISHNA', 'ASOPALAV'] } });
    await Admin.deleteMany({ email: { $in: admins.map(admin => admin.email) } });
    console.log('✅ Cleared existing test data');

    // Create companies
    const createdCompanies = [];
    for (const companyData of companies) {
      const company = new Company(companyData);
      await company.save();
      createdCompanies.push(company);
      console.log(`✅ Created company: ${company.name} (${company.code})`);
    }

    // Create admins and assign to companies
    for (const adminData of admins) {
      const company = createdCompanies.find(c => c.name === adminData.companyName);
      if (!company) {
        console.log(`❌ Company not found for admin: ${adminData.name}`);
        continue;
      }

      const hashedPassword = await bcrypt.hash(adminData.password, 10);
      
      const admin = new Admin({
        name: adminData.name,
        email: adminData.email,
        password: hashedPassword,
        mobile: adminData.mobile,
        address: adminData.address,
        role: adminData.role,
        companyId: company._id
      });

      await admin.save();
      console.log(`✅ Created admin: ${admin.name} (${admin.email}) for company: ${company.name}`);
    }

    console.log('\n🎉 Test data setup completed successfully!');
    console.log('\n📋 Created Companies:');
    createdCompanies.forEach(company => {
      console.log(`   - ${company.name} (${company.code})`);
    });

    console.log('\n👥 Created Admins:');
    admins.forEach(admin => {
      console.log(`   - ${admin.name} (${admin.email}) - ${admin.role} - ${admin.companyName}`);
    });

    console.log('\n🔑 Login Credentials:');
    console.log('   Superadmin Accounts:');
    console.log('   - rajesh@neelkanthlandscape.com / admin123');
    console.log('   - priya@harikrishnanursery.com / admin123');
    console.log('   - amit@asopalavgarden.com / admin123');
    console.log('   ReadOnly Admin:');
    console.log('   - sneha@neelkanthlandscape.com / readonly123');

  } catch (error) {
    console.error('❌ Error setting up test data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

// Run the setup
setupTestData();
