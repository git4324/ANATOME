import "../css/LeftPanel.css";

export default function LeftPanel({ selectedRegion, painData = {}, setSelectedRegion, setPainData }) {

    const savedRegions = Object.entries(painData);
    const numRegions = savedRegions.length;
    
    let avgSeverity = "—";
    if (numRegions > 0) {
        const total = savedRegions.reduce((sum, [_, data]) => sum + data.severity, 0);
        avgSeverity = (total / numRegions).toFixed(1);
    }

    return (

        <aside className="glass-panel panel-left">

            <div className="panel-title">
                Saved Pain Regions
            </div>

            <div className="panel-summary">
                <div className="summary-stat">
                    <div className="stat-value">{numRegions}</div>
                    <div className="stat-label">Spots</div>
                </div>

                <div className="summary-stat">
                    <div className="stat-value">{avgSeverity}</div>
                    <div className="stat-label">Avg Severity</div>
                </div>
            </div>

            <div className="region-list" style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>

                {numRegions > 0 ? (
                    savedRegions.map(([spotId, data]) => (
                        <div key={spotId} style={{ background: data.severity <= 3 ? 'rgba(76,175,80,0.12)' : data.severity <= 6 ? 'rgba(255,152,0,0.12)' : 'rgba(244,67,54,0.12)', padding: '10px', borderRadius: '8px', boxShadow: `inset 0 0 0 1px ${data.severity <= 3 ? 'rgba(76,175,80,0.28)' : data.severity <= 6 ? 'rgba(255,152,0,0.28)' : 'rgba(244,67,54,0.28)'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            
                            <div>
                                <div style={{ fontWeight: 'bold' }}>{data.regionName || "Unknown Region"}</div>
                                <div style={{ fontSize: '12px', color: '#aaa', marginTop: '4px' }}>
                                    Severity: {data.severity}/10 • {data.painType || "Unspecified"}
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '5px' }}>
                                <button 
                                    onClick={() => setSelectedRegion(spotId)}
                                    style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}
                                    title="Edit"
                                >
                                    Edit
                                </button>
                                <button 
                                    onClick={() => {
                                        if (window.confirm(`Delete this pain spot on ${data.regionName}?`)) {
                                            const newData = { ...painData };
                                            delete newData[spotId];
                                            setPainData(newData);
                                            if (selectedRegion === spotId) {
                                                setSelectedRegion(null);
                                            }
                                        }
                                    }}
                                    style={{ background: 'rgba(244,67,54,0.2)', border: 'none', color: '#f44336', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}
                                    title="Delete"
                                >
                                    Delete
                                </button>
                            </div>

                        </div>
                    ))
                ) : (
                    <div className="empty-state">
                        <div style={{ opacity: 0.7 }}>Click on the 3D body model to indicate where you feel pain.</div>
                    </div>
                )}

            </div>

        </aside>

    );
}
