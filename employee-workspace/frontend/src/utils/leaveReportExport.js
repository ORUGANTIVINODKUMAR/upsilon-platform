const summaryRows = (report) => report.summary.map((row) => ({
  Employee: row.employeeName, "Employee ID": row.employeeId, Team: row.team, Department: row.department,
  "Total Leave Days": row.totalDays, "Paid Days": row.paidDays, "LOP Days": row.lopDays,
  "Unallocated Days": row.unallocatedDays, "Half-day Count": row.halfDayCount, "Half-day Days": row.halfDayDays,
  "Approved Request Count": row.approvedCount, "Approved Days": row.approvedDays,
}));

const detailRows = (report) => report.records.map((row) => ({
  Employee: row.employeeName, Department: row.department, "Leave Type": row.leaveType,
  "Start Date": row.start, "End Date": row.end, Status: row.status, View: report.filterType,
  "Employee ID": row.employeeId, Team: row.team, Source: row.sourceType,
  "Days in Period": row.totalDays, "Paid Days": row.paidDays, "LOP Days": row.lopDays,
  "Unallocated Days": row.unallocatedDays, "Half-day Count": row.halfDayCount,
  "Half-day Days": row.halfDayDays, "Approved Days": row.approvedDays,
}));

export async function createLeaveReportWorkbook(report) {
  const XLSX = await import("xlsx");
  const workbook = XLSX.utils.book_new();
  const append = (name, rows, header) => {
    const sheet = XLSX.utils.json_to_sheet(rows, { header });
    sheet["!cols"] = header.map((field) => ({ wch: /Employee|Department|Team|Status|Type/.test(field) ? 26 : 19 }));
    if (rows.length) sheet["!autofilter"] = { ref: sheet["!ref"] };
    XLSX.utils.book_append_sheet(workbook, sheet, name);
  };
  append("Leave Calendar", detailRows(report), ["Employee", "Department", "Leave Type", "Start Date", "End Date", "Status", "View", "Employee ID", "Team", "Source", "Days in Period", "Paid Days", "LOP Days", "Unallocated Days", "Half-day Count", "Half-day Days", "Approved Days"]);
  append("Employee Summary", summaryRows(report), ["Employee", "Employee ID", "Team", "Department", "Total Leave Days", "Paid Days", "LOP Days", "Unallocated Days", "Half-day Count", "Half-day Days", "Approved Request Count", "Approved Days"]);
  append("Report Information", [
    { Field: "Title", Value: report.title }, { Field: "From", Value: report.startDate }, { Field: "To", Value: report.endDate },
    { Field: "Generated (UTC)", Value: report.generatedAt }, ...report.notes.map((note) => ({ Field: "Calculation note", Value: note })),
  ], ["Field", "Value"]);
  return { workbook, XLSX };
}

const text = (value) => String(value ?? "").replace(/[\u2010-\u2015]/g, "-");

export async function createLeaveReportPdf(report) {
  const [{ jsPDF }, { autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4", compress: true });
  doc.setProperties({ title: report.title, subject: `${report.startDate} to ${report.endDate}` });
  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();
  const margin = 12;
  const common = {
    theme: "striped", margin: { top: 34, right: margin, bottom: 16, left: margin },
    tableWidth: width - 2 * margin, showHead: "everyPage", rowPageBreak: "avoid",
    styles: { fontSize: 8, cellPadding: 2.3, overflow: "linebreak", valign: "top", textColor: [35, 55, 48] },
    headStyles: { fillColor: [27, 80, 63], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [242, 247, 244] },
  };
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Employee-wise leave summary", margin, 39);
  autoTable(doc, { ...common, startY: 43,
    head: [["Employee", "Team / Department", "Total days", "Paid days", "LOP days", "Unallocated", "Half count / days", "Approved count / days"]],
    body: report.summary.length ? report.summary.map((row) => [
      text(`${row.employeeName}\n${row.employeeId}`), text([row.team, row.department].filter(Boolean).join(" / ")),
      row.totalDays, row.paidDays, row.lopDays, row.unallocatedDays, `${row.halfDayCount} / ${row.halfDayDays}`, `${row.approvedCount} / ${row.approvedDays}`,
    ]) : [[{ content: "No leave records in this period.", colSpan: 8 }]],
    columnStyles: { 0: { cellWidth: 46 }, 1: { cellWidth: 52 }, 2: { cellWidth: 23 }, 3: { cellWidth: 22 }, 4: { cellWidth: 22 }, 5: { cellWidth: 28 }, 6: { cellWidth: 35 }, 7: { cellWidth: 45 } },
  });
  let y = doc.lastAutoTable.finalY + 10;
  // Start non-empty details on their own page so the section heading and table
  // header can never be stranded below the summary without a complete row.
  if (report.records.length || y > height - 45) { doc.addPage(); y = 39; }
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Detailed leave records", margin, y);
  autoTable(doc, { ...common, startY: y + 4,
    head: [["Employee / Department", "Leave type / Source", "Request dates", "Status", "Total days", "Paid", "LOP", "Unallocated", "Half-day days"]],
    body: report.records.length ? report.records.map((row) => [
      text([row.employeeName, row.employeeId, row.department, row.team].filter(Boolean).join("\n")),
      text(`${row.leaveType}\n${row.sourceType}`), `${row.start}\nto ${row.end}`, text(row.status),
      row.totalDays, row.paidDays, row.lopDays, row.unallocatedDays, row.halfDayDays,
    ]) : [[{ content: "No leave records in this period.", colSpan: 9 }]],
    columnStyles: { 0: { cellWidth: 51 }, 1: { cellWidth: 38 }, 2: { cellWidth: 32 }, 3: { cellWidth: 40 }, 4: { cellWidth: 22 }, 5: { cellWidth: 18 }, 6: { cellWidth: 18 }, 7: { cellWidth: 27 }, 8: { cellWidth: 27 } },
  });
  y = doc.lastAutoTable.finalY + 10;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  for (const note of report.notes) {
    const lines = doc.splitTextToSize(text(note), width - 2 * margin);
    const needed = lines.length * 4 + 3;
    if (y + needed > height - 17) { doc.addPage(); y = 37; }
    doc.text(lines, margin, y);
    y += needed;
  }
  const totalPages = doc.getNumberOfPages();
  for (let page = 1; page <= totalPages; page += 1) {
    doc.setPage(page);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(27, 80, 63);
    doc.text(text(report.title), margin, 15);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(65, 80, 72);
    doc.text(`${report.startDate} to ${report.endDate} | ${report.filterType}`, margin, 22);
    doc.text(`Generated (UTC): ${report.generatedAt.replace("T", " ").slice(0, 19)}`, margin, 28);
    doc.setDrawColor(207, 220, 214);
    doc.line(margin, height - 12, width - margin, height - 12);
    doc.setFontSize(8);
    doc.text("Employee leave report | Days are limited to the selected period", margin, height - 7);
    doc.text(`Page ${page} of ${totalPages}`, width - margin, height - 7, { align: "right" });
  }
  return doc;
}
