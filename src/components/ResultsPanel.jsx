import { useState } from 'react'
import './ResultsPanel.css'
import { generatePDFReport } from '../utils/pdfGenerator'

function ResultsPanel({ results, audioPlayerRef, yourMixFilename, referenceFilename }) {
  const { your_mix, reference, comparison, suggestions } = results

  // EQ state
  const [masterEqEnabled, setMasterEqEnabled] = useState(false)
  const [eqProcessing, setEqProcessing] = useState(false)
  const [wetDry, setWetDry] = useState(100) // 0-100%
  const [bandStates, setBandStates] = useState([]) // Array of enabled states for each band

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

  // Handle Master EQ toggle
  const handleMasterEQToggle = async () => {
    if (eqProcessing || !audioPlayerRef?.current) return

    setEqProcessing(true)

    try {
      const eqSuggestions = suggestions?.eq_adjustments
      if (!eqSuggestions || eqSuggestions.length === 0) {
        console.error('No EQ suggestions available')
        setEqProcessing(false)
        return
      }

      // Initialize all EQ bands if not already done
      if (!masterEqEnabled) {
        console.log('ResultsPanel: Initializing all EQ bands via AudioPlayer...')
        await audioPlayerRef.current.initializeAllEQ(eqSuggestions)

        // Initialize band states (all enabled by default)
        setBandStates(eqSuggestions.map(() => true))
      }

      // Toggle master EQ
      const newState = audioPlayerRef.current.toggleMasterEQ()
      setMasterEqEnabled(newState)
      console.log('ResultsPanel: Master EQ toggled to', newState ? 'ON' : 'OFF')
    } catch (error) {
      console.error('Error toggling master EQ:', error)
      alert('Failed to toggle EQ: ' + error.message)
    } finally {
      setEqProcessing(false)
    }
  }

  // Handle wet/dry slider change
  const handleWetDryChange = (e) => {
    const newWetDry = parseFloat(e.target.value)
    setWetDry(newWetDry)

    if (audioPlayerRef?.current && masterEqEnabled) {
      try {
        audioPlayerRef.current.setWetDry(newWetDry)
        console.log('ResultsPanel: Wet/Dry set to', newWetDry, '%')
      } catch (error) {
        console.error('Error updating wet/dry:', error)
      }
    }
  }

  // Handle individual band toggle
  const handleBandToggle = (bandIndex) => {
    if (!audioPlayerRef?.current || !masterEqEnabled) return

    try {
      const newState = !bandStates[bandIndex]
      audioPlayerRef.current.toggleBand(bandIndex, newState)

      // Update band states
      const newBandStates = [...bandStates]
      newBandStates[bandIndex] = newState
      setBandStates(newBandStates)

      console.log('ResultsPanel: Band', bandIndex, 'toggled to', newState ? 'ON' : 'OFF')
    } catch (error) {
      console.error('Error toggling band:', error)
    }
  }

  // Handle PDF download
  const handleDownloadPDF = () => {
    try {
      generatePDFReport(results, yourMixFilename || 'Your Mix', referenceFilename || 'Reference')
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Failed to generate PDF report: ' + error.message)
    }
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

      {/* EQ Suggestions Section */}
      {suggestions.eq_adjustments && suggestions.eq_adjustments.length > 0 && (
        <section className="results-section eq-section">
          <div className="eq-section-header">
            <h3>EQ Suggestions</h3>
            {audioPlayerRef && (
              <div className="eq-master-controls">
                <button
                  className={`eq-master-toggle ${masterEqEnabled ? 'active' : ''}`}
                  onClick={handleMasterEQToggle}
                  disabled={eqProcessing}
                >
                  {eqProcessing ? 'Loading...' : (masterEqEnabled ? 'Master EQ: ON' : 'Master EQ: OFF')}
                </button>
                <div className="eq-wetdry-control">
                  <label className="eq-wetdry-label">
                    Wet/Dry: {wetDry.toFixed(0)}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={wetDry}
                    onChange={handleWetDryChange}
                    disabled={!masterEqEnabled}
                    className="eq-wetdry-slider"
                  />
                </div>
              </div>
            )}
          </div>
          <div className="eq-list">
            {suggestions.eq_adjustments.slice(0, 10).map((eq, index) => (
              <div key={index} className="eq-item eq-item-multiband">
                <div className="eq-content">
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
                {audioPlayerRef && (
                  <button
                    className={`eq-band-toggle ${bandStates[index] ? 'active' : ''}`}
                    onClick={() => handleBandToggle(index)}
                    disabled={!masterEqEnabled}
                  >
                    {bandStates[index] ? 'ON' : 'OFF'}
                  </button>
                )}
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
            <div className="comparison-text">{safe(comparison?.dynamics?.loudness_comparison?.description)}</div>
            <div className="metric-row">
              <span>LUFS Difference:</span>
              <span>{comparison?.dynamics?.loudness_comparison?.lufs_difference > 0 ? '+' : ''}{safeFixed(comparison?.dynamics?.loudness_comparison?.lufs_difference)} LUFS</span>
            </div>
          </div>
        </div>

        {/* Dynamic Suggestions */}
        <div className="dynamics-suggestions">
          <h4>Suggestions</h4>
          {(suggestions.crest_factor || suggestions.compression || suggestions.gain || suggestions.limiting) ? (
            <>
              {suggestions.crest_factor && (
                <div className="suggestion-box">
                  <div className="suggestion-label">Crest Factor / Dynamic Range</div>
                  <div className="suggestion-message">{suggestions.crest_factor.message}</div>
                </div>
              )}
              {suggestions.compression && (
                <div className="suggestion-box">
                  <div className="suggestion-label">Compression</div>
                  <div className="suggestion-message">{suggestions.compression.message}</div>
                </div>
              )}
              {suggestions.gain && (
                <div className="suggestion-box">
                  <div className="suggestion-label">Gain Adjustment</div>
                  <div className="suggestion-message">{suggestions.gain.message}</div>
                </div>
              )}
              {suggestions.limiting && (
                <div className="suggestion-box">
                  <div className="suggestion-label">Limiting</div>
                  <div className="suggestion-message">{suggestions.limiting.message}</div>
                </div>
              )}
            </>
          ) : (
            <div className="suggestion-box success">
              <div className="suggestion-message">✓ Your dynamics are well-matched to the reference. No adjustments needed.</div>
            </div>
          )}
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

      {/* Download PDF Button */}
      <section className="results-section download-section">
        <button
          className="download-pdf-button"
          onClick={handleDownloadPDF}
        >
          📄 Download PDF Report
        </button>
      </section>
    </div>
  )
}

export default ResultsPanel
