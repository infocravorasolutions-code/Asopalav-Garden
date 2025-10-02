import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import Company from '../models/company.models.js';
import Employee from '../models/employee.models.js';
import Admin from '../models/admin.models.js';

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI;
const TARGET_COMPANY_ID = "68d93a3b1c85af59d67b4a76";

// Flower company employees data
const flowerEmployees = [
  { empCode: "FLWR001", name: "Shukan Patel", designation: "supervisor", shift: 1 },
  { empCode: "FLWR002", name: "Arvindbhai Ravat", designation: "supervisor", shift: 1 },
  { empCode: "FLWR003", name: "Sahil Shekh", designation: "supervisor", shift: 1 },
  { empCode: "FLWR004", name: "Vankar Mukeshbhai Keshavbhai", designation: "gardener", shift: 1 },
  { empCode: "FLWR005", name: "Rajput Nileshkumar Chandubhai", designation: "gardener", shift: 1 },
  { empCode: "FLWR006", name: "Rabari Shankarbhai Ramjibhai", designation: "gardener", shift: 1 },
  { empCode: "FLWR007", name: "Bamaniya Ratilal Rupabhai", designation: "gardener", shift: 1 },
  { empCode: "FLWR008", name: "Parmar Dahyabhai Ambalal", designation: "gardener", shift: 1 },
  { empCode: "FLWR009", name: "Parmar Rajubhai Bhaijibhai", designation: "gardener", shift: 1 },
  { empCode: "FLWR010", name: "Parmar Bhupendrabhai Manilal", designation: "gardener", shift: 1 },
  { empCode: "FLWR011", name: "Raval Hasmukhbhai Laxamanbhai", designation: "gardener", shift: 1 },
  { empCode: "FLWR012", name: "Chauhan Rameshbhai Budhabhai", designation: "gardener", shift: 1 },
  { empCode: "FLWR013", name: "Solanki Takhatsinh Rameshbhai", designation: "gardener", shift: 1 },
  { empCode: "FLWR014", name: "Vagela Ganpatbhai Parshotambhai", designation: "gardener", shift: 1 },
  { empCode: "FLWR015", name: "Rathod Bhupendrabhai Gordhanbhai", designation: "gardener", shift: 1 },
  { empCode: "FLWR016", name: "Bariya Bhikhabhai Lallubhai", designation: "gardener", shift: 1 },
  { empCode: "FLWR017", name: "Bariya Rohit chetanbhai", designation: "gardener", shift: 1 },
  { empCode: "FLWR018", name: "Solanki Jagdishbhai Mafatbhai", designation: "gardener", shift: 1 },
  { empCode: "FLWR019", name: "Parmar Dilipbhai Fatesign", designation: "gardener", shift: 1 },
  { empCode: "FLWR020", name: "Padhiyar Sanjaykumar Budhabhai", designation: "gardener", shift: 1 },
  { empCode: "FLWR021", name: "Rathod Melsingbhai Kabhaybhai", designation: "gardener", shift: 1 },
  { empCode: "FLWR022", name: "Mori Vijaysing Chatrasinh", designation: "gardener", shift: 1 },
  { empCode: "FLWR023", name: "Chauhan Hiteshkumar Kashibhai", designation: "gardener", shift: 1 },
  { empCode: "FLWR024", name: "Jadav Nilesh Bhupendrabhai", designation: "gardener", shift: 1 },
  { empCode: "FLWR025", name: "Rajput Arvindbhai Somabhai", designation: "gardener", shift: 1 },
  { empCode: "FLWR026", name: "Parmar Pareshbhai Kalabhai", designation: "gardener", shift: 1 },
  { empCode: "FLWR027", name: "Damor Ramanbhai Maganbhai", designation: "gardener", shift: 1 },
  { empCode: "FLWR028", name: "Mahida Pravinbhai Muljibhai", designation: "gardener", shift: 1 },
  { empCode: "FLWR029", name: "Parmar Nileshkumar Veribhai", designation: "gardener", shift: 1 },
  { empCode: "FLWR030", name: "Parmar Suryakantbhai Shankarbhai", designation: "gardener", shift: 1 },
  { empCode: "FLWR031", name: "Makwana Thakorbhai Haribhai", designation: "gardener", shift: 1 },
  { empCode: "FLWR032", name: "Togda Mahendra Jabarchandrarao", designation: "gardener", shift: 1 },
  { empCode: "FLWR033", name: "Parmar Ramanbhai Gulabbhai", designation: "gardener", shift: 1 },
  { empCode: "FLWR034", name: "Parmar Rasikbhai Ganpatbhai", designation: "gardener", shift: 1 },
  { empCode: "FLWR035", name: "Gohil Bhailalbhai Prabhatbhai", designation: "gardener", shift: 1 },
  { empCode: "FLWR036", name: "Rathod Jagdishbhai Balubhai", designation: "gardener", shift: 1 },
  { empCode: "FLWR037", name: "Vasava Chandrakantbhai Manilal", designation: "gardener", shift: 1 },
  { empCode: "FLWR038", name: "Rana Rajubhai Haribhai", designation: "gardener", shift: 1 },
  { empCode: "FLWR039", name: "Jadav Jagdishbhai Maganbhai", designation: "gardener", shift: 1 },
  { empCode: "FLWR040", name: "Padhiyar Rameshbhai Kanubhai", designation: "gardener", shift: 1 },
  { empCode: "FLWR041", name: "Mahida Arvindbhai Muljibhai", designation: "gardener", shift: 1 },
  { empCode: "FLWR042", name: "Vasava Dineshbhai Ramanbhai", designation: "gardener", shift: 1 },
  { empCode: "FLWR043", name: "Solanki Jasbhai Bhailalbhai", designation: "gardener", shift: 1 },
  { empCode: "FLWR044", name: "Patel Jayeshbhai Bhogilal", designation: "gardener", shift: 1 },
  { empCode: "FLWR045", name: "Chauhan Hasmukhbhai Mohanbhai", designation: "gardener", shift: 1 },
  { empCode: "FLWR046", name: "Prajapati Ashokbhai Sankarbhai", designation: "gardener", shift: 1 },
  { empCode: "FLWR047", name: "Parmar Balvantsinh Udesinh", designation: "gardener", shift: 1 },
  { empCode: "FLWR048", name: "Gohil Vitthalbhai Ranchodbhai", designation: "gardener", shift: 1 },
  { empCode: "FLWR049", name: "Chauhan Ramanbhai Laxmanbhai", designation: "gardener", shift: 1 },
  { empCode: "FLWR050", name: "Baria Sureshbhai Shantilal", designation: "gardener", shift: 1 },
  { empCode: "FLWR051", name: "Rana Manishbhai Jeetsinh", designation: "gardener", shift: 1 },
  { empCode: "FLWR052", name: "Solanki Thakorbhai Ramabhai", designation: "gardener", shift: 1 },
  { empCode: "FLWR053", name: "Chauhan Pinakinkumar Vajesinh", designation: "gardener", shift: 1 },
  { empCode: "FLWR054", name: "Solanki Mahendrabhai Ravjibhai", designation: "gardener", shift: 1 },
  { empCode: "FLWR055", name: "Rathod Himmantbhai Balubhai", designation: "gardener", shift: 1 }
];

