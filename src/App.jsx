import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AddStudent from "./pages/AddStudent";
import FaceAttendance from "./pages/FaceAttendance";
import Reports from "./pages/Reports";
import StudentDashboard from "./pages/StudentDashboard";
import Students from "./pages/Students";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/admin-login" element={<AdminLogin />} />
      <Route path="/admin-dashboard" element={<AdminDashboard />} />
      <Route path="/add-student" element={<AddStudent />} />
      <Route path="/face-attendance" element={<FaceAttendance />} />
      <Route path="/reports" element={<Reports />} />
      <Route path="/student-dashboard" element={<StudentDashboard />} />
      <Route path="/student-dashboard/:id" element={<StudentDashboard />} /> 
      <Route path="/students" element={<Students />} /> 
    </Routes>
  );
}

export default App;