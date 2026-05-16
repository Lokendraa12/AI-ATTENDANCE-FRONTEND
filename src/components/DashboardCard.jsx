function DashboardCard({ title, value, icon }) {
  return (
    <div className="premium-card">
      <div className="card-info">
        <p>{title}</p>
        <h3>{value}</h3>
      </div>

      <div className="card-icon">{icon}</div>
    </div>
  );
}

export default DashboardCard;