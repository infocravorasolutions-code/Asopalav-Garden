import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import SuperAdmin from '../models/superadmin.models.js';
import dotenv from 'dotenv';

dotenv.config();

const manageSuperAdmins = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Get command line arguments
        const args = process.argv.slice(2);
        const command = args[0];

        switch (command) {
            case 'list':
                await listSuperAdmins();
                break;
            case 'create':
                await createSuperAdmin(args[1], args[2], args[3], args[4]);
                break;
            case 'delete':
                await deleteSuperAdmin(args[1]);
                break;
            case 'reset-password':
                await resetPassword(args[1], args[2]);
                break;
            case 'help':
                showHelp();
                break;
            default:
                console.log('❌ Invalid command. Use "node scripts/manageSuperAdmins.js help" for usage.');
                break;
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
        process.exit(0);
    }
};

const listSuperAdmins = async () => {
    try {
        const superAdmins = await SuperAdmin.find({}).select('name email mobile role isActive createdAt lastLogin');

        console.log('\n📊 All SuperAdmins in System:');
        console.log('='.repeat(80));

        if (superAdmins.length === 0) {
            console.log('No SuperAdmins found.');
            return;
        }

        superAdmins.forEach((admin, index) => {
            console.log(`${index + 1}. ${admin.name}`);
            console.log(`   Email: ${admin.email}`);
            console.log(`   Mobile: ${admin.mobile}`);
            console.log(`   Role: ${admin.role}`);
            console.log(`   Active: ${admin.isActive ? '✅ Yes' : '❌ No'}`);
            console.log(`   Created: ${admin.createdAt.toLocaleDateString()}`);
            console.log(`   Last Login: ${admin.lastLogin ? admin.lastLogin.toLocaleDateString() : 'Never'}`);
            console.log('-'.repeat(80));
        });

        console.log(`\nTotal SuperAdmins: ${superAdmins.length}`);
    } catch (error) {
        console.error('❌ Error listing SuperAdmins:', error);
    }
};

const createSuperAdmin = async (name, email, password, mobile) => {
    try {
        if (!name || !email || !password || !mobile) {
            console.log('❌ Missing required parameters. Usage: create "Name" "email@domain.com" "password" "mobile"');
            return;
        }

        // Check if SuperAdmin already exists
        const existingSuperAdmin = await SuperAdmin.findOne({ email });
        if (existingSuperAdmin) {
            console.log(`❌ SuperAdmin with email ${email} already exists.`);
            return;
        }

        // Create SuperAdmin
        const hashedPassword = await bcrypt.hash(password, 10);

        const superAdmin = new SuperAdmin({
            name,
            email,
            password: hashedPassword,
            mobile,
            address: 'System Generated',
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
        console.log(`Name: ${superAdmin.name}`);
        console.log(`Email: ${superAdmin.email}`);
        console.log(`Password: ${password}`);
        console.log(`Mobile: ${superAdmin.mobile}`);
        console.log(`Role: ${superAdmin.role}`);

    } catch (error) {
        console.error('❌ Error creating SuperAdmin:', error);
    }
};

const deleteSuperAdmin = async (email) => {
    try {
        if (!email) {
            console.log('❌ Email is required. Usage: delete "email@domain.com"');
            return;
        }

        const superAdmin = await SuperAdmin.findOne({ email });
        if (!superAdmin) {
            console.log(`❌ SuperAdmin with email ${email} not found.`);
            return;
        }

        await SuperAdmin.findByIdAndDelete(superAdmin._id);
        console.log(`✅ SuperAdmin ${superAdmin.name} (${email}) deleted successfully.`);

    } catch (error) {
        console.error('❌ Error deleting SuperAdmin:', error);
    }
};

const resetPassword = async (email, newPassword) => {
    try {
        if (!email || !newPassword) {
            console.log('❌ Email and new password are required. Usage: reset-password "email@domain.com" "newPassword"');
            return;
        }

        const superAdmin = await SuperAdmin.findOne({ email });
        if (!superAdmin) {
            console.log(`❌ SuperAdmin with email ${email} not found.`);
            return;
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        superAdmin.password = hashedPassword;
        await superAdmin.save();

        console.log(`✅ Password reset successfully for ${superAdmin.name} (${email})`);
        console.log(`New Password: ${newPassword}`);

    } catch (error) {
        console.error('❌ Error resetting password:', error);
    }
};

const showHelp = () => {
    console.log('\n🔧 SuperAdmin Management Tool');
    console.log('='.repeat(50));
    console.log('Usage: node scripts/manageSuperAdmins.js <command> [parameters]');
    console.log('\nCommands:');
    console.log('  list                           - List all SuperAdmins');
    console.log('  create "Name" "email" "password" "mobile" - Create new SuperAdmin');
    console.log('  delete "email"                 - Delete SuperAdmin by email');
    console.log('  reset-password "email" "newPassword" - Reset SuperAdmin password');
    console.log('  help                           - Show this help message');
    console.log('\nExamples:');
    console.log('  node scripts/manageSuperAdmins.js list');
    console.log('  node scripts/manageSuperAdmins.js create "John Doe" "john@test.com" "password123" "9876543210"');
    console.log('  node scripts/manageSuperAdmins.js delete "john@test.com"');
    console.log('  node scripts/manageSuperAdmins.js reset-password "john@test.com" "newpassword123"');
};

// Run the script
manageSuperAdmins();
