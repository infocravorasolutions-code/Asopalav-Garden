import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import SuperAdmin from '../models/superadmin.models.js';
import dotenv from 'dotenv';

dotenv.config();

const createSuperAdmin = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Check if SuperAdmin already exists
        const existingSuperAdmin = await SuperAdmin.findOne({ email: 'superadmin@system.com' });

        if (existingSuperAdmin) {
            console.log('⚠️ SuperAdmin already exists with email: superadmin@system.com');
            console.log('SuperAdmin details:');
            console.log(`- Name: ${existingSuperAdmin.name}`);
            console.log(`- Email: ${existingSuperAdmin.email}`);
            console.log(`- Role: ${existingSuperAdmin.role}`);
            console.log(`- Created: ${existingSuperAdmin.createdAt}`);
            return;
        }

        // Create SuperAdmin
        const hashedPassword = await bcrypt.hash('SuperAdmin@123', 10);

        const superAdmin = new SuperAdmin({
            name: 'System SuperAdmin',
            email: 'superadmin@system.com',
            password: hashedPassword,
            mobile: '9999999999',
            address: 'System Headquarters',
            role: 'superadmin',
            isActive: true,
            permissions: {
                canCreateCompanies: true,
                canEditCompanies: true,
                canDeleteCompanies: true,
                canViewAllCompanies: true,
                canManageUsers: true
            }
        });

        await superAdmin.save();

        console.log('✅ SuperAdmin created successfully!');
        console.log('SuperAdmin Details:');
        console.log(`- Name: ${superAdmin.name}`);
        console.log(`- Email: ${superAdmin.email}`);
        console.log(`- Password: SuperAdmin@123`);
        console.log(`- Role: ${superAdmin.role}`);
        console.log(`- Permissions: ${JSON.stringify(superAdmin.permissions, null, 2)}`);
        console.log('\n🔐 Login Credentials:');
        console.log('Email: superadmin@system.com');
        console.log('Password: SuperAdmin@123');
        console.log('\n🌐 Access URL: http://localhost:3000/superadmin/login');

    } catch (error) {
        console.error('❌ Error creating SuperAdmin:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
        process.exit(0);
    }
};

// Run the script
createSuperAdmin();
