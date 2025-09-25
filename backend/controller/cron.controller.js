
import Attendance from "../models/attendence.models.js";
import Employee from "../models/employee.models.js";
import EmployeeLocation from "../models/employeeLocation.models.js";

// Run every 30 minutes
export const autoStepOut=async()=>{

  const now = new Date();
  const eightHoursAgo = new Date(now.getTime() - 8 * 60 * 60 * 1000);

  try {
    const records = await Attendance.find({
      stepOut: null,
      stepIn: { $lte: eightHoursAgo }
    });


    for (const attendance of records) {
      const stepOutTime = new Date();
      const totalTime = Math.round((stepOutTime - attendance.stepIn) / 60000);

      attendance.stepOut = stepOutTime;
      attendance.totalTime = totalTime;
      attendance.note = attendance.note || "No Remarks";
      attendance.status= "present"
      await attendance.save();

      await Employee.findByIdAndUpdate(attendance.employeeId, { isWorking: false });

    }
  } catch (error) {
  }
}

// Run every 10 minutes - Update latest locations for ALL employees
export const updateAllEmployeeLocations = async () => {

  try {
    // Get all employees
    const allEmployees = await Employee.find({}, 'name empCode isWorking').lean();

    let updatedCount = 0;
    let noLocationCount = 0;

    for (const employee of allEmployees) {
      try {
        // Get the latest location for this employee
        const latestLocation = await EmployeeLocation.findOne({
          employeeId: employee._id
        }).sort({ lastSeen: -1 });

        if (latestLocation) {
          // Update the employee's latest location in EmployeeLocation collection
          await EmployeeLocation.findOneAndUpdate(
            { employeeId: employee._id },
            {
              $set: {
                latitude: latestLocation.latitude,
                longitude: latestLocation.longitude,
                address: latestLocation.address,
                lastSeen: new Date(),
                isInGeoFence: latestLocation.isInGeoFence,
                status: latestLocation.status,
                lastCronUpdate: new Date()
              }
            },
            { upsert: true }
          );

          updatedCount++;
        } else {
          noLocationCount++;
        }
      } catch (employeeError) {
      }
    }

  } catch (error) {
  }
}

// Run every 10 minutes - Update step-in user live locations for people who haven't stepped out
export const updateStepInUserLocations = async () => {

  try {
    // Find all active attendance records (step-in but no step-out)
    const activeAttendances = await Attendance.find({
      stepOut: null,
      stepIn: { $exists: true }
    }).populate('employeeId', 'name empCode isWorking');


    for (const attendance of activeAttendances) {
      try {
        // Get the latest location for this employee
        const latestLocation = await EmployeeLocation.findOne({
          employeeId: attendance.employeeId._id
        }).sort({ lastSeen: -1 });

        if (latestLocation) {
          // Update the attendance record with latest location info
          attendance.lastKnownLocation = {
            latitude: latestLocation.latitude,
            longitude: latestLocation.longitude,
            address: latestLocation.address,
            lastSeen: latestLocation.lastSeen,
            isInGeoFence: latestLocation.isInGeoFence,
            status: latestLocation.status
          };

          // Update last location timestamp
          attendance.lastLocationUpdate = new Date();
          
          await attendance.save();

        } else {
        }
      } catch (employeeError) {
      }
    }

  } catch (error) {
  }
}
