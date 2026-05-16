import { Link, useLocation } from "react-router-dom";
import { Icon } from "@iconify/react";

function Sidebar() {
  const location = useLocation();

  const menuItems = [
    { name: "Dashboard", path: "/admin-dashboard", icon: <Icon icon="solar:widget-5-bold-duotone" width="24" height="24" /> },
    { name: "Students", path: "/students", icon: <Icon icon="solar:users-group-rounded-bold-duotone" width="24" height="24" /> },
    { name: "Add Student", path: "/add-student", icon: <Icon icon="solar:add-circle-bold-duotone" width="24" height="24" /> },
    { name: "Face Attendance", path: "/face-attendance", icon: <Icon icon="solar:camera-bold-duotone" width="24" height="24" /> },
    { name: "Reports", path: "/reports", icon: <Icon icon="solar:file-text-bold-duotone" width="24" height="24" />   },
  ];

  return (
    <aside className="premium-sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">AI</div>
        <div>
          <h2>Attendify</h2>
          <p>Face Recognition</p>
        </div>
      </div>

      <ul className="sidebar-menu">
        {menuItems.map((item) => (
          <li key={item.path}>
            <Link
              to={item.path}
              className={location.pathname === item.path ? "active-menu" : ""}
            >
              <span>{item.icon}</span>
              {item.name}
            </Link>
          </li>
        ))}
      </ul>

      <Link to="/" className="logout-box">
        <Icon icon="solar:logout-2-bold-duotone" width="20" height="20" />
         Logout
      </Link>
    </aside>
  );
}

export default Sidebar;