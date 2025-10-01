import mongoose from 'mongoose';
import Attendance from '../models/attendence.models.js';
import Employee from '../models/employee.models.js';
import dotenv from 'dotenv';

dotenv.config();

const testSameDayStepIn = async () => {
    try {
        console.log('🧪 Testing same-day step-in prevention logic...');

        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/attendence-management');
        console.log('✅ Connected to MongoDB');

        // Get a sample employee
        const employee = await Employee.findOne({ role: 'employee' });
        if (!employee) {
            console.log('❌ No employee found for testing');
            return;
        }

        console.log(`👤 Testing with employee: ${employee.name} (${employee._id})`);

        // Test 1: Check if employee has completed attendance today
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

        console.log(`📅 Date range: ${startOfDay.toISOString()} to ${endOfDay.toISOString()}`);

        const todayCompletedAttendance = await Attendance.findOne({
            employeeId: employee._id,
            stepIn: { $gte: startOfDay, $lt: endOfDay },
            stepOut: { $exists: true }
        });

        if (todayCompletedAttendance) {
            console.log('✅ Found completed attendance for today:');
            console.log(`   Step In: ${todayCompletedAttendance.stepIn}`);
            console.log(`   Step Out: ${todayCompletedAttendance.stepOut}`);
            console.log('🚫 Employee should NOT be able to step in again today');
        } else {
            console.log('✅ No completed attendance found for today');
            console.log('✅ Employee CAN step in today');
        }

        // Test 2: Check for open attendance
        const openAttendance = await Attendance.findOne({
            employeeId: employee._id,
            stepOut: { $exists: false }
        });

        if (openAttendance) {
            console.log('⚠️ Found open attendance:');
            console.log(`   Step In: ${openAttendance.stepIn}`);
            console.log('🚫 Employee must step out first before stepping in again');
        } else {
            console.log('✅ No open attendance found');
        }

        // Test 3: Show all attendance records for today
        const allTodayAttendance = await Attendance.find({
            employeeId: employee._id,
            stepIn: { $gte: startOfDay, $lt: endOfDay }
        }).sort({ stepIn: -1 });

        console.log(`📊 Total attendance records for today: ${allTodayAttendance.length}`);
        allTodayAttendance.forEach((att, index) => {
            console.log(`   ${index + 1}. Step In: ${att.stepIn}, Step Out: ${att.stepOut || 'Open'}`);
        });

        console.log('🎉 Same-day step-in prevention test completed!');

    } catch (error) {
        console.error('💥 Error testing same-day step-in logic:', error);
    } finally {
        await mongoose.disconnect();
        console.log('👋 Disconnected from MongoDB');
        process.exit(0);
    }
};

// Run the test
testSameDayStepIn();
