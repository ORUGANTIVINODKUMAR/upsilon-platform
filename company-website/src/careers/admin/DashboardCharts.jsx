import "./DashboardCharts.css";
const statusColors = [
  "#d9aa47",
  "#2563eb",
  "#7c3aed",
  "#15803d",
  "#c24141",
];

const monthNames = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function DashboardCharts({ charts }) {
  const statusData =
    charts?.statusData || [];

  const departmentData =
    charts?.departmentData || [];

  const monthlyData =
    charts?.monthlyData || [];

  const totalStatusApplications =
    statusData.reduce(
      (total, item) =>
        total + Number(item.count || 0),
      0
    );

  const maximumDepartmentCount =
    Math.max(
      ...departmentData.map(
        (item) => Number(item.count || 0)
      ),
      1
    );

  const maximumMonthlyCount =
    Math.max(
      ...monthlyData.map(
        (item) => Number(item.count || 0)
      ),
      1
    );

  const createDonutBackground = () => {
    if (totalStatusApplications === 0) {
      return "#eceef1";
    }

    let currentPercentage = 0;

    const sections = statusData.map(
      (item, index) => {
        const percentage =
          (Number(item.count || 0) /
            totalStatusApplications) *
          100;

        const start = currentPercentage;
        const end =
          currentPercentage + percentage;

        currentPercentage = end;

        return `${
          statusColors[
            index % statusColors.length
          ]
        } ${start}% ${end}%`;
      }
    );

    return `conic-gradient(${sections.join(
      ", "
    )})`;
  };

  return (
    <section className="careers-dashboard-charts">
      <article className="careers-dashboard-chart-card">
        <div className="careers-dashboard-chart-heading">
          <h2>Applicants by Status</h2>

          <p>
            Current candidate pipeline.
          </p>
        </div>

        {statusData.length === 0 ? (
          <div className="careers-dashboard-chart-empty">
            No application data available.
          </div>
        ) : (
          <div className="careers-status-chart-layout">
            <div
              className="careers-status-donut"
              style={{
                background:
                  createDonutBackground(),
              }}
            >
              <div>
                <strong>
                  {totalStatusApplications}
                </strong>

                <span>Applicants</span>
              </div>
            </div>

            <div className="careers-status-legend">
              {statusData.map(
                (item, index) => (
                  <div key={item._id}>
                    <span
                      style={{
                        background:
                          statusColors[
                            index %
                              statusColors.length
                          ],
                      }}
                    />

                    <p>{item._id}</p>

                    <strong>
                      {item.count}
                    </strong>
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </article>

      <article className="careers-dashboard-chart-card">
        <div className="careers-dashboard-chart-heading">
          <h2>Jobs by Department</h2>

          <p>
            Distribution of available positions.
          </p>
        </div>

        {departmentData.length === 0 ? (
          <div className="careers-dashboard-chart-empty">
            No department data available.
          </div>
        ) : (
          <div className="careers-department-chart">
            {departmentData
              .slice(0, 6)
              .map((item) => {
                const width =
                  (Number(item.count || 0) /
                    maximumDepartmentCount) *
                  100;

                return (
                  <div
                    key={item._id}
                    className="careers-department-row"
                  >
                    <div className="careers-department-label">
                      <span>
                        {item._id ||
                          "Unassigned"}
                      </span>

                      <strong>
                        {item.count}
                      </strong>
                    </div>

                    <div className="careers-department-track">
                      <div
                        style={{
                          width: `${width}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </article>

      <article className="careers-dashboard-chart-card careers-monthly-chart-card">
        <div className="careers-dashboard-chart-heading">
          <h2>Monthly Applications</h2>

          <p>
            Candidate applications received over time.
          </p>
        </div>

        {monthlyData.length === 0 ? (
          <div className="careers-dashboard-chart-empty">
            No monthly application data available.
          </div>
        ) : (
          <div className="careers-monthly-chart">
            {monthlyData
              .slice(-12)
              .map((item) => {
                const height =
                  (Number(item.count || 0) /
                    maximumMonthlyCount) *
                  100;

                const monthIndex =
                  Number(item._id?.month || 1) -
                  1;

                return (
                  <div
                    key={`${item._id?.year}-${item._id?.month}`}
                    className="careers-monthly-column"
                  >
                    <span>
                      {item.count}
                    </span>

                    <div className="careers-monthly-bar-track">
                      <div
                        style={{
                          height: `${Math.max(
                            height,
                            6
                          )}%`,
                        }}
                      />
                    </div>

                    <small>
                      {
                        monthNames[
                          monthIndex
                        ]
                      }
                    </small>
                  </div>
                );
              })}
          </div>
        )}
      </article>
    </section>
  );
}

export default DashboardCharts;