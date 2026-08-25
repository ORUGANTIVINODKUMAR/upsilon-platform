export const EDITABLE_REIMBURSEMENT_STATUSES = ["Pending Final Approval"];
export const DELETABLE_REIMBURSEMENT_STATUSES = [
  "Pending Final Approval",
  "Rejected by Manager",
  "Rejected by HR",
];

const ownsRequest = (request, userId) =>
  request?.employeeId?.toString() === userId?.toString();

export const canEditOwnReimbursement = (request, userId) =>
  ownsRequest(request, userId) && EDITABLE_REIMBURSEMENT_STATUSES.includes(request.finalStatus);

export const canDeleteOwnReimbursement = (request, userId) =>
  ownsRequest(request, userId) && DELETABLE_REIMBURSEMENT_STATUSES.includes(request.finalStatus);

export const validateReimbursementInput = (
  input,
  { existingReceiptCount = 0, newReceiptCount = 0, now = new Date() } = {}
) => {
  let parsedItems;
  try {
    parsedItems = typeof input.items === "string" ? JSON.parse(input.items) : input.items;
  } catch {
    return { valid: false, message: "Expense items must be valid JSON" };
  }

  if (!Array.isArray(parsedItems) || parsedItems.length === 0) {
    return { valid: false, message: "At least one expense item is required" };
  }

  const items = parsedItems.map((item) => ({
    description: String(item?.description || "").trim(),
    category: String(item?.category || "").trim(),
    cost: Number(item?.cost),
  }));
  if (items.some((item) => !item.description || !item.category || !Number.isFinite(item.cost) || item.cost < 0)) {
    return { valid: false, message: "Each expense item requires a description, category, and valid non-negative cost" };
  }

  const expenseFrom = new Date(input.expenseFrom);
  const expenseTo = new Date(input.expenseTo);
  const today = new Date(now);
  today.setHours(23, 59, 59, 999);
  if (Number.isNaN(expenseFrom.getTime()) || Number.isNaN(expenseTo.getTime()) || expenseTo < expenseFrom) {
    return { valid: false, message: "A valid expense date range is required" };
  }
  if (expenseFrom > today || expenseTo > today) {
    return { valid: false, message: "Reimbursement expense dates cannot be after today's date" };
  }

  const businessPurpose = String(input.businessPurpose || "").trim();
  const lessCashAdvance = Number(input.lessCashAdvance || 0);
  const subtotal = items.reduce((sum, item) => sum + item.cost, 0);
  const totalReimbursement = subtotal - lessCashAdvance;
  if (!businessPurpose || !Number.isFinite(lessCashAdvance) || lessCashAdvance < 0 || totalReimbursement < 0) {
    return { valid: false, message: "Business purpose and a valid cash advance are required" };
  }
  if (existingReceiptCount + newReceiptCount === 0) {
    return { valid: false, message: "At least one receipt or invoice is required" };
  }

  return {
    valid: true,
    value: { expenseFrom, expenseTo, businessPurpose, items, subtotal, lessCashAdvance, totalReimbursement },
  };
};

