import { useState } from "react";
import { Icon } from "@iconify/react";

function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();

    if (email === "admin@gmail.com" && password === "12345") {
      alert("Login Successful");

      localStorage.setItem("admin", true);

      window.location.href = "/admin-dashboard";
    } else {
      alert("Invalid Credentials");
    }
  };

  return (
    <div className="premium-login-page">

      <div className="premium-login-card">

        <div className="login-logo">
          <Icon
            icon="mdi:face-recognition"
            width="70"
            height="70"
          />
        </div>

        <h1>Admin Login</h1>

        <p>
          Smart AI Face Recognition Attendance System
        </p>

        <form onSubmit={handleLogin}>

          <div className="login-input-box">

            <Icon
              icon="solar:user-bold-duotone"
              width="22"
            />

            <input
              type="email"
              placeholder="Enter Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

          </div>

          <div className="login-input-box">

            <Icon
              icon="solar:lock-password-bold-duotone"
              width="22"
            />

            <input
              type="password"
              placeholder="Enter Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

          </div>

          <button type="submit" className="premium-login-btn">
            Login
          </button>

        </form>

        {/* <div className="demo-login">
          <p>Email: admin@gmail.com</p>
          <p>Password: 12345</p>
        </div> */}

      </div>
    </div>
  );
}

export default AdminLogin;