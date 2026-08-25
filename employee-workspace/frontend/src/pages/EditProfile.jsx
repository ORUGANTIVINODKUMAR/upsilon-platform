import { useEffect, useRef, useState } from "react";
import {
  Camera,
  Trash2,
  User,
} from "lucide-react";

import api from "../api/api";
import useConfirm from "../components/ui/useConfirm";
import { ErrorState, LoadingState } from "../components/ui/StatePanel";

const MAX_PROFILE_PHOTO_SIZE =
  5 * 1024 * 1024;

const ALLOWED_PROFILE_PHOTO_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

const compactCardStyle = {
  padding: "18px",
  borderRadius: "14px",
};

const compactInputStyle = {
  minHeight: "42px",
  padding: "10px 12px",
};

const EditProfile = ({ onSuccess }) => {
  const confirmAction = useConfirm();
  const fileInputRef = useRef(null);

  const [profile, setProfile] =
    useState(null);

  const [phone, setPhone] =
    useState("");

  const [
    currentPassword,
    setCurrentPassword,
  ] = useState("");

  const [
    newPassword,
    setNewPassword,
  ] = useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [
    selectedPhoto,
    setSelectedPhoto,
  ] = useState(null);

  const [
    photoPreview,
    setPhotoPreview,
  ] = useState("");

  const [isLoading, setIsLoading] =
    useState(true);

  const [
    isUpdatingMobile,
    setIsUpdatingMobile,
  ] = useState(false);

  const [
    isChangingPassword,
    setIsChangingPassword,
  ] = useState(false);

  const [
    isUploadingPhoto,
    setIsUploadingPhoto,
  ] = useState(false);

  const [
    isRemovingPhoto,
    setIsRemovingPhoto,
  ] = useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  const clearFeedback = () => {
    setMessage("");
    setError("");
  };

  const notifyProfileUpdated = (
    updatedUser
  ) => {
    window.dispatchEvent(
      new CustomEvent(
        "profile-updated",
        {
          detail: updatedUser,
        }
      )
    );

    window.dispatchEvent(
      new CustomEvent(
        "users-updated"
      )
    );

    if (onSuccess) {
      onSuccess(updatedUser);
    }
  };

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      setError("");

      const { data } =
        await api.get(
          "/profile/me"
        );

      const user = data.user;

      setProfile(user);

      const savedPhone =
        user?.phone || "";

      const normalizedPhone =
        savedPhone
          .replace(/^\+91/, "")
          .replace(/\D/g, "")
          .slice(-10);

      setPhone(normalizedPhone);
    } catch (error) {
      console.error(
        "FETCH PROFILE ERROR:",
        error.response?.data ||
          error.message
      );

      setError(
        error.response?.data
          ?.message ||
          "Unable to load profile."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const initialLoad = window.setTimeout(fetchProfile, 0);
    return () => window.clearTimeout(initialLoad);
  }, []);

  useEffect(() => {
    return () => {
      if (
        photoPreview &&
        photoPreview.startsWith(
          "blob:"
        )
      ) {
        URL.revokeObjectURL(
          photoPreview
        );
      }
    };
  }, [photoPreview]);

  const updateMobile = async (
    event
  ) => {
    event.preventDefault();
    clearFeedback();

    if (
      !/^[6-9]\d{9}$/.test(
        phone
      )
    ) {
      setError(
        "Enter a valid 10-digit Indian mobile number."
      );
      return;
    }

    try {
      setIsUpdatingMobile(
        true
      );

      const { data } =
        await api.put(
          "/profile/mobile",
          {
            phone: `+91${phone}`,
          }
        );

      setProfile(
        (previousProfile) => ({
          ...previousProfile,
          phone:
            data.user?.phone ||
            `+91${phone}`,
        })
      );

      setMessage(
        data.message ||
          "Mobile number updated successfully."
      );

      notifyProfileUpdated(
        data.user
      );
    } catch (error) {
      setError(
        error.response?.data
          ?.message ||
          "Mobile update failed."
      );
    } finally {
      setIsUpdatingMobile(
        false
      );
    }
  };

  const changePassword = async (
    event
  ) => {
    event.preventDefault();
    clearFeedback();

    if (
      newPassword.length < 8
    ) {
      setError(
        "New password must contain at least 8 characters."
      );
      return;
    }

    if (
      newPassword !==
      confirmPassword
    ) {
      setError(
        "New password and confirm password do not match."
      );
      return;
    }

    if (
      currentPassword ===
      newPassword
    ) {
      setError(
        "New password must be different from the current password."
      );
      return;
    }

    try {
      setIsChangingPassword(
        true
      );

      const { data } =
        await api.put(
          "/profile/password",
          {
            currentPassword,
            newPassword,
          }
        );

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setMessage(
        data.message ||
          "Password changed successfully."
      );
    } catch (error) {
      setError(
        error.response?.data
          ?.message ||
          "Password change failed."
      );
    } finally {
      setIsChangingPassword(
        false
      );
    }
  };

  const handlePhotoSelection = (
    event
  ) => {
    clearFeedback();

    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    if (
      !ALLOWED_PROFILE_PHOTO_TYPES.includes(
        file.type
      )
    ) {
      setError(
        "Profile photo must be a JPG, JPEG, PNG, or WebP image."
      );

      event.target.value = "";
      return;
    }

    if (
      file.size >
      MAX_PROFILE_PHOTO_SIZE
    ) {
      setError(
        "Profile photo must not exceed 5 MB."
      );

      event.target.value = "";
      return;
    }

    if (
      photoPreview &&
      photoPreview.startsWith(
        "blob:"
      )
    ) {
      URL.revokeObjectURL(
        photoPreview
      );
    }

    setSelectedPhoto(file);
    setPhotoPreview(
      URL.createObjectURL(file)
    );
  };

  const cancelSelectedPhoto =
    () => {
      if (
        photoPreview &&
        photoPreview.startsWith(
          "blob:"
        )
      ) {
        URL.revokeObjectURL(
          photoPreview
        );
      }

      setSelectedPhoto(null);
      setPhotoPreview("");

      if (
        fileInputRef.current
      ) {
        fileInputRef.current.value =
          "";
      }

      clearFeedback();
    };

  const uploadProfilePhoto =
    async () => {
      clearFeedback();

      if (!selectedPhoto) {
        setError(
          "Select a profile photo before uploading."
        );
        return;
      }

      try {
        setIsUploadingPhoto(
          true
        );

        const formData =
          new FormData();

        formData.append(
          "profilePhoto",
          selectedPhoto
        );

        const { data } =
          await api.post(
            "/profile/photo",
            formData
          );

        setProfile(data.user);
        setSelectedPhoto(null);

        if (
          photoPreview &&
          photoPreview.startsWith(
            "blob:"
          )
        ) {
          URL.revokeObjectURL(
            photoPreview
          );
        }

        setPhotoPreview("");

        if (
          fileInputRef.current
        ) {
          fileInputRef.current.value =
            "";
        }

        setMessage(
          data.message ||
            "Profile photo updated successfully."
        );

        notifyProfileUpdated(
          data.user
        );
      } catch (error) {
        setError(
          error.response?.data
            ?.message ||
            "Unable to upload profile photo."
        );
      } finally {
        setIsUploadingPhoto(
          false
        );
      }
    };

  const removeProfilePhoto =
    async () => {
      clearFeedback();

      const confirmed = await confirmAction({
        title: "Remove your profile photo?",
        description: "Your initials will be shown until you upload another photo.",
        confirmLabel: "Remove photo",
      });

      if (!confirmed) {
        return;
      }

      try {
        setIsRemovingPhoto(
          true
        );

        const { data } =
          await api.delete(
            "/profile/photo"
          );

        setProfile(data.user);
        setSelectedPhoto(null);
        setPhotoPreview("");

        if (
          fileInputRef.current
        ) {
          fileInputRef.current.value =
            "";
        }

        setMessage(
          data.message ||
            "Profile photo removed successfully."
        );

        notifyProfileUpdated(
          data.user
        );
      } catch (error) {
        setError(
          error.response?.data
            ?.message ||
            "Unable to remove profile photo."
        );
      } finally {
        setIsRemovingPhoto(
          false
        );
      }
    };

  const displayedPhoto =
    photoPreview ||
    profile?.profilePhoto?.url ||
    "";

  if (isLoading) {
    return (
      <div className="page-container" aria-busy="true">
        <LoadingState label="Loading profile..." />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="page-container">
        <ErrorState
          title="Profile could not be loaded"
          description={error || "Please try loading your profile again."}
          action={(
            <button type="button" className="btn btn-primary" onClick={fetchProfile}>
              Try Again
            </button>
          )}
        />
      </div>
    );
  }

  return (
    <div
      className="page-container"
      style={{
        paddingBottom: "20px",
      }}
    >
      <div
        className="section-header"
        style={{
          marginBottom: "14px",
        }}
      >
        <div>
          <h2 className="card-title">
            Edit Profile
          </h2>

          <p className="section-subtitle">
            Update your profile photo,
            mobile number, and password.
          </p>
        </div>
      </div>

      {message && (
        <div
          className="alert alert-success"
          role="status"
          aria-live="polite"
          style={{
            marginBottom: "12px",
          }}
        >
          {message}
        </div>
      )}

      {error && (
        <div
          className="alert alert-error"
          role="alert"
          style={{
            marginBottom: "12px",
          }}
        >
          {error}
        </div>
      )}

      <div
        className="card"
        style={compactCardStyle}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "50%",
              overflow: "hidden",
              border:
                "2px solid #e2e8f0",
              background: "#f8fafc",
              display: "flex",
              alignItems: "center",
              justifyContent:
                "center",
              flexShrink: 0,
            }}
          >
            {displayedPhoto ? (
              <img
                src={displayedPhoto}
                alt={
                  profile.name ||
                  "Profile"
                }
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            ) : (
              <User
                size={32}
                style={{
                  color: "#64748b",
                }}
              />
            )}
          </div>

          <div
            style={{
              flex: 1,
              minWidth: "240px",
            }}
          >
            <h3
              style={{
                margin: "0 0 5px",
              }}
            >
              Profile Photo
            </h3>

            <p
              id="profile-photo-help"
              style={{
                margin:
                  "0 0 10px",
                color: "#64748b",
                fontSize: "13px",
              }}
            >
              JPG, JPEG, PNG, or
              WebP. Maximum 5 MB.
            </p>

            <input
              id="profile-photo-input"
              ref={fileInputRef}
              type="file"
              aria-label="Choose a profile photo"
              aria-describedby="profile-photo-help"
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
              onChange={
                handlePhotoSelection
              }
              disabled={
                isUploadingPhoto ||
                isRemovingPhoto
              }
              style={{
                display: "none",
              }}
            />

            <div
              style={{
                display: "flex",
                gap: "8px",
                flexWrap: "wrap",
              }}
            >
              <button
                type="button"
                className="btn"
                onClick={() =>
                  fileInputRef.current?.click()
                }
                disabled={
                  isUploadingPhoto ||
                  isRemovingPhoto
                }
              >
                <Camera size={15} />

                {profile.profilePhoto
                  ?.url
                  ? "Choose New"
                  : "Choose Photo"}
              </button>

              {selectedPhoto && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={
                    uploadProfilePhoto
                  }
                  disabled={
                    isUploadingPhoto
                  }
                >
                  {isUploadingPhoto
                    ? "Uploading..."
                    : "Upload"}
                </button>
              )}

              {selectedPhoto && (
                <button
                  type="button"
                  className="btn"
                  onClick={
                    cancelSelectedPhoto
                  }
                  disabled={
                    isUploadingPhoto
                  }
                >
                  Cancel
                </button>
              )}

              {profile.profilePhoto
                ?.url &&
                !selectedPhoto && (
                  <button
                    type="button"
                    className="delete-icon-btn"
                    onClick={
                      removeProfilePhoto
                    }
                    disabled={
                      isRemovingPhoto
                    }
                  >
                    <Trash2
                      size={15}
                    />

                    {isRemovingPhoto
                      ? "Removing..."
                      : "Remove"}
                  </button>
                )}
            </div>

            {selectedPhoto && (
              <p
                role="status"
                aria-live="polite"
                style={{
                  margin:
                    "8px 0 0",
                  fontSize: "12px",
                  color: "#64748b",
                }}
              >
                {selectedPhoto.name}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="profile-settings-grid">
        <div
          className="card"
          style={compactCardStyle}
        >
          <h3
            style={{
              margin:
                "0 0 12px",
            }}
          >
            Employee Details
          </h3>

          <div className="profile-details-grid">
            <div>
              <strong>Name:</strong>{" "}
              {profile.name ||
                "N/A"}
            </div>

            <div>
              <strong>
                Designation:
              </strong>{" "}
              {profile.designation ||
                "N/A"}
            </div>

            <div>
              <strong>
                Employee ID:
              </strong>{" "}
              {profile.employeeId ||
                "N/A"}
            </div>

            <div>
              <strong>Role:</strong>{" "}
              {profile.role ===
              "TeamLeader"
                ? "Team Leader"
                : profile.role ||
                  "N/A"}
            </div>

            <div>
              <strong>Email:</strong>{" "}
              {profile.email ||
                "N/A"}
            </div>

            <div>
              <strong>
                Department:
              </strong>{" "}
              {profile.subcategoryId
                ?.name || "N/A"}
            </div>

            <div>
              <strong>Phone:</strong>{" "}
              {profile.phone ||
                "N/A"}
            </div>

            <div>
              <strong>Team:</strong>{" "}
              {profile.teamId?.name ||
                "N/A"}
            </div>

            <div>
              <strong>
                Joining Date:
              </strong>{" "}
              {profile.dateOfJoining
                ? new Date(
                    profile.dateOfJoining
                  ).toLocaleDateString()
                : "N/A"}
            </div>

            <div>
              <strong>
                Date of Birth:
              </strong>{" "}
              {profile.dateOfBirth
                ? new Date(
                    profile.dateOfBirth
                  ).toLocaleDateString()
                : "N/A"}
            </div>
          </div>
        </div>

        <div
          className="card"
          style={compactCardStyle}
        >
          <h3
            style={{
              margin:
                "0 0 12px",
            }}
          >
            Update Mobile
          </h3>

          <form
            className="auth-form"
            onSubmit={updateMobile}
          >
            <label className="sr-only" htmlFor="profile-mobile-number">
              Mobile number
            </label>
            <div
              style={{
                display: "flex",
                gap: "8px",
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  padding:
                    "10px 12px",
                  border:
                    "1px solid #ddd",
                  borderRadius: "8px",
                  background: "#f5f5f5",
                  fontWeight: 600,
                }}
              >
                +91
              </span>

              <input
                id="profile-mobile-number"
                type="text"
                aria-label="Mobile number without country code"
                value={phone}
                onChange={(
                  event
                ) => {
                  const value =
                    event.target.value
                      .replace(
                        /\D/g,
                        ""
                      )
                      .slice(0, 10);

                  setPhone(value);
                  clearFeedback();
                }}
                placeholder="9876543210"
                maxLength={10}
                inputMode="numeric"
                pattern="[6-9][0-9]{9}"
                disabled={
                  isUpdatingMobile
                }
                required
                style={{
                  ...compactInputStyle,
                  flex: 1,
                  minWidth: "160px",
                }}
              />

              <button
                className="btn btn-primary"
                type="submit"
                disabled={
                  isUpdatingMobile
                }
                style={{
                  minHeight: "42px",
                  whiteSpace:
                    "nowrap",
                }}
              >
                {isUpdatingMobile
                  ? "Saving..."
                  : "Save"}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div
        className="card"
        style={{
          ...compactCardStyle,
          marginTop: "16px",
        }}
      >
        <h3
          style={{
            margin: "0 0 12px",
          }}
        >
          Change Password
        </h3>

        <form
          className="auth-form"
          onSubmit={changePassword}
        >
          <div className="password-fields-grid">
            <div className="input-group">
              <label htmlFor="current-password">
                Current Password
              </label>

              <input
                id="current-password"
                type="password"
                value={
                  currentPassword
                }
                onChange={(
                  event
                ) => {
                  setCurrentPassword(
                    event.target.value
                  );
                  clearFeedback();
                }}
                disabled={
                  isChangingPassword
                }
                autoComplete="current-password"
                required
                style={
                  compactInputStyle
                }
              />
            </div>

            <div className="input-group">
              <label htmlFor="new-password">
                New Password
              </label>

              <input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(
                  event
                ) => {
                  setNewPassword(
                    event.target.value
                  );
                  clearFeedback();
                }}
                minLength={8}
                disabled={
                  isChangingPassword
                }
                autoComplete="new-password"
                required
                style={
                  compactInputStyle
                }
              />
            </div>

            <div className="input-group">
              <label htmlFor="confirm-password">
                Confirm Password
              </label>

              <input
                id="confirm-password"
                type="password"
                value={
                  confirmPassword
                }
                onChange={(
                  event
                ) => {
                  setConfirmPassword(
                    event.target.value
                  );
                  clearFeedback();
                }}
                minLength={8}
                disabled={
                  isChangingPassword
                }
                autoComplete="new-password"
                required
                style={
                  compactInputStyle
                }
              />
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent:
                "flex-end",
              marginTop: "12px",
            }}
          >
            <button
              className="btn btn-primary"
              type="submit"
              disabled={
                isChangingPassword
              }
              style={{
                minWidth: "180px",
              }}
            >
              {isChangingPassword
                ? "Changing..."
                : "Change Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfile;
