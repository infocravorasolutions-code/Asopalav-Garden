import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import Company from '../models/company.models.js';
import Admin from '../models/admin.models.js';
import Manager from '../models/manager.models.js';
import Employee from '../models/employee.models.js';
// Location model removed - using manual location fields

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI;

// Manual location data for managers
const managerLocations = {
  'vikram@neelkanthlandscape.com': {
    locationName: 'Mumbai Office',
    locationAddress: '123 Garden Street, Mumbai, Maharashtra',
    locationLatitude: 19.0760,
    locationLongitude: 72.8777,
    locationRadius: 100
  },
  'sunita@harikrishnanursery.com': {
    locationName: 'Delhi Office',
    locationAddress: '456 Plant Avenue, Delhi, Delhi',
    locationLatitude: 28.7041,
    locationLongitude: 77.1025,
    locationRadius: 100
  },
  'ravi@asopalavgarden.com': {
    locationName: 'Bangalore Office',
    locationAddress: '789 Garden Road, Bangalore, Karnataka',
    locationLatitude: 12.9716,
    locationLongitude: 77.5946,
    locationRadius: 100
  }
};

const managers = [
  {
    name: 'Vikram Singh',
    email: 'vikram@neelkanthlandscape.com',
    password: 'manager123',
    mobile: '+91-9876543220',
    address: '123 Garden Street, Mumbai, Maharashtra',
    companyName: 'Neelkanth Landscape',
    locationName: 'Mumbai Office'
  },
  {
    name: 'Sunita Gupta',
    email: 'sunita@harikrishnanursery.com',
    password: 'manager123',
    mobile: '+91-9876543221',
    address: '456 Plant Avenue, Delhi, Delhi',
    companyName: 'Hari Krishna Nursery and Plantation',
    locationName: 'Delhi Office'
  },
  {
    name: 'Ravi Kumar',
    email: 'ravi@asopalavgarden.com',
    password: 'manager123',
    mobile: '+91-9876543222',
    address: '789 Garden Road, Bangalore, Karnataka',
    companyName: 'Asopalav Garden Consultant',
    locationName: 'Bangalore Office'
  }
];

const employees = [
  // Neelkanth Landscape employees
  {
    name: 'Arjun Mehta',
    email: 'arjun@neelkanthlandscape.com',
    password: 'employee123',
    mobile: '+91-9876543230',
    address: 'Mumbai, Maharashtra',
    empCode: 'NEEL001',
    position: 'Landscape Designer',
    companyName: 'Neelkanth Landscape',
    managerEmail: 'vikram@neelkanthlandscape.com'
  },
  {
    name: 'Priya Desai',
    email: 'priya.emp@neelkanthlandscape.com',
    password: 'employee123',
    mobile: '+91-9876543231',
    address: 'Mumbai, Maharashtra',
    empCode: 'NEEL002',
    position: 'Garden Supervisor',
    companyName: 'Neelkanth Landscape',
    managerEmail: 'vikram@neelkanthlandscape.com'
  },
  // Hari Krishna Nursery employees
  {
    name: 'Deepak Sharma',
    email: 'deepak@harikrishnanursery.com',
    password: 'employee123',
    mobile: '+91-9876543240',
    address: 'Delhi, Delhi',
    empCode: 'HARI001',
    position: 'Nursery Manager',
    companyName: 'Hari Krishna Nursery and Plantation',
    managerEmail: 'sunita@harikrishnanursery.com'
  },
  {
    name: 'Kavita Singh',
    email: 'kavita@harikrishnanursery.com',
    password: 'employee123',
    mobile: '+91-9876543241',
    address: 'Delhi, Delhi',
    empCode: 'HARI002',
    position: 'Plant Specialist',
    companyName: 'Hari Krishna Nursery and Plantation',
    managerEmail: 'sunita@harikrishnanursery.com'
  },
  // Asopalav Garden employees
  {
    name: 'Suresh Reddy',
    email: 'suresh@asopalavgarden.com',
    password: 'employee123',
    mobile: '+91-9876543250',
    address: 'Bangalore, Karnataka',
    empCode: 'ASOP001',
    position: 'Garden Consultant',
    companyName: 'Asopalav Garden Consultant',
    managerEmail: 'ravi@asopalavgarden.com'
  },
  {
    name: 'Lakshmi Nair',
    email: 'lakshmi@asopalavgarden.com',
    password: 'employee123',
    mobile: '+91-9876543251',
    address: 'Bangalore, Karnataka',
    empCode: 'ASOP002',
    position: 'Design Assistant',
    companyName: 'Asopalav Garden Consultant',
    managerEmail: 'ravi@asopalavgarden.com'
  }
];

