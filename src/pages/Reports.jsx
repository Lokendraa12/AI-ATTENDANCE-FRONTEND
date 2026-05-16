import { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";

function Reports() {
  const [students, setStudents] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);

  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");

  const fetchData = async () => {
    try {
      const studentRes = await axios.get("https://ai-attendance-backend-42u1.onrender.com/api/students");
      const attendanceRes = await axios.get("https://ai-attendance-backend-42u1.onrender.com/api/attendance");

      setStudents(studentRes.data.students);
      setAttendanceData(attendanceRes.data.attendance);
    } catch (error) {
      alert("Report data not loaded");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const reportData = students.map((student) => {
    const attendance = attendanceData.find(
      (item) =>
        item.rollNo === student.rollNo &&
        item.date === selectedDate
    );

    return {
      _id: student._id,
      rollNo: student.rollNo,
      studentName: student.name,
      course: student.course,
      semester: student.semester,
      section: student.section,
      date: selectedDate,
      time: attendance ? attendance.time : "-",
      status: attendance ? "Present" : "Absent",
    };
  });

  const filteredData = reportData.filter((student) => {
    const matchSearch =
      student.rollNo.toLowerCase().includes(search.toLowerCase()) ||
      student.studentName.toLowerCase().includes(search.toLowerCase());

    const matchCourse = selectedCourse
      ? student.course === selectedCourse
      : true;

    const matchSemester = selectedSemester
      ? student.semester === selectedSemester
      : true;

    return matchSearch && matchCourse && matchSemester;
  });

  return (
  <div className="premium-layout">
    <Sidebar />

    <main className="premium-main">
      <div className="top-header">
        <div>
          <h1>Attendance Reports</h1>
          <p>Course wise all students attendance report</p>
        </div>
      </div>

      <div className="report-stats-grid">
        <div className="report-stat-card">
          <p>Total Students</p>
          <h3>{filteredData.length}</h3>
        </div>

        <div className="report-stat-card">
          <p>Present</p>
          <h3>{filteredData.filter((s) => s.status === "Present").length}</h3>
        </div>

        <div className="report-stat-card">
          <p>Absent</p>
          <h3>{filteredData.filter((s) => s.status === "Absent").length}</h3>
        </div>
      </div>

      <div className="premium-report-filter">
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        />

        <select
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(e.target.value)}
        >
          <option value="">All Courses</option>
          <option value="MCA">MCA</option>
          <option value="BCA">BCA</option>
          <option value="IMCA">IMCA</option>
        </select>

        <select
          value={selectedSemester}
          onChange={(e) => setSelectedSemester(e.target.value)}
        >
          <option value="">All Semesters</option>
          <option value="1">1st Semester</option>
          <option value="2">2nd Semester</option>
          <option value="3">3rd Semester</option>
          <option value="4">4th Semester</option>
          <option value="5">5th Semester</option>
          <option value="6">6th Semester</option>
          <option value="7">7th Semester</option>
          <option value="8">8th Semester</option>
        </select>

        <input
          type="text"
          placeholder="Search by roll no or name"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <button onClick={() => window.print()}>Export PDF</button>

        <button onClick={() => alert("Excel export add later")}>
          Export Excel
        </button>
      </div>

      <div className="premium-table-box">
        <h2>Attendance List</h2>

        <table>
          <thead>
            <tr>
              <th>Roll No</th>
              <th>Student Name</th>
              <th>Course</th>
              <th>Semester</th>
              <th>Section</th>
              <th>Date</th>
              <th>Time</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {filteredData.map((student) => (
              <tr key={student._id}>
                <td>{student.rollNo}</td>
                <td>{student.studentName}</td>
                <td>{student.course}</td>
                <td>{student.semester}</td>
                <td>{student.section}</td>
                <td>{student.date}</td>
                <td>{student.time}</td>
                <td>
                  <span
                    className={
                      student.status === "Present"
                        ? "status-present"
                        : "status-absent"
                    }
                  >
                    {student.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredData.length === 0 && (
          <p className="empty-text">No students found.</p>
        )}
      </div>
    </main>
  </div>
);
}

export default Reports;