import { useEffect, useState } from "react";
import "../css/RightPanel.css";

const PAIN_TYPES = [
  "Sharp",
  "Dull",
  "Aching",
  "Burning",
  "Throbbing",
  "Shooting",
  "Cramping",
];

export default function RightPanel({
  selectedRegion,
  setSelectedRegion,
  painData = {},
  setPainData,
}) {
  const [severity, setSeverity] = useState(5);
  const [painType, setPainType] = useState("");
  const [notes, setNotes] = useState("");
  const [startDate, setStartDate] = useState("");
  const [frequency, setFrequency] = useState("");

  // selectedRegion contains the generated spot ID
  const selectedSpot = selectedRegion ? painData[selectedRegion] : null;

  // Load selected spot data into the form
  useEffect(() => {
    if (!selectedRegion) {
      setSeverity(5);
      setPainType("");
      setNotes("");
      setStartDate("");
      setFrequency("");
      return;
    }

    const existingData = painData[selectedRegion];

    if (existingData) {
      setSeverity(existingData.severity ?? 5);
      setPainType(existingData.painType ?? "");
      setNotes(existingData.notes ?? "");
      setStartDate(existingData.startDate ?? "");
      setFrequency(existingData.frequency ?? "");
    } else {
      setSeverity(5);
      setPainType("");
      setNotes("");
      setStartDate("");
      setFrequency("");
    }
  }, [selectedRegion, painData]);

  const handleSave = () => {
    if (!selectedRegion) {
      return;
    }

    setPainData((previousPainData) => ({
      ...previousPainData,

      [selectedRegion]: {
        // Preserve regionName, clickPosition, and clickNormal
        ...previousPainData[selectedRegion],
        severity,
        painType,
        notes,
        startDate,
        frequency,
      },
    }));

    // Close panel after saving
    setSelectedRegion(null);
  };

  const handleDelete = () => {
    if (!selectedRegion) {
      return;
    }

    setPainData((previousPainData) => {
      const updatedPainData = { ...previousPainData };

      delete updatedPainData[selectedRegion];

      return updatedPainData;
    });

    setSelectedRegion(null);
  };

  const getSeverityColor = (value) => {
    if (value <= 3) {
      return "#4caf50";
    }

    if (value <= 6) {
      return "#ff9800";
    }

    return "#f44336";
  };

  return (
    <aside className="glass-panel panel-right">
      {!selectedRegion ? (
        <div className="no-selection">
          <div className="no-sel-title">No Region Selected</div>

          <div className="no-sel-desc">
            Select a body region on the 3D model to describe your pain.
          </div>
        </div>
      ) : (
        <div className="detail-form">
          <div className="detail-header">
            <div>
              <div className="region-title">
                {selectedSpot?.regionName || "Unknown Region"}
              </div>

              <div className="region-subtitle">Describe your pain</div>
            </div>
          </div>

          <div className="form-section">
            <div
              className="form-label"
              style={{
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <span>Pain Severity</span>

              <span
                style={{
                  color: getSeverityColor(severity),
                  fontWeight: "bold",
                }}
              >
                {severity} / 10
              </span>
            </div>

            <input
              type="range"
              min="1"
              max="10"
              value={severity}
              onChange={(event) => setSeverity(Number(event.target.value))}
              style={{
                width: "100%",
                accentColor: getSeverityColor(severity),
              }}
            />
          </div>

          <div className="form-section">
            <div className="form-label">Pain Type</div>

            <div className="option-pills">
              {PAIN_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  className={`option-pill ${painType === type ? "active" : ""}`}
                  onClick={() => setPainType(type)}
                  style={
                    painType === type
                      ? {
                          background: "#6d5dfc",
                          color: "white",
                          borderColor: "#6d5dfc",
                        }
                      : {}
                  }
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="form-section">
            <div className="form-label">Frequency</div>

            <select
              value={frequency}
              onChange={(event) => setFrequency(event.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "8px",
                background: "#161b2d",
                color: "white",
                border: "none",
                cursor: "pointer",
              }}
            >
              <option value="">Select frequency...</option>

              <option value="Constant">Constant</option>

              <option value="Intermittent">Intermittent</option>

              <option value="Occasional">Occasional</option>

              <option value="Rare">Rare</option>
            </select>
          </div>

          <div className="form-section">
            <div className="form-label">Onset Date</div>

            <input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "8px",
                background: "#161b2d",
                color: "white",
                border: "none",
                cursor: "pointer",
              }}
            />
          </div>

          <div className="form-section">
            <div className="form-label">Additional Notes</div>

            <textarea
              className="notes-textarea"
              placeholder="Describe symptoms, when it started, what makes it worse..."
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </div>

          <div className="detail-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSave}
            >
              Save
            </button>

            <button
              type="button"
              className="btn btn-danger"
              onClick={handleDelete}
              title="Clear this region"
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
