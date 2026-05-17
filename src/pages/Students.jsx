import { use, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Sidebar from "../components/Sidebar";


function Students() {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [course, setCourse] = useState("");
  const [semester, setSemester] = useState("");

  const fetchStudents = async () => {
    try {
      const res = await axios.get("https://ai-attendance-backend-42u1.onrender.com/api/students");
      setStudents(res.data.students);
    } catch (error) {
      alert("Students not loaded");
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const deleteStudent = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this student?");
    if (!confirmDelete) return;

    try {
      const res = await axios.delete(`https://ai-attendance-backend-42u1.onrender.com/api/students/${id}`);
      alert(res.data.message);
      setStudents((prev) => prev.filter((student) => student._id !== id));
    } catch (error) {
      alert("Student not deleted");
    }
  };

  const filteredStudents = students.filter((student) => {
    const matchSearch =
      student.rollNo.toLowerCase().includes(search.toLowerCase()) ||
      student.name.toLowerCase().includes(search.toLowerCase());

    const matchCourse = course ? student.course === course : true;
    const matchSemester = semester ? student.semester === semester : true;

    return matchSearch && matchCourse && matchSemester;
  });

 const navigate = useNavigate();


 return (
  <div className="premium-layout">
    <Sidebar />

    <main className="premium-main">
      <div className="top-header">
        <div>
          <h1>All Students</h1>
          <p>Filter students by course, semester and roll number</p>
        </div>

        <div className="student-count-card">
          <h3>{filteredStudents.length}</h3>
          <p>Total Students</p>
        </div>
      </div>

      <div className="premium-student-filter">
        <select value={course} onChange={(e) => setCourse(e.target.value)}>
          <option value="">All Courses</option>
          <option value="MCA">MCA</option>
          <option value="BCA">BCA</option>
          <option value="IMCA">IMCA</option>
        </select>

        <select value={semester} onChange={(e) => setSemester(e.target.value)}>
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

        <button
          onClick={() => {
            setSearch("");
            setCourse("");
            setSemester("");
          }}
        >
          Clear
        </button>
      </div>

      <div className="premium-table-box">
        <h2>Student List ({filteredStudents.length})</h2>

        <table>
          <thead>
            <tr>
              <th>Face</th>
              <th>Roll No</th>
              <th>Name</th>
              <th>Email</th>
              <th>Course</th>
              <th>Semester</th>
              <th>Section</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {filteredStudents.map((student) => (
              <tr key={student._id}>
                <td>
                  {student.faceImage ? (
                    <img
                      src={student.faceImage}
                      alt={student.name}
                      className="premium-student-face"
                      onClick={()=>navigate(`/student-dashboard/${student._id}`)}
                    />
                  ) : (
                    <div className="no-face">N/A</div>
                  )}
                </td>

                <td>{student.rollNo}</td>
                <td>
                  <strong>{student.name}</strong>
                </td>
                <td>{student.email}</td>
                <td>{student.course}</td>
                <td>{student.semester}</td>
                <td>{student.section}</td>

                <td>
                  <button
                    className="premium-delete-btn"
                    onClick={() => deleteStudent(student._id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredStudents.length === 0 && (
          <p className="empty-text">No students found.</p>
        )}
      </div>
    </main>
  </div>
);
}

export default Students;