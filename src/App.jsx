import { useState, useRef } from 'react'
import FileUpload from './components/FileUpload'
import WaveformSelector from './components/WaveformSelector'
import AudioPlayer from './components/AudioPlayer'
import SpectrumChart from './components/SpectrumChart'
import ResultsPanel from './components/ResultsPanel'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function App() {
  const [yourMixFile, setYourMixFile] = useState(null)
  const [referenceFile, setReferenceFile] = useState(null)
  const [showWaveforms, setShowWaveforms] = useState(false)
  const [yourMixRegion, setYourMixRegion] = useState(null)
  const [referenceRegion, setReferenceRegion] = useState(null)
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const audioPlayerRef = useRef(null)

  const handleContinueToWaveforms = () => {
    if (!yourMixFile || !referenceFile) {
      setError('Please upload both audio files')
      return
    }
    setShowWaveforms(true)
    setError(null)
  }

  const handleAnalyze = async () => {
    if (!yourMixFile || !referenceFile) {
      setError('Please upload both audio files')
      return
    }

    console.log('=== ANALYZE BUTTON CLICKED ===')
    console.log('Your Mix Region:', yourMixRegion)
    console.log('Reference Region:', referenceRegion)

    setLoading(true)
    setError(null)
    setResults(null)

    const formData = new FormData()
    formData.append('your_mix', yourMixFile)
    formData.append('reference', referenceFile)

    // Add region data if available
    if (yourMixRegion) {
      console.log('Sending Your Mix region to backend:', yourMixRegion.start, 'to', yourMixRegion.end)
      formData.append('your_mix_start', yourMixRegion.start.toString())
      formData.append('your_mix_end', yourMixRegion.end.toString())
    } else {
      console.log('WARNING: No Your Mix region set!')
    }
    if (referenceRegion) {
      console.log('Sending Reference region to backend:', referenceRegion.start, 'to', referenceRegion.end)
      formData.append('reference_start', referenceRegion.start.toString())
      formData.append('reference_end', referenceRegion.end.toString())
    } else {
      console.log('WARNING: No Reference region set!')
    }

    try {
      const response = await fetch(`${API_URL}/api/compare`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.status}`)
      }

      const data = await response.json()
      setResults(data)
    } catch (err) {
      setError(err.message)
      console.error('Analysis error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setYourMixFile(null)
    setReferenceFile(null)
    setShowWaveforms(false)
    setYourMixRegion(null)
    setReferenceRegion(null)
    setResults(null)
    setError(null)
  }

  const handleBackToUpload = () => {
    setShowWaveforms(false)
    setYourMixRegion(null)
    setReferenceRegion(null)
    setError(null)
  }

  const handleSelectDifferentRegions = () => {
    // Keep the uploaded files but reset regions and results to go back to waveform selection
    setShowWaveforms(true)
    setYourMixRegion(null)
    setReferenceRegion(null)
    setResults(null)
    setError(null)
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>A/B This</h1>
        <p className="subtitle">Compare. Analyze. Mix better.</p>
      </header>

      <main className="app-main">
        {!results ? (
          !showWaveforms ? (
            // Phase 1: File Upload
            <div className="upload-section">
              <div className="upload-grid">
                <FileUpload
                  label="Your Mix"
                  file={yourMixFile}
                  onFileSelect={setYourMixFile}
                  color="blue"
                />
                <FileUpload
                  label="Reference Track"
                  file={referenceFile}
                  onFileSelect={setReferenceFile}
                  color="green"
                />
              </div>

              {error && (
                <div className="error-message">
                  ⚠️ {error}
                </div>
              )}

              <div className="action-buttons">
                <button
                  className="btn btn-primary"
                  onClick={handleContinueToWaveforms}
                  disabled={!yourMixFile || !referenceFile}
                >
                  Continue
                </button>
                {(yourMixFile || referenceFile) && (
                  <button className="btn btn-secondary" onClick={handleReset}>
                    Reset
                  </button>
                )}
              </div>
            </div>
          ) : (
            // Phase 2: Waveform Region Selection
            <div className="waveform-section">
              <div className="waveform-instructions">
                <h3>Select up to 40 seconds of audio to A/B</h3>
                <p>Drag the highlighted regions on the waveforms below to choose which part of each track to analyze</p>
              </div>

              <WaveformSelector
                audioFile={yourMixFile}
                label="Your Mix"
                color="blue"
                onRegionChange={setYourMixRegion}
              />

              <WaveformSelector
                audioFile={referenceFile}
                label="Reference Track"
                color="green"
                onRegionChange={setReferenceRegion}
              />

              {error && (
                <div className="error-message">
                  ⚠️ {error}
                </div>
              )}

              <div className="action-buttons">
                <button
                  className="btn btn-secondary"
                  onClick={handleBackToUpload}
                >
                  ← Back
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleAnalyze}
                  disabled={loading || !yourMixRegion || !referenceRegion}
                >
                  {loading ? 'Analyzing...' : 'Analyze Selected Regions'}
                </button>
              </div>

              {loading && (
                <div className="loading-indicator">
                  <div className="spinner"></div>
                  <p>Processing selected audio regions... This may take 10-20 seconds</p>
                </div>
              )}
            </div>
          )
        ) : (
          <div className="results-section">
            <div className="results-header">
              <h2>Analysis Results</h2>
              <button className="btn btn-secondary" onClick={handleReset}>
                New Comparison
              </button>
            </div>

            <AudioPlayer
              ref={audioPlayerRef}
              yourMixFile={yourMixFile}
              referenceFile={referenceFile}
              yourMixName={results.your_mix.filename}
              referenceName={results.reference.filename}
              yourMixRegion={yourMixRegion}
              referenceRegion={referenceRegion}
              onSelectDifferentRegions={handleSelectDifferentRegions}
            />

            <SpectrumChart
              yourMixData={results.your_mix.spectrum_data}
              referenceData={results.reference.spectrum_data}
            />

            <ResultsPanel
              results={results}
              audioPlayerRef={audioPlayerRef}
              yourMixFilename={yourMixFile?.name}
              referenceFilename={referenceFile?.name}
            />
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>Processing time: {results ? `${results.processing_time}s` : '—'}</p>
      </footer>
    </div>
  )
}

export default App
