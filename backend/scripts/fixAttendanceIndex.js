import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const fixAttendanceIndex = async () => {
    try {
        console.log('🔧 Starting attendance index fix...');

        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/attendence-management');
        console.log('✅ Connected to MongoDB');

        // Get the attendance collection
        const db = mongoose.connection.db;
        const collection = db.collection('attendances');

        // Get all indexes
        const indexes = await collection.indexes();
        console.log('📋 Current attendance indexes:');
        indexes.forEach(idx => {
            console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)} (unique: ${idx.unique})`);
        });

        // Find and drop the problematic unique index
        const problematicIndexes = indexes.filter(idx =>
            idx.name === 'employeeId_1_date_1' ||
            (idx.key.employeeId && idx.key.date && idx.unique === true)
        );

        if (problematicIndexes.length > 0) {
            console.log('❌ Found problematic unique indexes:');
            problematicIndexes.forEach(idx => {
                console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}`);
            });

            for (const index of problematicIndexes) {
                try {
                    await collection.dropIndex(index.name);
                    console.log(`✅ Successfully dropped problematic index: ${index.name}`);
                } catch (error) {
                    console.log(`⚠️ Error dropping index ${index.name}:`, error.message);
                }
            }
        } else {
            console.log('ℹ️ No problematic unique indexes found');
        }

        // Ensure we have the correct indexes (non-unique)
        console.log('🔨 Creating/ensuring correct indexes...');

        // Index for employee queries (non-unique)
        try {
            await collection.createIndex({ employeeId: 1, stepIn: -1 }, { name: 'employeeId_stepIn_index' });
            console.log('✅ Created/verified employeeId + stepIn index');
        } catch (error) {
            if (error.code === 85) {
                console.log('ℹ️ employeeId + stepIn index already exists');
            } else {
                console.log('⚠️ Error creating employeeId + stepIn index:', error.message);
            }
        }

        // Index for company queries
        try {
            await collection.createIndex({ companyId: 1, stepIn: -1 }, { name: 'companyId_stepIn_index' });
            console.log('✅ Created/verified companyId + stepIn index');
        } catch (error) {
            if (error.code === 85) {
                console.log('ℹ️ companyId + stepIn index already exists');
            } else {
                console.log('⚠️ Error creating companyId + stepIn index:', error.message);
            }
        }

        // Index for open attendance records (stepOut: null)
        try {
            await collection.createIndex({ employeeId: 1, stepOut: 1 }, { name: 'employeeId_stepOut_index' });
            console.log('✅ Created/verified employeeId + stepOut index');
        } catch (error) {
            if (error.code === 85) {
                console.log('ℹ️ employeeId + stepOut index already exists');
            } else {
                console.log('⚠️ Error creating employeeId + stepOut index:', error.message);
            }
        }

        // Get updated indexes
        const updatedIndexes = await collection.indexes();
        console.log('📋 Updated attendance indexes:');
        updatedIndexes.forEach(idx => {
            console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)} (unique: ${idx.unique})`);
        });

        console.log('🎉 Attendance index fix completed successfully!');
        console.log('💡 Employees can now have multiple attendance records per day');

    } catch (error) {
        console.error('💥 Error fixing attendance indexes:', error);
    } finally {
        await mongoose.disconnect();
        console.log('👋 Disconnected from MongoDB');
        process.exit(0);
    }
};

// Run the fix
fixAttendanceIndex();
