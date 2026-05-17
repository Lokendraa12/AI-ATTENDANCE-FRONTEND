import { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import DashboardCard from "../components/DashboardCard";
import { Icon } from "@iconify/react";

function AdminDashboard() {
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [classes, setClasses] = useState([]);

  const today = new Date().toISOString().split("T")[0];

  const fetchDashboardData = async () => {
    try {
      const studentRes = await axios.get("https://ai-attendance-backend-42u1.onrender.com/api/students");
      const attendanceRes = await axios.get("https://ai-attendance-backend-42u1.onrender.com/api/attendance");

      setStudents(studentRes.data.students || []);
      setAttendance(attendanceRes.data.attendance || []);

      try {
        const classRes = await axios.get("https://ai-attendance-backend-42u1.onrender.com/api/classes");
        setClasses(classRes.data.classes || []);
      } catch (error) {
        setClasses([]);
      }
    } catch (error) {
      alert("Dashboard data not loaded");
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const todayAttendance = attendance.filter((item) => item.date === today);
  const presentToday = todayAttendance.length;
  const absentToday = Math.max(students.length - presentToday, 0);

  const validRollNumbers = students.map((student) => student.rollNo);

const validAttendance = attendance.filter((item) =>
  validRollNumbers.includes(item.rollNo)
);

  return (
    <div className="premium-layout">
      <Sidebar />

      <main className="premium-main">
        <div className="top-header">
          <div>
            <h1>Admin Dashboard</h1>
            <p>Smart AI attendance overview</p>
          </div>

          <div className="admin-profile">
            <span><Icon icon="solar:user-bold-duotone" width="24" height="24" /></span>
            <div>
              <h4>Admin</h4>
              <p>Online</p>
            </div>
          </div>
        </div>

        <div className="premium-card-grid">
          <DashboardCard title="Total Students" value={students.length} icon={<Icon icon="solar:users-group-rounded-bold-duotone" width="24" height="24" />} />
          <DashboardCard title="Present Today" value={presentToday} icon={<Icon icon="solar:check-circle-bold-duotone" width="24" height="24" />} />
          <DashboardCard title="Absent Today" value={absentToday} icon={<Icon icon="solar:close-circle-bold-duotone" width="24" height="24" />} />
          <DashboardCard title="Total Classes" value={classes.length || 6} icon={<svg xmlns="http://www.w3.org/2000/svg" width={128} height={128} viewBox="0 0 128 128"><path fill="#64878e" d="M14.38 54.6v41.75h98.9l-.27-41.75z"></path><path fill="#8ab1b7" d="M13.47 37.41h100.54V47.6H13.47z"></path><path fill="#eee" d="M11.24 34.49h104.68v2.92H11.24z"></path><path fill="#bcd2d3" d="M11.88 47.59h103.63v7H11.88zm-.08 48.76h103.98c1.25 0 2.26 1.01 2.26 2.26v3.8H9.54v-3.8c0-1.24 1.01-2.26 2.26-2.26m96.71-38.73V54.6H96.95v3.02h2.07l-1.18 38.73h10.67l-1.63-38.73zm-53.77 0h1.86V54.6H45.03v3.02h1.85l-1.41 38.73h10.68zm-25.96 0h1.86V54.6H19.07v3.02h1.86l-1.41 38.73h10.67zm53.78-3.02H70.98v1.09h.01v1.93h1.85l-1.41 38.73h10.68L80.7 57.62h1.85v-1.93h.01zM8.06 32.93L62.72 6.91c.54-.26 1.18-.26 1.72 0l54.66 26.02v4.63H8.06z"></path><path fill="#8ab1b7" d="M63.15 15.52L38.49 27.29c-.78.37-.51 1.54.35 1.54h49.08c.86 0 1.13-1.16.35-1.54L63.85 15.52c-.22-.1-.47-.1-.7 0M8.03 101.96h111.74c1.22 0 2.22.99 2.22 2.22v4.8H5.81v-4.8c0-1.22.99-2.22 2.22-2.22"></path><path fill="#bcd2d3" d="M5.3 108.99h117.2c1.05 0 1.9.85 1.9 1.9v10.67H3.39v-10.67c0-1.05.86-1.9 1.91-1.9"></path></svg>} />
        </div>

        <div className="dashboard-content-grid">
          <div className="premium-table-box">
            <h2>Recent Attendance</h2>

            <table>
              <thead>
                <tr>
                  <th>Roll No</th>
                  <th>Name</th>
                  <th>Course</th>
                  <th>Time</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
               {validAttendance.slice(0, 6).map((item) => (
                  <tr key={item._id}>
                    <td>{item.rollNo}</td>
                    <td>{item.studentName}</td>
                    <td>{item.course}</td>
                    <td>{item.time}</td>
                    <td>
                      <span className="status-present">
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {validAttendance.length === 0 && (
              <p className="empty-text">No attendance found.</p>
            )}
            
          </div>

          <div className="ai-box">
            <h2>AI System Status</h2>
            <div className="ai-circle">
              <span> <Icon
                icon="mdi:face-recognition"
                width="80"
                height="80"
                color="white"
              /></span>
            </div>
            <p>Face Recognition Active</p>
            <small>System is ready to scan and mark attendance.</small>
          </div>
        </div>
      </main>
    </div>
  );
}

export default AdminDashboard;