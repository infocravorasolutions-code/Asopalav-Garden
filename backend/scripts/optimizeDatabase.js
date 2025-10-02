import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const optimizeDatabase = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const db = mongoose.connection.db;

        // Create indexes for Attendance collection
        console.log('Creating indexes for Attendance collection...');

        // Compound index for company + date range queries
        await db.collection('attendances').createIndex({
            companyId: 1,
            stepIn: -1
        });

        // Index for employee queries
        await db.collection('attendances').createIndex({
            employeeId: 1,
            stepIn: -1
        });

        // Index for manager queries
        await db.collection('attendances').createIndex({
            managerId: 1,
            stepIn: -1
        });

        // Index for status queries
        await db.collection('attendances').createIndex({
            status: 1,
            stepIn: -1
        });

        // Index for shift queries
        await db.collection('attendances').createIndex({
            shift: 1,
            stepIn: -1
        });

        // Compound index for complex filtering
        await db.collection('attendances').createIndex({
            companyId: 1,
            employeeId: 1,
            stepIn: -1
        });

        // Index for date range queries
        await db.collection('attendances').createIndex({
            stepIn: -1
        });

        console.log('✅ Attendance indexes created successfully');

        // Create indexes for Employee collection
        console.log('Creating indexes for Employee collection...');

        await db.collection('employees').createIndex({
            companyId: 1,
            email: 1
        });

        await db.collection('employees').createIndex({
            managerId: 1
        });

        await db.collection('employees').createIndex({
            empCode: 1
        });

        console.log('✅ Employee indexes created successfully');

        // Create indexes for Manager collection
        console.log('Creating indexes for Manager collection...');

        await db.collection('managers').createIndex({
            companyId: 1,
            email: 1
        });

        console.log('✅ Manager indexes created successfully');

        // Create indexes for Admin collection
        console.log('Creating indexes for Admin collection...');

        await db.collection('admins').createIndex({
            companyId: 1,
            email: 1
        });

        console.log('✅ Admin indexes created successfully');

        console.log('🎉 Database optimization completed successfully!');

    } catch (error) {
        console.error('❌ Error optimizing database:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
};

// Run optimization
optimizeDatabase();
