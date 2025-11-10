import './ResultsPanel.css'

function ResultsPanel({ results }) {
  const { your_mix, reference, comparison, suggestions } = results

  // Helper function to safely get nested values
  const safe = (value, defaultValue = 'N/A') => {
    return value !== undefined && value !== null ? value : defaultValue
  }

  // Helper function for safe toFixed
  const safeFixed = (value, decimals = 1, defaultValue = 'N/A') => {
    if (value !== undefined && value !== null && !isNaN(value)) {
      return Number(value).toFixed(decimals)
    }
    return defaultValue
  }

  return (
    <div className="results-panel">
      {/* Summary Section */}
      <section className="results-section summary-section">
        <h3>Summary</h3>
        <div className="summary-cards">
          <div className="summary-card card-blue">
            <div className="card-title">Your Mix</div>
            <div className="card-stats">
              <div className="stat">
                <span className="stat-label">LUFS</span>
                <span className="stat-value">{safe(your_mix?.dynamics?.lufs_integrated)}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Peak</span>
                <span className="stat-value">{safe(your_mix?.dynamics?.peak_db, 'N/A')} dB</span>
              </div>
              <div className="stat">
                <span className="stat-label">Clarity</span>
                <span className="stat-value">{safe(your_mix?.masking?.clarity_score)}/100</span>
              </div>
            </div>
          </div>
          <div className="summary-card card-green">
            <div className="card-title">Reference</div>
            <div className="card-stats">
              <div className="stat">
                <span className="stat-label">LUFS</span>
                <span className="stat-value">{safe(reference?.dynamics?.lufs_integrated)}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Peak</span>
                <span className="stat-value">{safe(reference?.dynamics?.peak_db, 'N/A')} dB</span>
              </div>
              <div className="stat">
                <span className="stat-label">Clarity</span>
                <span className="stat-value">{safe(reference?.masking?.clarity_score)}/100</span>
              </div>
            </div>
          </div>
        </div>

        {suggestions?.summary && suggestions.summary.length > 0 && (
          <div className="key-findings">
            <h4>Key Findings</h4>
            <ul>
              {suggestions.summary.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* Frequency Balance Section */}
      <section className="results-section">
        <h3>Frequency Balance</h3>
        <div className="frequency-bands">
          {Object.entries(comparison.frequency_balance.differences).map(([band, data]) => (
            <div key={band} className={`band-card ${data.severity}`}>
              <div className="band-name">{band.replace('_', ' ').toUpperCase()}</div>
              <div className="band-range">{data.frequency_range}</div>
              <div className={`band-diff ${data.status}`}>
                {data.difference_db > 0 ? '+' : ''}{safeFixed(data.difference_db)} dB
              </div>
              <div className="band-status">{data.status}</div>
            </div>
          ))}
        </div>

        {comparison.frequency_balance.problem_bands && comparison.frequency_balance.problem_bands.length > 0 && (
          <div className="problem-list">
            <h4>Issues Detected</h4>
            {comparison.frequency_balance.problem_bands.map((problem, index) => (
              <div key={index} className={`problem-item severity-${problem.severity}`}>
                <div className="problem-header">
                  <span className="problem-band">{problem.band.replace('_', ' ')}</span>
                  <span className="problem-diff">{problem.difference_db > 0 ? '+' : ''}{safeFixed(problem.difference_db)} dB</span>
                </div>
                <div className="problem-suggestion">→ {problem.suggestion.message}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Resonances Section */}
      {comparison.resonances.problem_resonances && comparison.resonances.problem_resonances.length > 0 && (
        <section className="results-section">
          <h3>Resonances</h3>
          <div className="resonance-summary">
            <div>Your Mix: <strong>{comparison.resonances.your_high_severity}</strong> high severity resonances</div>
            <div>Reference: <strong>{comparison.resonances.reference_high_severity}</strong> high severity resonances</div>
          </div>
          <div className="resonance-list">
            {comparison.resonances.problem_resonances.slice(0, 5).map((res, index) => (
              <div key={index} className={`resonance-item severity-${res.severity}`}>
                <div className="resonance-freq">{safeFixed(res.frequency, 0)} Hz</div>
                <div className="resonance-details">
                  <div className="resonance-severity">{res.severity}</div>
                  <div className="resonance-suggestion">{res.suggestion.message}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Dynamics Section */}
      <section className="results-section">
        <h3>Dynamics</h3>
        <div className="dynamics-grid">
          <div className="dynamics-comparison">
            <h4>Compression</h4>
            <div className="comparison-text">{comparison.dynamics.compression_comparison.description}</div>
            <div className="metric-row">
              <span>Your Mix Crest Factor:</span>
              <span>{safeFixed(comparison?.dynamics?.compression_comparison?.your_crest_factor)} dB</span>
            </div>
            <div className="metric-row">
              <span>Reference Crest Factor:</span>
              <span>{safeFixed(comparison?.dynamics?.compression_comparison?.reference_crest_factor)} dB</span>
            </div>
          </div>

          <div className="dynamics-comparison">
            <h4>Loudness</h4>
            <div className="comparison-text">{comparison.dynamics.loudness_comparison.description}</div>
            <div className="metric-row">
              <span>LUFS Difference:</span>
              <span>{comparison?.dynamics?.loudness_comparison?.lufs_difference > 0 ? '+' : ''}{safeFixed(comparison?.dynamics?.loudness_comparison?.lufs_difference)} LUFS</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stereo Width Section */}
      {!comparison.stereo.both_mono && (
        <section className="results-section">
          <h3>Stereo Width</h3>
          {comparison.stereo.message ? (
            <div className="stereo-message">{comparison.stereo.message}</div>
          ) : (
            <>
              <div className="stereo-summary">
                <div className="stereo-stat">
                  <span className="stereo-label">Your Mix Width:</span>
                  <span className="stereo-value">{comparison?.stereo?.overall_width_difference > 0 ? '+' : ''}{safeFixed(comparison?.stereo?.overall_width_difference)}%</span>
                </div>
                <div className="stereo-assessment">{comparison.stereo.assessment}</div>
              </div>

              {comparison.stereo.problem_bands && comparison.stereo.problem_bands.length > 0 && (
                <div className="stereo-bands">
                  <h4>Per-Band Width Issues</h4>
                  {comparison.stereo.problem_bands.map((pb, index) => (
                    <div key={index} className="stereo-band-item">
                      <div className="stereo-band-name">{pb.band.replace('_', ' ')}</div>
                      <div className="stereo-band-diff">
                        Your: {safeFixed(pb.your_width)}% | Ref: {safeFixed(pb.reference_width)}% | Diff: {pb.difference > 0 ? '+' : ''}{safeFixed(pb.difference)}%
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </section>
      )}

      {/* EQ Suggestions Section */}
      {suggestions.eq_adjustments && suggestions.eq_adjustments.length > 0 && (
        <section className="results-section eq-section">
          <h3>EQ Suggestions</h3>
          <div className="eq-list">
            {suggestions.eq_adjustments.slice(0, 10).map((eq, index) => (
              <div key={index} className="eq-item">
                <div className="eq-header">
                  <span className="eq-type">{eq.type.toUpperCase()}</span>
                  <span className="eq-freq">{eq.frequency} Hz</span>
                  <span className={`eq-gain ${eq.gain_db > 0 ? 'boost' : 'cut'}`}>
                    {eq.gain_db > 0 ? '+' : ''}{safeFixed(eq.gain_db)} dB
                  </span>
                  <span className="eq-q">Q: {eq.q}</span>
                </div>
                <div className="eq-message">{eq.message}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Compression Suggestions */}
      {suggestions.compression && (
        <section className="results-section">
          <h3>Compression Suggestions</h3>
          <div className="suggestion-box">
            <div className="suggestion-message">{suggestions.compression.message}</div>
          </div>
        </section>
      )}

      {/* Masking Suggestions */}
      {suggestions.masking && suggestions.masking.length > 0 && (
        <section className="results-section">
          <h3>Masking Issues</h3>
          <div className="masking-list">
            {suggestions.masking.map((item, index) => (
              <div key={index} className="masking-item">
                <div className="masking-bands">{item.bands.join(' / ')}</div>
                <div className="masking-message">{item.message}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Stereo Suggestions */}
      {suggestions.stereo && (
        <section className="results-section">
          <h3>Stereo Suggestions</h3>
          {suggestions.stereo.overall && (
            <div className="suggestion-box">
              <div className="suggestion-message">{suggestions.stereo.overall.message}</div>
            </div>
          )}
          {suggestions.stereo.per_band && suggestions.stereo.per_band.length > 0 && (
            <div className="stereo-suggestions">
              {suggestions.stereo.per_band.map((item, index) => (
                <div key={index} className="suggestion-box">
                  <div className="suggestion-label">{item.band.replace('_', ' ')}</div>
                  <div className="suggestion-message">{item.message}</div>
                </div>
              ))}
            </div>
          )}
          {suggestions.stereo.phase && (
            <div className="suggestion-box warning">
              <div className="suggestion-message">{suggestions.stereo.phase.message}</div>
            </div>
          )}
        </section>
      )}
    </div>
  )
}

export default ResultsPanel
