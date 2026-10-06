import { useRef, useState } from "react";

import useConfirm from "../../../hooks/useConfirm";
import useToast from "../../../hooks/useToast";
import useStorageKey from "../../../hooks/useStorageKey";
import {
  createBackup,
  formatBytes,
  getBackupFileName,
  getStorageUsage,
  restoreBackup,
  summarizeBackup,
  validateBackup,
} from "../../../services/backupService";
import { TICKETS_KEY } from "../../../services/ticketStorage";
import { PRS_KEY } from "../../../services/prStorage";
import { NOTES_KEY } from "../../../services/noteStorage";
import { PROFILE_KEY } from "../../../services/profileStorage";
import { downloadJSON } from "../../../utils/download";
import { pluralize } from "../../../utils/format";

import "./BackupPanel.css";

const MAX_IMPORT_BYTES = 10 * 1024 * 1024;

const describeContents = (summary) =>
  `${pluralize(summary.tickets, "ticket")}, ${pluralize(summary.pullRequests, "PR")} and ${pluralize(summary.notes, "note")}`;

const readFileAsText = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("The file could not be read."));
    reader.readAsText(file);
  });

function BackupPanel() {
  const confirm = useConfirm();
  const toast = useToast();
  const fileInputRef = useRef(null);
  const [isImporting, setIsImporting] = useState(false);

  useStorageKey(TICKETS_KEY);
  useStorageKey(PRS_KEY);
  useStorageKey(NOTES_KEY);
  useStorageKey(PROFILE_KEY);

  const usage = getStorageUsage();
  const level = usage.percent >= 85 ? "danger" : usage.percent >= 60 ? "warning" : "ok";

  const handleExport = () => {
    const backup = createBackup();
    const summary = summarizeBackup(backup);

    downloadJSON(getBackupFileName(), backup);
    toast.success(`Backup downloaded: ${describeContents(summary)}.`);
  };

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    if (file.size > MAX_IMPORT_BYTES) {
      toast.error("That file is too large to be a Task Master backup.");
      return;
    }

    setIsImporting(true);

    try {
      let backup;

      try {
        backup = JSON.parse(await readFileAsText(file));
      } catch {
        throw new Error("This file is not valid JSON.");
      }

      const error = validateBackup(backup);

      if (error) {
        throw new Error(error);
      }

      const summary = summarizeBackup(backup);

      const confirmed = await confirm({
        title: "Replace your data with this backup?",
        message: `The backup has ${describeContents(summary)}${
          summary.hasProfile ? " plus your profile" : ""
        }. Your current tickets, PRs, notes and profile will be replaced. Export a backup first if you want to keep them.`,
        confirmLabel: "Replace data",
      });

      if (!confirmed) {
        return;
      }

      const previous = createBackup();
      restoreBackup(backup);

      toast.success("Backup restored.", {
        action: {
          label: "Undo",
          onClick: () => restoreBackup(previous),
        },
      });
    } catch (error) {
      toast.error(error.message || "The backup could not be imported.");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <section className="profile-section backup-panel" id="backup">
      <div className="profile-section-header">
        <div>
          <h2>Data &amp; Backup</h2>

          <p>
            Everything is stored in this browser. Export a backup to keep it
            safe or move it to another device.
          </p>
        </div>
      </div>

      <div className="backup-grid">
        <div className="backup-card">
          <div className="backup-card-title">
            <i className="bi bi-hdd"></i>
            Browser storage
          </div>

          <div
            className={`backup-meter level-${level}`}
            role="meter"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(usage.percent)}
            aria-label="Browser storage used"
          >
            <div
              className="backup-meter-fill"
              style={{ width: `${Math.max(usage.percent, 1)}%` }}
            />
          </div>

          <div className="backup-meter-label">
            <strong>{formatBytes(usage.usedBytes)}</strong> of about{" "}
            {formatBytes(usage.quotaBytes)} used ({usage.percent.toFixed(1)}%)
          </div>

          {level !== "ok" && (
            <p className={`backup-warning level-${level}`}>
              <i className="bi bi-exclamation-triangle-fill"></i>
              Storage is filling up. Export a backup, then remove old notes or
              your profile photo.
            </p>
          )}
        </div>

        <div className="backup-card">
          <div className="backup-card-title">
            <i className="bi bi-download"></i>
            Export
          </div>

          <p className="backup-card-text">
            Download all tickets, PRs, notes and your profile as a JSON file.
          </p>

          <button type="button" className="btn btn-primary" onClick={handleExport}>
            <i className="bi bi-download me-2"></i>
            Export backup
          </button>
        </div>

        <div className="backup-card">
          <div className="backup-card-title">
            <i className="bi bi-upload"></i>
            Import
          </div>

          <p className="backup-card-text">
            Restore from a Task Master backup file. You can undo right after.
          </p>

          <button
            type="button"
            className="btn btn-light"
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
          >
            {isImporting ? (
              <span className="spinner-border spinner-border-sm me-2" />
            ) : (
              <i className="bi bi-upload me-2"></i>
            )}
            Import backup
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="d-none"
            onChange={handleFile}
          />
        </div>
      </div>
    </section>
  );
}

export default BackupPanel;
