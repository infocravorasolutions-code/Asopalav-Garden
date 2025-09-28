import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import EmployeeLocation from '../models/employeeLocation.models.js';
import Employee from '../models/employee.models.js';

let io;
let socketHealthCheckInterval;

/**
 * Initialize Socket.IO server with authentication and real-time location tracking
 * @param {http.Server} server - HTTP server instance
 * @returns {Socket.IO Server} - Initialized Socket.IO server
 */
export const initializeSocket = (server) => {
  console.log('🔌 [Socket] Initializing Socket.IO server...');

  io = new Server(server, {
    cors: {
      origin: [
        process.env.FRONTEND_URL || "http://localhost:3000",
        "https://panthersecure.co.in",
        "https://www.panthersecure.co.in",
        "https://admin.panthersecure.co.in",
        "http://localhost:3000"
      ],
      methods: ["GET", "POST"],
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // No authentication middleware - open connection for all users

  // Connection handler
  io.on('connection', (socket) => {
    console.log('🔌 [Socket] User connected:', {
      socketId: socket.id,
      timestamp: new Date()
    });

    // Join all users to a general room for location updates
    socket.join('location-updates');
    console.log('📍 [Socket] User joined location-updates room');
    
    // Send current online employees to newly connected user
    sendOnlineEmployeesToAdmin();

    // Handle location updates from employees
    socket.on('location-update', async (data) => {
      try {
        if (socket.userType !== 'employee') {
          socket.emit('error', { message: 'Only employees can send location updates' });
          return;
        }

        console.log('📍 [Socket] Location update received:', {
          employeeId: socket.userId,
          location: data.location,
          timestamp: data.timestamp
        });

        // Validate location data
        if (!data.latitude || !data.longitude) {
          socket.emit('error', { message: 'Invalid location data' });
          return;
        }

        // Broadcast to admin room
        socket.to('admin-room').emit('employee-location-update', {
          employeeId: socket.userId,
          employeeName: socket.userName,
          location: {
            latitude: data.latitude,
            longitude: data.longitude,
            address: data.address || 'Location not available'
          },
          status: data.status || 'tracking',
          batteryLevel: data.batteryLevel,
          accuracy: data.accuracy,
          timestamp: new Date()
        });

        // Broadcast to manager room
        socket.to('manager-room').emit('employee-location-update', {
          employeeId: socket.userId,
          employeeName: socket.userName,
          location: {
            latitude: data.latitude,
            longitude: data.longitude,
            address: data.address || 'Location not available'
          },
          status: data.status || 'tracking',
          timestamp: new Date()
        });

        // Acknowledge receipt
        socket.emit('location-update-ack', {
          success: true,
          timestamp: new Date()
        });

      } catch (error) {
        console.error('❌ [Socket] Error handling location update:', error);
        socket.emit('error', { 
          message: 'Failed to process location update',
          error: error.message 
        });
      }
    });

    // Handle employee going offline
    socket.on('employee-offline', async (data) => {
      try {
        if (socket.userType !== 'employee') {
          return;
        }

        console.log('📴 [Socket] Employee going offline:', socket.userId);

        await markEmployeeOffline(socket.userId);

        // Broadcast to admin and manager rooms
        socket.to('admin-room').emit('employee-offline', {
          employeeId: socket.userId,
          employeeName: socket.userName,
          timestamp: new Date()
        });

        socket.to('manager-room').emit('employee-offline', {
          employeeId: socket.userId,
          employeeName: socket.userName,
          timestamp: new Date()
        });

      } catch (error) {
        console.error('❌ [Socket] Error handling employee offline:', error);
      }
    });

    // Handle admin requesting online employees
    socket.on('get-online-employees', async () => {
      try {
        if (socket.role !== 'admin' && socket.userType !== 'admin') {
          socket.emit('error', { message: 'Unauthorized access' });
          return;
        }

        console.log('📊 [Socket] Admin requesting online employees');
        await sendOnlineEmployeesToSocket(socket);

      } catch (error) {
        console.error('❌ [Socket] Error getting online employees:', error);
        socket.emit('error', { 
          message: 'Failed to get online employees',
          error: error.message 
        });
      }
    });


    // Handle disconnection
    socket.on('disconnect', async (reason) => {
      console.log('🔌 [Socket] User disconnected:', {
        userId: socket.userId,
        userType: socket.userType,
        reason: reason
      });

      if (socket.userType === 'employee') {
        try {
          await markEmployeeOffline(socket.userId);

          // Broadcast offline status
          socket.to('admin-room').emit('employee-offline', {
            employeeId: socket.userId,
            employeeName: socket.userName,
            reason: 'disconnected',
            timestamp: new Date()
          });

          socket.to('manager-room').emit('employee-offline', {
            employeeId: socket.userId,
            employeeName: socket.userName,
            reason: 'disconnected',
            timestamp: new Date()
          });

        } catch (error) {
          console.error('❌ [Socket] Error marking employee offline on disconnect:', error);
        }
      }
    });

    // Handle connection errors
    socket.on('connect_error', (error) => {
      console.error('❌ [Socket] Connection error:', error);
    });

    // Send welcome message
    socket.emit('connected', {
      success: true,
      message: 'Connected to real-time location tracking',
      userId: socket.userId,
      userType: socket.userType,
      timestamp: new Date()
    });
  });

  console.log('✅ [Socket] Socket.IO server initialized successfully');
  return io;
};

/**
 * Send online employees data to all connected admins
 */
export const sendOnlineEmployeesToAdmin = async () => {
  try {
    const onlineEmployees = await EmployeeLocation.findOnline();

    const employeesWithLocations = onlineEmployees.map(emp => ({
      _id: emp._id,
      employeeId: emp.employeeId._id,
      employeeName: emp.employeeName,
      employeeCode: emp.employeeCode,
      designation: emp.employeeId.designation,
      email: emp.employeeId.email,
      location: {
        latitude: emp.latitude,
        longitude: emp.longitude,
        address: emp.address
      },
      isOnline: emp.isOnline,
      lastSeen: emp.lastSeen,
      status: emp.getCurrentStatus(),
      batteryLevel: emp.batteryLevel,
      accuracy: emp.accuracy,
      timestamp: emp.timestamp,
    }));

    if (io) {
      io.to('admin-room').emit('online-employees', {
        employees: employeesWithLocations,
        count: employeesWithLocations.length,
        timestamp: new Date()
      });

      console.log(`📊 [Socket] Sent ${employeesWithLocations.length} online employees to admin room`);
    }

  } catch (error) {
    console.error('❌ [Socket] Error sending online employees:', error);
  }
};

/**
 * Send online employees data to a specific socket
 */
export const sendOnlineEmployeesToSocket = async (socket) => {
  try {
    const onlineEmployees = await EmployeeLocation.findOnline();

    const employeesWithLocations = onlineEmployees.map(emp => ({
      _id: emp._id,
      employeeId: emp.employeeId._id,
      employeeName: emp.employeeName,
      employeeCode: emp.employeeCode,
      designation: emp.employeeId.designation,
      location: {
        latitude: emp.latitude,
        longitude: emp.longitude,
        address: emp.address
      },
      isOnline: emp.isOnline,
      lastSeen: emp.lastSeen,
      status: emp.getCurrentStatus(),
      batteryLevel: emp.batteryLevel,
      accuracy: emp.accuracy,
      timestamp: emp.timestamp
    }));

    socket.emit('online-employees', {
      employees: employeesWithLocations,
      count: employeesWithLocations.length,
      timestamp: new Date()
    });

  } catch (error) {
    console.error('❌ [Socket] Error sending online employees to socket:', error);
  }
};

/**
 * Broadcast location update to admin and manager rooms
 */
export const broadcastLocationUpdate = (employeeId, locationData) => {
  if (io) {
    io.to('admin-room').emit('employee-location-update', {
      employeeId,
      ...locationData,
      timestamp: new Date()
    });

    io.to('manager-room').emit('employee-location-update', {
      employeeId,
      ...locationData,
      timestamp: new Date()
    });

    console.log('📡 [Socket] Broadcasted location update for employee:', employeeId);
  }
};


/**
 * Mark employee as online in database
 */
const markEmployeeOnline = async (employeeId) => {
  try {
    const employee = await Employee.findById(employeeId);
    if (!employee) return;

    await EmployeeLocation.findOneAndUpdate(
      { employeeId },
      {
        employeeId,
        employeeName: employee.name,
        employeeCode: employee.empCode,
        isOnline: true,
        lastSeen: new Date(),
        status: 'tracking'
      },
      { upsert: true }
    );

    console.log('✅ [Socket] Marked employee as online:', employee.empCode);

  } catch (error) {
    console.error('❌ [Socket] Error marking employee online:', error);
  }
};

/**
 * Mark employee as offline in database
 */
const markEmployeeOffline = async (employeeId) => {
  try {
    await EmployeeLocation.findOneAndUpdate(
      { employeeId },
      { 
        isOnline: false, 
        status: 'offline',
        lastSeen: new Date()
      }
    );

    console.log('📴 [Socket] Marked employee as offline:', employeeId);

  } catch (error) {
    console.error('❌ [Socket] Error marking employee offline:', error);
  }
};

/**
 * Get current socket server instance
 */
export const getSocketServer = () => {
  return io;
};

/**
 * Send message to specific user
 */
export const sendToUser = (userId, event, data) => {
  if (io) {
    io.to(`employee-${userId}`).emit(event, data);
  }
};

/**
 * Send message to all admins
 */
export const sendToAdmins = (event, data) => {
  if (io) {
    io.to('admin-room').emit(event, data);
  }
};

/**
 * Send message to all managers
 */
export const sendToManagers = (event, data) => {
  if (io) {
    io.to('manager-room').emit(event, data);
  }
};

/**
     * Socket Health Check - Runs every 10 minutes
 */
export const startSocketHealthCheck = () => {
  console.log('🏥 [Socket Health] Starting socket health check every 10 minutes...');
  
  socketHealthCheckInterval = setInterval(() => {
    try {
      if (!io) {
        console.log('❌ [Socket Health] Socket server not initialized');
        return;
      }

      const connectedClients = io.sockets.sockets.size;
      const adminRoomSize = io.sockets.adapter.rooms.get('admin-room')?.size || 0;
      const managerRoomSize = io.sockets.adapter.rooms.get('manager-room')?.size || 0;
      const locationUpdatesRoomSize = io.sockets.adapter.rooms.get('location-updates')?.size || 0;

      const healthStatus = {
        timestamp: new Date().toISOString(),
        status: 'healthy',
        connectedClients: connectedClients,
        rooms: {
          admin: adminRoomSize,
          manager: managerRoomSize,
          locationUpdates: locationUpdatesRoomSize
        },
        serverUptime: process.uptime(),
        memoryUsage: process.memoryUsage()
      };

      // Emit health status to all connected clients
      io.emit('socket-health-status', healthStatus);

      // Log health status
      console.log('🏥 [Socket Health] Status:', {
        connected: connectedClients,
        admin: adminRoomSize,
        manager: managerRoomSize,
        locationUpdates: locationUpdatesRoomSize,
        uptime: `${Math.round(process.uptime())}s`
      });

      // Check for potential issues
      if (connectedClients === 0) {
        console.log('⚠️ [Socket Health] No clients connected');
      }

      if (process.memoryUsage().heapUsed > 100 * 1024 * 1024) { // 100MB
        console.log('⚠️ [Socket Health] High memory usage detected');
      }

    } catch (error) {
      console.error('❌ [Socket Health] Health check failed:', error);
    }
  }, 600000); // Every 10 minutes (10 * 60 * 1000)

  console.log('✅ [Socket Health] Health check started');
};

/**
 * Stop socket health check
 */
export const stopSocketHealthCheck = () => {
  if (socketHealthCheckInterval) {
    clearInterval(socketHealthCheckInterval);
    socketHealthCheckInterval = null;
    console.log('🛑 [Socket Health] Health check stopped');
  }
};

export { io };

export default {
  initializeSocket,
  sendOnlineEmployeesToAdmin,
  sendOnlineEmployeesToSocket,
  broadcastLocationUpdate,
  getSocketServer,
  sendToUser,
  sendToAdmins,
  sendToManagers,
  startSocketHealthCheck,
  stopSocketHealthCheck
};