async function setupTestUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing test data
    await Manager.deleteMany({ email: { $in: managers.map(m => m.email) } });
    await Employee.deleteMany({ email: { $in: employees.map(e => e.email) } });
    console.log('✅ Cleared existing test data');

    // Get companies
    const companies = await Company.find({ code: { $in: ['NEELKANTH', 'HARIKRISHNA', 'ASOPALAV'] } });
    console.log(`✅ Found ${companies.length} companies`);

    // Locations are now handled manually in manager records

    // Create managers with manual location data
    const createdManagers = [];
    for (const managerData of managers) {
      const company = companies.find(c => c.name === managerData.companyName);
      
      if (!company) {
        console.log(`❌ Company not found for manager: ${managerData.name}`);
        continue;
      }

      const hashedPassword = await bcrypt.hash(managerData.password, 10);
      const locationData = managerLocations[managerData.email];
      
      const manager = new Manager({
        name: managerData.name,
        email: managerData.email,
        password: hashedPassword,
        mobile: managerData.mobile,
        address: managerData.address,
        companyId: company._id,
        isActive: true,
        // Manual location fields
        locationName: locationData.locationName,
        locationAddress: locationData.locationAddress,
        locationLatitude: locationData.locationLatitude,
        locationLongitude: locationData.locationLongitude,
        locationRadius: locationData.locationRadius
      });

      await manager.save();
      createdManagers.push(manager);
      console.log(`✅ Created manager: ${manager.name} (${manager.email}) for company: ${company.name} with location: ${locationData.locationName}`);
    }

    // Create employees
    for (const employeeData of employees) {
      const company = companies.find(c => c.name === employeeData.companyName);
      const manager = createdManagers.find(m => m.email === employeeData.managerEmail);
      
      if (!company || !manager) {
        console.log(`❌ Company or manager not found for employee: ${employeeData.name}`);
        continue;
      }

      const hashedPassword = await bcrypt.hash(employeeData.password, 10);
      
      const employee = new Employee({
        name: employeeData.name,
        email: employeeData.email,
        passwordHash: hashedPassword,
        role: 'employee',
        companyId: company._id,
        managerId: manager._id,
        active: true
      });

      await employee.save();
      console.log(`✅ Created employee: ${employee.name} (${employee.email}) for company: ${company.name}`);
    }

    console.log('\n🎉 Test users setup completed successfully!');
    console.log('\n🏢 Companies:');
    companies.forEach(company => {
      console.log(`   - ${company.name} (${company.code})`);
    });

    console.log('\n👨‍💼 Managers:');
    createdManagers.forEach(manager => {
      console.log(`   - ${manager.name} (${manager.email})`);
    });

    console.log('\n👷‍♂️ Employees:');
    employees.forEach(emp => {
      console.log(`   - ${emp.name} (${emp.email})`);
    });

    console.log('\n🔑 Login Credentials:');
    console.log('   Managers:');
    managers.forEach(manager => {
      console.log(`   - ${manager.email} / ${manager.password}`);
    });
    console.log('   Employees:');
    employees.forEach(emp => {
      console.log(`   - ${emp.email} / ${emp.password}`);
    });

  } catch (error) {
    console.error('❌ Error setting up test users:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

// Run the setup
setupTestUsers();
