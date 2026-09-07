import test from "node:test";
import assert from "node:assert/strict";
import { createReimbursementUpload } from "../middleware/reimbursementUpload.js";

const configured = () => ({ cloud_name: "test", api_key: "test", api_secret: "test" });
const runUpload = (options) => {
  let status;
  let body;
  let continued = false;
  const logs = [];
  createReimbursementUpload({ getConfig: configured, logError: (entry) => logs.push(entry), ...options })(
    {},
    { status(value) { status = value; return this; }, json(value) { body = value; } },
    () => { continued = true; },
  );
  return { status, body, continued, logs };
};

test("missing upload configuration prevents submission with an actionable error", () => {
  const result = runUpload({ getConfig: () => ({}), receiveFiles: (req, res, done) => done(new Error("Missing API key")) });
  assert.equal(result.status, 503);
  assert.equal(result.body.code, "UPLOAD_NOT_CONFIGURED");
  assert.equal(result.continued, false);
});

for (const code of ["LIMIT_FILE_SIZE", "LIMIT_UNEXPECTED_FILE", "LIMIT_FILE_COUNT", "INVALID_FILE_TYPE"]) {
  test(`${code} is a client error rather than a generic server failure`, () => {
    const result = runUpload({ receiveFiles: (req, res, done) => done({ code }) });
    assert.equal(result.status, 400);
    assert.equal(result.body.code, code);
    assert.equal(result.continued, false);
  });
}

test("provider failure is logged without returning provider details to the client", () => {
  const result = runUpload({ receiveFiles: (req, res, done) => done({ http_code: 401, message: "Provider error detail" }) });
  assert.equal(result.status, 502);
  assert.equal(result.body.code, "RECEIPT_UPLOAD_FAILED");
  assert.equal(JSON.stringify(result.body).includes("Provider error detail"), false);
  assert.equal(result.logs[0].providerStatus, 401);
  assert.equal(result.continued, false);
});

test("synchronous upload errors are handled before reimbursement creation", () => {
  const result = runUpload({ receiveFiles: () => { throw new Error("Upload setup failed"); } });
  assert.equal(result.status, 502);
  assert.equal(result.continued, false);
});

test("successful upload continues to the reimbursement controller", () => {
  const result = runUpload({ receiveFiles: (req, res, done) => done() });
  assert.equal(result.continued, true);
  assert.equal(result.body, undefined);
});

test("editing without new receipts does not require the upload provider", () => {
  const result = runUpload({ getConfig: () => ({}), receiveFiles: (req, res, done) => done() });
  assert.equal(result.continued, true);
  assert.equal(result.body, undefined);
});
