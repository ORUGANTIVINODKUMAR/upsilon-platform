import { useState } from "react";
import { Upload } from "lucide-react";

import api from "../api/api";
import { useAuth } from "../context/AuthContext";

const SignatureUploader = () => {
  const { user, updateUser } = useAuth();
  const [file, setFile] = useState(null);

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!file) {
      alert("Please select a signature file");
      return;
    }

    try {
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

      alert("Digital signature saved successfully");
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Signature upload failed"
      );
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

      <form onSubmit={handleUpload} className="signature-upload-form">
        <input
          type="file"
          accept=".png,.jpg,.jpeg"
          onChange={(e) => setFile(e.target.files[0])}
        />

        <button className="btn btn-primary" type="submit">
          <Upload size={16} />
          Save Digital Signature
        </button>
      </form>
    </div>
  );
};

export default SignatureUploader;
