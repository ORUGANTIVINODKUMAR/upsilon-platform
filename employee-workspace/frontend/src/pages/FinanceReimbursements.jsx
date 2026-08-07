import { useEffect, useState } from "react";
import {
  Receipt,
  BadgeCheck,
  Wallet,
  Users,
  CheckCircle,
} from "lucide-react";

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import api from "../api/api";

const FinanceReimbursements = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);

  const RECORDS_PER_PAGE = 10;
  const safeRequests = requests || [];
  const filteredRequests = safeRequests.filter((item) => {
    const matchesFilter =
      activeFilter === "All"
        ? true
        : item.financeStatus === activeFilter;

    const search = searchTerm.toLowerCase();

    const matchesSearch =
      item.employeeId?.name?.toLowerCase().includes(search) ||
      item.employeeId?.email?.toLowerCase().includes(search) ||
      item.businessPurpose?.toLowerCase().includes(search);

    return matchesFilter && matchesSearch;
  });

  const totalPages =
    Math.ceil(filteredRequests.length / RECORDS_PER_PAGE) || 1;

  const startIndex =
    (currentPage - 1) * RECORDS_PER_PAGE;

  const paginatedRequests =
    filteredRequests.slice(
      startIndex,
      startIndex + RECORDS_PER_PAGE
    );
  const fetchRequests = async () => {
    try {
      const { data } = await api.get("/reimbursements/finance");
      setRequests(data.reimbursementRequests || []);
    } catch (error) {
      console.error(error.response?.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleMarkAsPaid = async (id) => {
    const confirmPayment = window.confirm(
      "Are you sure you want to mark this reimbursement as Paid?"
    );

    if (!confirmPayment) return;

    try {
      await api.put(`/reimbursements/mark-paid/${id}`);
      alert("Reimbursement marked as paid successfully.");
      fetchRequests();
    } catch (error) {
      alert(error.response?.data?.message || "Unable to mark as paid");
      console.error(error.response?.data);
    }
  };

  const pendingPaymentCount = safeRequests.filter(
    (item) => item.financeStatus === "Pending Payment"
  ).length;

  const paidCount = safeRequests.filter(
    (item) => item.financeStatus === "Paid"
  ).length;

  const totalAmount = safeRequests.reduce(
    (sum, item) => sum + Number(item.totalReimbursement || 0),
    0
  );
  const exportToExcel = () => {
    const exportData = safeRequests.map(
      (item) => ({
        Employee:
          item.employeeId?.name || "N/A",

        Email:
          item.employeeId?.email || "N/A",

        BusinessPurpose:
          item.businessPurpose,

        TotalAmount:
          item.totalReimbursement,

        FinalStatus: item.finalStatus,

        FinanceStatus:
          item.financeStatus,

        SubmittedDate: new Date(
          item.createdAt
        ).toLocaleDateString(),
      })
    );

    const worksheet =
      XLSX.utils.json_to_sheet(exportData);

    const workbook =
      XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Finance Reimbursements"
    );

    const excelBuffer = XLSX.write(
      workbook,
      {
        bookType: "xlsx",
        type: "array",
      }
    );

    const fileData = new Blob(
      [excelBuffer],
      {
        type:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
      }
    );

    saveAs(
      fileData,
      "Finance_Reimbursements.xlsx"
    );
  };
  if (loading) {
    return (
      <div className="modern-section-card">
        <p>Loading finance reimbursement records...</p>
      </div>
    );
  }

  return (
    <>
      <div className="section-header">
        <div>
          <h2 className="card-title">Finance Reimbursements</h2>
          <p className="section-subtitle">
            Approved reimbursement claims ready for payment processing.
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={exportToExcel}
        >
          Export Excel
        </button>
      </div>

      <div className="modern-stats-grid">
        <div className="mini-stat-card">
          <Users size={22} />
          <span>Total Claims</span>
          <h3>{safeRequests.length}</h3>
          <p>ready for finance</p>
        </div>

        <div className="mini-stat-card">
          <Receipt size={22} />
          <span>Pending Payment</span>
          <h3>{pendingPaymentCount}</h3>
          <p>to process</p>
        </div>

        <div className="mini-stat-card">
          <BadgeCheck size={22} />
          <span>Paid</span>
          <h3>{paidCount}</h3>
          <p>completed</p>
        </div>

        <div className="mini-stat-card">
          <Wallet size={22} />
          <span>Total Amount</span>
          <h3>₹ {totalAmount.toLocaleString("en-IN")}</h3>
          <p>approved value</p>
        </div>
      </div>
      <div style={{ marginBottom: "18px" }}>
        <input
          type="text"
          placeholder="Search employee, email or business purpose..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: "12px",
            border: "1px solid #d1d5db",
            fontSize: "14px",
          }}
        />
      </div>

      <div className="leave-filter-tabs">
        {["All", "Pending Payment", "Paid"].map((filter) => (
          <button
            key={filter}
            className={
              activeFilter === filter
                ? "active-filter"
                : ""
            }
            onClick={() => {
              setActiveFilter(filter);
              setCurrentPage(1);
            }}
          >
            {filter}
          </button>
        ))}
      </div>

      <div className="table-wrapper modern-table-wrapper">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Business Purpose</th>
              <th>Total Amount</th>
              <th>Receipt</th>
              <th>Final Approval</th>
              <th>Finance Status</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {paginatedRequests.map((request) => (
              <tr key={request._id}>
                <td>
                  <div className="user-cell">
                    <div className="avatar-circle">
                      {request.employeeId?.name?.charAt(0)?.toUpperCase()}
                    </div>

                    <div>
                      <strong>{request.employeeId?.name}</strong>
                      <p style={{ fontSize: "13px", color: "var(--muted)" }}>
                        {request.employeeId?.email}
                      </p>
                    </div>
                  </div>
                </td>

                <td>{request.businessPurpose}</td>

                <td>₹ {Number(
                  request.totalReimbursement || 0
                ).toLocaleString("en-IN")}</td>

                <td>
                  {request.receiptFiles?.length > 0 ? (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "6px",
                      }}
                    >
                      {request.receiptFiles.map((file, index) => (
                        <a
                          key={index}
                          href={file}
                          target="_blank"
                          rel="noreferrer"
                          className="file-link"
                        >
                          View Receipt {index + 1}
                        </a>
                      ))}
                    </div>
                  ) : (
                    "N/A"
                  )}
                </td>

                <td>
                  <span className="badge badge-success">
                    {request.finalStatus}
                  </span>
                </td>

                <td>
                  <span
                    className={
                      request.financeStatus === "Paid"
                        ? "badge badge-success"
                        : request.financeStatus === "Pending Payment"
                          ? "badge badge-pending"
                          : "badge badge-danger"
                    }
                  >
                    {request.financeStatus}
                  </span>
                </td>

                <td>
                  {request.financeStatus === "Paid" ? (
                    <span className="badge badge-success">Paid</span>
                  ) : (
                    <button
                      className="approve-btn"
                      type="button"
                      onClick={() => handleMarkAsPaid(request._id)}
                    >
                      <CheckCircle size={16} />
                      Mark as Paid
                    </button>
                  )}
                </td>
              </tr>
            ))}

            {safeRequests.length === 0 && (
              <tr>
                <td
                  colSpan="7"
                  style={{
                    textAlign: "center",
                    padding: "24px",
                  }}
                >
                  No approved reimbursement records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {filteredRequests.length > RECORDS_PER_PAGE && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "10px",
            marginTop: "24px",
            flexWrap: "wrap",
          }}
        >
          <button
            className="btn btn-primary"
            disabled={currentPage === 1}
            onClick={() =>
              setCurrentPage((prev) => prev - 1)
            }
          >
            Previous
          </button>

          {Array.from(
            { length: totalPages },
            (_, index) => (
              <button
                key={index + 1}
                className={
                  currentPage === index + 1
                    ? "btn btn-primary"
                    : "btn"
                }
                onClick={() =>
                  setCurrentPage(index + 1)
                }
              >
                {index + 1}
              </button>
            )
          )}

          <button
            className="btn btn-primary"
            disabled={currentPage === totalPages}
            onClick={() =>
              setCurrentPage((prev) => prev + 1)
            }
          >
            Next
          </button>
        </div>
      )}
    </>
  );
};

export default FinanceReimbursements;
