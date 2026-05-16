import { useState } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";

function AddStudent() {
  const liveUrl = "https://ai-attendance-backend-42u1.onrender.com";
  // const apiUrl = liveUrl; // Change to localUrl for local development
  const [student, setStudent] = useState({
    name: "",
    rollNo: "",
    email: "",
    course: "",
    semester: "",
    section: "",
  });

  const [faceImage, setFaceImage] = useState(null);
  const [preview, setPreview] = useState("");

  const handleChange = (e) => {
    setStudent({
      ...student,
      [e.target.name]: e.target.value,
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];

    if (file) {
      setFaceImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const formData = new FormData();

      Object.keys(student).forEach((key) => {
        formData.append(key, student[key]);
      });

      formData.append("faceImage", faceImage);

      const res = await axios.post(
        `${liveUrl}/api/students/add`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      alert(res.data.message);

      setStudent({
        name: "",
        rollNo: "",
        email: "",
        course: "",
        semester: "",
        section: "",
      });

      setFaceImage(null);
      setPreview("");
    } catch (error) {
      alert(error.response?.data?.message || "Student not added");
    }
  };

  return (
    <div className="premium-layout">
      <Sidebar />

      <main className="premium-main">
        <div className="top-header">
          <div>
            <h1>Add Student</h1>
            <p>Register student with face image</p>
          </div>
        </div>

        <div className="premium-form-box">
          <form onSubmit={handleSubmit}>
            <div className="premium-form-grid">

              <div className="premium-input-group">
                <label>Student Name</label>
                <input
                  type="text"
                  name="name"
                  value={student.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="premium-input-group">
                <label>Roll Number</label>
                <input
                  type="text"
                  name="rollNo"
                  value={student.rollNo}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="premium-input-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={student.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="premium-input-group">
                <label>Course</label>

                <select
                  name="course"
                  value={student.course}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Course</option>
                  <option value="MCA">MCA</option>
                  <option value="BCA">BCA</option>
                  <option value="IMCA">IMCA</option>
                </select>
              </div>

              <div className="premium-input-group">
                <label>Semester</label>

                <select
                  name="semester"
                  value={student.semester}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Semester</option>
                  <option value="1">1st</option>
                  <option value="2">2nd</option>
                  <option value="3">3rd</option>
                  <option value="4">4th</option>
                  <option value="5">5th</option>
                  <option value="6">6th</option>
                  <option value="7">7th</option>
                  <option value="8">8th</option>
                    
                </select>
              </div>

              <div className="premium-input-group">
                <label>Section</label>

                <input
                  type="text"
                  name="section"
                  value={student.section}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="image-upload-box">
              <label>Upload Face Image</label>

              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                required
              />

              {preview && (
                <div className="preview-box">
                  <img src={preview} alt="preview" />
                </div>
              )}
            </div>

            <button type="submit" className="premium-submit-btn">
              Add Student
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

export default AddStudent;