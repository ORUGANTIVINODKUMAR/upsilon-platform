import { useRef, useState } from "react";
import { Upload } from "lucide-react";

import api from "../api/api";
import { useAuth } from "../context/useAuth";
import { ErrorState } from "./ui/StatePanel";

const MAX_SIGNATURE_SIZE = 5 * 1024 * 1024;
const ALLOWED_SIGNATURE_TYPES = ["image/png", "image/jpeg"];

const SignatureUploader = () => {
  const { user, updateUser } = useAuth();
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const fileInputRef = useRef(null);

  const handleFileSelection = (event) => {
    const selectedFile = event.target.files?.[0] || null;
    setError("");
    setMessage("");

    if (!selectedFile) {
      setFile(null);
      return;
    }

    if (!ALLOWED_SIGNATURE_TYPES.includes(selectedFile.type)) {
      setFile(null);
      event.target.value = "";
      setError("Signature must be a PNG, JPG, or JPEG image.");
      return;
    }

    if (selectedFile.size > MAX_SIGNATURE_SIZE) {
      setFile(null);
      event.target.value = "";
      setError("Signature image must not exceed 5 MB.");
      return;
    }

    setFile(selectedFile);
  };

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!file) {
      setError("Please select a signature image.");
      return;
    }

    try {
      setIsUploading(true);
      setError("");
      setMessage("");
      const payload = new FormData();
      payload.append("signatureFile", file);

      const { data } = await api.post(
        "/profile/signature",
        payload,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      updateUser(data.user);
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setMessage("Digital signature saved successfully.");
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Signature upload failed."
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="card signature-card">
      <div className="section-header">
        <div>
          <h2 className="card-title">Digital Signature</h2>
          <p className="section-subtitle">
            Upload your signature once. It will be used in approved
            reimbursement forms.
          </p>
        </div>
      </div>

      {user?.signatureFile && (
        <div className="signature-preview">
          <p>Current Signature</p>

          <img
            src={user.signatureFile}
            alt="Digital Signature"
          />
        </div>
      )}

      {error && <ErrorState title="Signature not saved" description={error} compact />}
      {message && <div className="alert alert-success" role="status" aria-live="polite">{message}</div>}

      <form onSubmit={handleUpload} className="signature-upload-form">
        <div className="input-group signature-file-field">
          <label htmlFor="digital-signature-file">Signature image</label>
          <input
            id="digital-signature-file"
            ref={fileInputRef}
            type="file"
            accept=".png,.jpg,.jpeg,image/png,image/jpeg"
            aria-describedby="digital-signature-help"
            onChange={handleFileSelection}
            disabled={isUploading}
          />
          <small id="digital-signature-help">PNG, JPG, or JPEG. Maximum 5 MB.</small>
          {file && <small role="status" aria-live="polite">Selected: {file.name}</small>}
        </div>

        <button className="btn btn-primary" type="submit" disabled={isUploading || !file}>
          <Upload size={16} aria-hidden="true" />
          {isUploading ? "Saving Signature..." : "Save Digital Signature"}
        </button>
      </form>
    </div>
  );
};

export default SignatureUploader;
