import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import Sidebar from "../components/Sidebar";

function StudentDashboard() {
  const { id } = useParams();

  const [student, setStudent] = useState(null);
  const [history, setHistory] = useState([]);

  const fetchStudentDashboard = async () => {
    try {
      const studentRes = await axios.get("https://ai-attendance-backend-42u1.onrender.com/api/students");
      const attendanceRes = await axios.get("https://ai-attendance-backend-42u1.onrender.com/api/attendance");

      const selectedStudent = studentRes.data.students.find(
        (item) => item._id === id
      );

      if (!selectedStudent) {
        alert("Student not found");
        return;
      }

      const studentAttendance = attendanceRes.data.attendance.filter(
        (item) => item.rollNo === selectedStudent.rollNo
      );

      setStudent(selectedStudent);
      setHistory(studentAttendance);
    } catch (error) {
      alert("Student dashboard data not loaded");
    }
  };

  useEffect(() => {
    fetchStudentDashboard();
  }, [id]);

  if (!student) {
    return <h2 style={{ padding: "40px" }}>Loading...</h2>;
  }

  const totalClasses = 60;
  const presentClasses = history.length;
  const attendancePercentage = Math.round((presentClasses / totalClasses) * 100);

  return (
    <div className="premium-layout">
      <Sidebar />

      <main className="premium-main">
        <div className="top-header">
          <div>
            <h1>Student Dashboard</h1>
            <p>Student profile and attendance history</p>
          </div>
        </div>

        <div className="student-card">
          <div className="profile-box">
            {student.faceImage ? (
              <img
                src={`https://ai-attendance-backend-42u1.onrender.com${student.faceImage}`}
                alt={student.name}
                className="student-profile-img"
              />
            ) : (
              <div className="avatar">{student.name.slice(0, 2).toUpperCase()}</div>
            )}

            <div>
              <h2>{student.name}</h2>
              <p>Roll No: {student.rollNo}</p>
              <p>Course: {student.course}</p>
              <p>Semester: {student.semester}</p>
              <p>Section: {student.section}</p>
              <p>Email: {student.email}</p>
            </div>
          </div>

          <div className="attendance-percent">
            <h3>Attendance Percentage</h3>
            <div
              className="percent-circle"
              style={{
                background: `conic-gradient(
                
      #22c55e ${attendancePercentage * 3.6}deg,
      #e2e8f0 ${attendancePercentage * 3.6}deg
    )`,
              }}
            >
              <div className="percent-inner">
                {attendancePercentage}%
              </div>
            </div>
            <p>Present Classes: {presentClasses} / {totalClasses}</p>
          </div>

          <div className="student-history">
            <h3>Attendance History</h3>

            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {history.map((item) => (
                  <tr key={item._id}>
                    <td>{item.date}</td>
                    <td>{item.time}</td>
                    <td>
                      <span className="status-present">{item.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {history.length === 0 && (
              <p className="empty-text">No attendance history found.</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default StudentDashboard;