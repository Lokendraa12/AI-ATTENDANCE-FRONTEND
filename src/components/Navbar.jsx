import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav className="navbar">
      <div className="logo">Attendify AI</div>

      <div className="nav-links">
        <Link to="/">Home</Link>
        <a href="#features">Features</a>
        <a href="#working">How It Works</a>
        <a href="#about">About</a>
        <Link to="/admin-login" className="login-btn">
          Admin Login
        </Link>
      </div>
    </nav>
  );
}

export default Navbar;