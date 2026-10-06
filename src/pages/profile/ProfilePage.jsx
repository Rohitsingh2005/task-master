import { useMemo, useRef, useState } from "react";
import "./ProfilePage.css";
import { saveProfile } from "../../services/profileStorage";
import useProfile from "../../hooks/useProfile";
import useNow from "../../hooks/useNow";
import useToast from "../../hooks/useToast";
import {
  useNotes,
  usePullRequests,
  useTickets,
} from "../../hooks/useWorkspaceData";
import {
  getRunningTicket,
  getTrackedMs,
  isTicketDone,
} from "../../services/ticketStorage";
import { formatDuration, startOfWeek } from "../../utils/format";
import Avatar from "../../components/common/avatar/Avatar";
import BackupPanel from "../../components/settings/backup-panel/BackupPanel";
import {
  ACCEPTED_IMAGE_TYPES,
  resizeImageToSquare,
  validateImageFile,
} from "../../utils/resizeImage";

const EMPTY_PROFILE_FORM = {
  name: "",
  position: "",
  photo: "",
};

function ProfilePage() {
  const { profile, isSaved } = useProfile();

  const formStartValues = isSaved
    ? profile
    : EMPTY_PROFILE_FORM;

  const [editProfile, setEditProfile] =
    useState(formStartValues);

  const [isEditing, setIsEditing] =
    useState(!isSaved);

  const [photoError, setPhotoError] = useState("");
  const [isProcessingPhoto, setIsProcessingPhoto] =
    useState(false);
  const [isDraggingPhoto, setIsDraggingPhoto] =
    useState(false);

  const photoInputRef = useRef(null);

  const toast = useToast();
  const tickets = useTickets();
  const prs = usePullRequests();
  const allNotes = useNotes();
  const notes = useMemo(
    () => allNotes.filter((note) => !note.deleted),
    [allNotes]
  );

  const now = useNow(getRunningTicket(tickets) ? 1000 : 60000);

  const timeThisWeek = useMemo(() => {
    const weekStart = startOfWeek(new Date(now)).getTime();

    return tickets.reduce(
      (total, ticket) => total + getTrackedMs(ticket, now, weekStart),
      0
    );
  }, [tickets, now]);

  const ticketStats = useMemo(() => {
    const total = tickets.length;

    const done = tickets.filter(isTicketDone).length;

    const pending = total - done;

    return {
      total,
      done,
      pending,
    };
  }, [tickets]);

  const prStats = useMemo(() => {
    const total = prs.length;

    const merged = prs.filter(
      (pr) =>
        String(pr.status).toLowerCase() ===
        "merged"
    ).length;

    const pending = total - merged;

    return {
      total,
      merged,
      pending,
    };
  }, [prs]);

  const noteStats = useMemo(() => {
    return {
      total: notes.length,
    };
  }, [notes]);

  const handleEdit = () => {
    setEditProfile(formStartValues);
    setPhotoError("");
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditProfile(formStartValues);
    setPhotoError("");
    setIsEditing(false);
  };

  const handlePhotoFile = async (file) => {
    const validationError = validateImageFile(file);

    if (validationError) {
      setPhotoError(validationError);
      return;
    }

    setPhotoError("");
    setIsProcessingPhoto(true);

    try {
      const photo = await resizeImageToSquare(file);

      setEditProfile((current) => ({
        ...current,
        photo,
      }));
    } catch (error) {
      setPhotoError(error.message);
    } finally {
      setIsProcessingPhoto(false);
    }
  };

  const handlePhotoInputChange = (event) => {
    handlePhotoFile(event.target.files?.[0]);
    event.target.value = "";
  };

  const handlePhotoDrop = (event) => {
    event.preventDefault();
    setIsDraggingPhoto(false);
    handlePhotoFile(event.dataTransfer.files?.[0]);
  };

  const handleRemovePhoto = () => {
    setPhotoError("");
    setEditProfile((current) => ({
      ...current,
      photo: "",
    }));
  };

  const openPhotoPicker = () => {
    photoInputRef.current?.click();
  };

  const handleSave = () => {
    const name =
      editProfile.name.trim();

    const position =
      editProfile.position.trim();

    if (!name) {
      return;
    }

    const updatedProfile = {
      name,
      position:
        position || "No position",
      photo: editProfile.photo,
    };

    if (!saveProfile(updatedProfile)) {
      setPhotoError(
        "Could not save your profile because browser storage is full. Try a smaller photo or remove it."
      );
      return;
    }

    setEditProfile(updatedProfile);
    setIsEditing(false);
    toast.success("Profile saved.");
  };

  return (
    <div className="profile-page">

      <div className="profile-page-header">
        <div>
          <h1>Profile</h1>

          <p>
            Manage your profile and workspace
            activity.
          </p>
        </div>
      </div>

      <div className="profile-content">

        <section className="profile-card">
          {!isEditing ? (
            <>
              <div className="profile-main">
                <Avatar
                  className="profile-avatar"
                  name={profile.name}
                  photo={profile.photo}
                />

                <div className="profile-info">
                  <h2>
                    {profile.name}
                  </h2>

                  <p>
                    {profile.position}
                  </p>
                </div>
              </div>

              <button
                className="profile-edit-button"
                onClick={handleEdit}
              >
                Edit Profile
              </button>
            </>
          ) : (
            <div className="profile-edit-form">
              <div className="profile-edit-header">
                <div>
                  <h2>
                    Edit Profile
                  </h2>

                  <p>
                    Update your personal
                    information.
                  </p>
                </div>

              </div>

              <div className="profile-photo-field">
                <button
                  type="button"
                  className={`profile-photo-dropzone ${
                    isDraggingPhoto ? "is-dragging" : ""
                  }`}
                  onClick={openPhotoPicker}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setIsDraggingPhoto(true);
                  }}
                  onDragLeave={() =>
                    setIsDraggingPhoto(false)
                  }
                  onDrop={handlePhotoDrop}
                  disabled={isProcessingPhoto}
                  aria-label={
                    editProfile.photo
                      ? "Change profile photo"
                      : "Upload profile photo"
                  }
                >
                  <Avatar
                    className="profile-avatar profile-photo-preview"
                    name={editProfile.name}
                    photo={editProfile.photo}
                  />

                  <span className="profile-photo-overlay">
                    {isProcessingPhoto ? (
                      <span className="spinner-border spinner-border-sm" />
                    ) : (
                      <i className="bi bi-camera-fill"></i>
                    )}
                  </span>
                </button>

                <div className="profile-photo-details">
                  <div className="profile-photo-title">
                    Profile photo
                  </div>

                  <p className="profile-photo-help">
                    Click or drop an image. PNG, JPG,
                    WEBP or GIF up to 5 MB. It will be
                    cropped to a square.
                  </p>

                  <div className="profile-photo-actions">
                    <button
                      type="button"
                      className="profile-photo-button"
                      onClick={openPhotoPicker}
                      disabled={isProcessingPhoto}
                    >
                      <i className="bi bi-upload"></i>
                      {editProfile.photo
                        ? "Change photo"
                        : "Upload photo"}
                    </button>

                    {editProfile.photo && (
                      <button
                        type="button"
                        className="profile-photo-button danger"
                        onClick={handleRemovePhoto}
                        disabled={isProcessingPhoto}
                      >
                        <i className="bi bi-trash"></i>
                        Remove
                      </button>
                    )}
                  </div>

                  {photoError && (
                    <p
                      className="profile-photo-error"
                      role="alert"
                    >
                      {photoError}
                    </p>
                  )}
                </div>

                <input
                  ref={photoInputRef}
                  type="file"
                  accept={ACCEPTED_IMAGE_TYPES.join(",")}
                  className="d-none"
                  onChange={handlePhotoInputChange}
                />
              </div>

              <div className="profile-fields">
                <div className="profile-field">
                  <label>Name</label>

                  <input
                    type="text"
                    value={
                      editProfile.name
                    }
                    placeholder="Enter your name"
                    onChange={(e) =>
                      setEditProfile(
                        (current) => ({
                          ...current,
                          name: e.target.value,
                        })
                      )
                    }
                  />
                </div>

                <div className="profile-field">
                  <label>
                    Position
                  </label>

                  <input
                    type="text"
                    value={
                      editProfile.position
                    }
                    placeholder="Frontend Developer"
                    onChange={(e) =>
                      setEditProfile(
                        (current) => ({
                          ...current,
                          position:
                            e.target.value,
                        })
                      )
                    }
                  />
                </div>
              </div>

              <div className="profile-edit-footer">
                <button
                  className="profile-cancel-button"
                  onClick={
                    handleCancel
                  }
                >
                  Cancel
                </button>

                <button
                  className="profile-save-button"
                  disabled={
                    !editProfile.name.trim() ||
                    isProcessingPhoto
                  }
                  onClick={
                    handleSave
                  }
                >
                  Save Changes
                </button>
              </div>
            </div>
          )}
        </section>

        <section className="profile-section">
          <div className="profile-section-header">
            <div>
              <h2>
                Activity Overview
              </h2>

              <p>
                Your workspace activity at a
                glance.
              </p>
            </div>

          </div>

          <div className="stats-grid">

            <StatCard
              icon="🎫"
              title="Tickets"
              value={
                ticketStats.total
              }
              label="Total tickets"
              color="blue"
            />

            <StatCard
              icon="🔀"
              title="Pull Requests"
              value={prStats.total}
              label="Total PRs"
              color="purple"
            />

            <StatCard
              icon="📝"
              title="Notes"
              value={noteStats.total}
              label="Total notes"
              color="orange"
            />

            <StatCard
              icon="⏱"
              title="Time tracked"
              value={formatDuration(timeThisWeek)}
              label="This week"
              color="green"
            />
          </div>
        </section>

        <section className="profile-section">
          <div className="profile-section-header">
            <div>
              <h2>
                Status Overview
              </h2>

              <p>
                Current status of your
                tickets and pull requests.
              </p>
            </div>
          </div>

          <div className="status-grid">

            <div className="status-card">
              <div className="status-card-header">
                <div className="status-card-icon ticket-icon">
                  🎫
                </div>

                <div>
                  <h3>
                    Tickets
                  </h3>

                  <span>
                    {
                      ticketStats.total
                    }{" "}
                    total
                  </span>
                </div>
              </div>

              <div className="status-values">
                <StatusValue
                  label="Done"
                  value={
                    ticketStats.done
                  }
                  className="done"
                />

                <StatusValue
                  label="Pending"
                  value={
                    ticketStats.pending
                  }
                  className="pending"
                />
              </div>
            </div>

            <div className="status-card">
              <div className="status-card-header">
                <div className="status-card-icon pr-icon">
                  🔀
                </div>

                <div>
                  <h3>
                    Pull Requests
                  </h3>

                  <span>
                    {prStats.total}{" "}
                    total
                  </span>
                </div>
              </div>

              <div className="status-values">
                <StatusValue
                  label="Merged"
                  value={
                    prStats.merged
                  }
                  className="done"
                />

                <StatusValue
                  label="Pending"
                  value={
                    prStats.pending
                  }
                  className="pending"
                />
              </div>
            </div>
          </div>
        </section>

        <BackupPanel />

        <section className="profile-summary">
          <div className="summary-item">
            <span className="summary-value">
              {ticketStats.total}
            </span>

            <span className="summary-label">
              Tickets
            </span>
          </div>

          <div className="summary-divider" />

          <div className="summary-item">
            <span className="summary-value">
              {prStats.total}
            </span>

            <span className="summary-label">
              Pull Requests
            </span>
          </div>

          <div className="summary-divider" />

          <div className="summary-item">
            <span className="summary-value">
              {noteStats.total}
            </span>

            <span className="summary-label">
              Notes
            </span>
          </div>

          <div className="summary-divider" />

          <div className="summary-item">
            <span className="summary-value">
              {ticketStats.done +
                prStats.merged}
            </span>

            <span className="summary-label">
              Completed
            </span>
          </div>
        </section>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  title,
  value,
  label,
  color,
}) {
  return (
    <div
      className={`stat-card ${color}`}
    >
      <div className="stat-card-top">
        <div className="stat-icon">
          {icon}
        </div>
      </div>

      <div className="stat-value">
        {value}
      </div>

      <div className="stat-title">
        {title}
      </div>

      <div className="stat-label">
        {label}
      </div>
    </div>
  );
}

function StatusValue({
  label,
  value,
  className,
}) {
  return (
    <div className="status-value">
      <div
        className={`status-dot ${className}`}
      />

      <span className="status-label">
        {label}
      </span>

      <strong>{value}</strong>
    </div>
  );
}

export default ProfilePage;
