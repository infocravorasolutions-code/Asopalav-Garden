import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import SuperAdmin from '../models/superadmin.models.js';
import dotenv from 'dotenv';

dotenv.config();

const createTestSuperAdmin = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Test SuperAdmin credentials
        const testCredentials = {
            name: 'Test SuperAdmin',
            email: 'test@superadmin.com',
            password: 'TestAdmin@123',
            mobile: '9876543210',
            address: 'Test Address, Test City',
            role: 'superadmin',
            isActive: true,
            permissions: {
                canCreateCompanies: true,
                canEditCompanies: true,
                canDeleteCompanies: true,
                canViewAllCompanies: true,
                canManageUsers: true
            }
        };

        // Check if Test SuperAdmin already exists
        const existingTestSuperAdmin = await SuperAdmin.findOne({ email: testCredentials.email });

        if (existingTestSuperAdmin) {
            console.log('⚠️ Test SuperAdmin already exists with email:', testCredentials.email);
            console.log('Test SuperAdmin details:');
            console.log(`- Name: ${existingTestSuperAdmin.name}`);
            console.log(`- Email: ${existingTestSuperAdmin.email}`);
            console.log(`- Role: ${existingTestSuperAdmin.role}`);
            console.log(`- Created: ${existingTestSuperAdmin.createdAt}`);
            console.log(`- Last Login: ${existingTestSuperAdmin.lastLogin || 'Never'}`);
            return;
        }

        // Create Test SuperAdmin
        const hashedPassword = await bcrypt.hash(testCredentials.password, 10);

        const testSuperAdmin = new SuperAdmin({
            name: testCredentials.name,
            email: testCredentials.email,
            password: hashedPassword,
            mobile: testCredentials.mobile,
            address: testCredentials.address,
            role: testCredentials.role,
            isActive: testCredentials.isActive,
            permissions: testCredentials.permissions
        });

        await testSuperAdmin.save();

        console.log('✅ Test SuperAdmin created successfully!');
        console.log('\n📋 Test SuperAdmin Details:');
        console.log(`- Name: ${testSuperAdmin.name}`);
        console.log(`- Email: ${testSuperAdmin.email}`);
        console.log(`- Password: ${testCredentials.password}`);
        console.log(`- Mobile: ${testSuperAdmin.mobile}`);
        console.log(`- Address: ${testSuperAdmin.address}`);
        console.log(`- Role: ${testSuperAdmin.role}`);
        console.log(`- Active: ${testSuperAdmin.isActive}`);
        console.log(`- Permissions: ${JSON.stringify(testSuperAdmin.permissions, null, 2)}`);

        console.log('\n🔐 Test Login Credentials:');
        console.log('Email: test@superadmin.com');
        console.log('Password: TestAdmin@123');
        console.log('\n🌐 Test Access URL: http://localhost:3000/superadmin/login');

        console.log('\n📊 All SuperAdmins in System:');
        const allSuperAdmins = await SuperAdmin.find({}).select('name email role isActive createdAt lastLogin');
        allSuperAdmins.forEach((admin, index) => {
            console.log(`${index + 1}. ${admin.name} (${admin.email}) - ${admin.role} - Active: ${admin.isActive}`);
        });

    } catch (error) {
        console.error('❌ Error creating Test SuperAdmin:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
        process.exit(0);
    }
};

// Run the script
createTestSuperAdmin();