// Helper function to get shift string based on shift number
function getShiftString(shiftNumber) {
  switch(shiftNumber) {
    case 1:
      return 'Morning Shift (7:00 AM - 3:00 PM)';
    case 2:
      return 'Evening Shift (3:00 PM - 11:00 PM)';
    case 3:
      return 'Night Shift (11:00 PM - 7:00 AM)';
    default:
      return 'Morning Shift (7:00 AM - 3:00 PM)';
  }
}

// Helper function to get category based on designation
function getCategory(designation) {
  if (designation === 'supervisor') return 'skilled';
  if (designation === 'gardener') return 'semi-skilled';
  return 'unskilled';
}

async function importFlowerEmployees() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Verify company exists
    const company = await Company.findById(TARGET_COMPANY_ID);
    if (!company) {
      console.error(`❌ Company with ID ${TARGET_COMPANY_ID} not found`);
      process.exit(1);
    }
    console.log(`✅ Found company: ${company.name} (${company.code})`);

    // Check for existing employees with same empCode
    const existingEmpCodes = await Employee.find({
      empCode: { $in: flowerEmployees.map(emp => emp.empCode) },
      companyId: TARGET_COMPANY_ID
    }).select('empCode');

    const existingCodesSet = new Set(existingEmpCodes.map(emp => emp.empCode));
    console.log(`ℹ️ Found ${existingCodesSet.size} existing employees with same codes`);

    // Filter out existing employees
    const newEmployees = flowerEmployees.filter(emp => !existingCodesSet.has(emp.empCode));
    console.log(`✅ ${newEmployees.length} new employees to import`);

    if (newEmployees.length === 0) {
      console.log('ℹ️ No new employees to import');
      process.exit(0);
    }

    // Create employee records
    const employeeRecords = [];
    const defaultPasswordHash = await bcrypt.hash('employee123', 10);
    
    for (const emp of newEmployees) {
      employeeRecords.push({
        companyId: TARGET_COMPANY_ID,
        name: emp.name,
        email: `${emp.empCode.toLowerCase()}@${company.code.toLowerCase()}.com`,
        passwordHash: defaultPasswordHash,
        role: 'employee',
        empCode: emp.empCode,
        mobile: `+91-${Math.floor(Math.random() * 9000000000) + 1000000000}`, // Random 10-digit number
        address: 'Garden Site, Flower Company',
        designation: emp.designation,
        category: getCategory(emp.designation),
        shift: getShiftString(emp.shift),
        uanNumber: `UAN${emp.empCode}${Math.floor(Math.random() * 1000)}`,
        esicNumber: `ESIC${emp.empCode}${Math.floor(Math.random() * 1000)}`,
        accountNumber: `${Math.floor(Math.random() * 9000000000000000) + 1000000000000000}`,
        ifscCode: 'SBIN0001234',
        active: true
      });
    }

    // Insert employees
    await Employee.insertMany(employeeRecords);
    console.log(`✅ Successfully imported ${employeeRecords.length} employees`);

    // Display summary
    console.log('\n📊 Import Summary:');
    console.log(`   - Total employees in data: ${flowerEmployees.length}`);
    console.log(`   - New employees imported: ${employeeRecords.length}`);
    console.log(`   - Existing employees skipped: ${existingCodesSet.size}`);
    console.log(`   - Company: ${company.name} (${company.code})`);

    console.log('\n🔑 Default Login Credentials:');
    console.log('   - Password for all employees: employee123');
    console.log('   - Email format: {empcode}@{companycode}.com');
    console.log('   - Example: flwr001@company.com / employee123');

    console.log('\n📋 Sample Employee Logins:');
    employeeRecords.slice(0, 5).forEach(emp => {
      console.log(`   - ${emp.empCode}: ${emp.email} / employee123`);
    });

  } catch (error) {
    console.error('❌ Error importing employees:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

// Run the import
importFlowerEmployees();
