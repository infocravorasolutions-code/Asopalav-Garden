import mongoose from 'mongoose';
import Employee from '../models/employee.models.js';

const fixEmployeeIndex = async () => {
    try {
        console.log('🔧 Starting employee index fix...');

        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/attendence-management');
        console.log('✅ Connected to MongoDB');

        // Get the collection
        const collection = Employee.collection;

        // Get all indexes
        const indexes = await collection.indexes();
        console.log('📋 Current indexes:', indexes.map(idx => ({ name: idx.name, key: idx.key, unique: idx.unique })));

        // Find and drop the problematic unique index on companyId
        const problematicIndex = indexes.find(idx =>
            idx.name === 'companyId_1' && idx.unique === true
        );

        if (problematicIndex) {
            console.log('❌ Found problematic unique index on companyId:', problematicIndex);
            await collection.dropIndex('companyId_1');
            console.log('✅ Successfully dropped unique index on companyId');
        } else {
            console.log('ℹ️ No problematic unique index on companyId found');
        }

        // Ensure we have the correct indexes
        // Email should be unique globally
        try {
            await collection.createIndex({ email: 1 }, { unique: true, name: 'email_unique' });
            console.log('✅ Created unique index on email');
        } catch (error) {
            if (error.code === 85) {
                console.log('ℹ️ Unique index on email already exists');
            } else {
                console.log('⚠️ Error creating email index:', error.message);
            }
        }

        // CompanyId should NOT be unique (multiple employees per company)
        // But we can create a compound index for better query performance
        try {
            await collection.createIndex({ companyId: 1, email: 1 }, { name: 'company_email_index' });
            console.log('✅ Created compound index on companyId and email');
        } catch (error) {
            console.log('⚠️ Error creating compound index:', error.message);
        }

        // Get updated indexes
        const updatedIndexes = await collection.indexes();
        console.log('📋 Updated indexes:', updatedIndexes.map(idx => ({ name: idx.name, key: idx.key, unique: idx.unique })));

        console.log('🎉 Employee index fix completed successfully!');

    } catch (error) {
        console.error('💥 Error fixing employee indexes:', error);
    } finally {
        await mongoose.disconnect();
        console.log('👋 Disconnected from MongoDB');
        process.exit(0);
    }
};

// Run the fix
fixEmployeeIndex();
