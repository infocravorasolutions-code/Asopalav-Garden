import React from 'react'
import { AuthProvider } from './AuthContext'
import { EmployeeProvider } from './EmployeeContext'
import { DashboardProvider } from './DashboardContext'
import { ManagerProvider } from './ManagerContext'
import { AttendanceProvider } from './AttendanceContext'
import { ManagerEmployeeProvider } from './ManagerEmployeeContext'
import { ManagerAttendanceProvider } from './ManagerAttendanceContext'
import { NotificationProvider } from './NotificationContext'

const MainContext = ({children}) => {
  return (
   <AuthProvider>
    <NotificationProvider>
      <EmployeeProvider>
        <DashboardProvider>
          <ManagerProvider>
            <AttendanceProvider>
              <ManagerEmployeeProvider>
                <ManagerAttendanceProvider>
                  {children}
                </ManagerAttendanceProvider>
              </ManagerEmployeeProvider>
            </AttendanceProvider>
          </ManagerProvider>
        </DashboardProvider>
      </EmployeeProvider>
    </NotificationProvider>
   </AuthProvider>
  )
}

export default MainContext