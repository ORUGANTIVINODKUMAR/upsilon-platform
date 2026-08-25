import "./StatsBar.css";

function StatsBar() {
  const stats = [
    {
      value: "$1,800",
      title: "starting monthly",
      subtitle: "Admin support",
    },
    {
      value: "8 mo",
      title: "minimum term",
      subtitle: "vs. 12 months",
    },
    {
      value: "35-55%",
      title: "estimated savings",
      subtitle: "vs. local hires",
    },
    {
      value: "2 models",
      title: "task or dedicated",
      subtitle: "flexible fit",
    },
  ];

  return (
    <section className="stats-section">
      <div className="stats-container">
        {stats.map((item, index) => (
          <div className="stat-card" key={index}>
            <h3>{item.value}</h3>
            <h4>{item.title}</h4>
            <p>{item.subtitle}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default StatsBar;