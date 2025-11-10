import { useState } from 'react'
import FileUpload from './components/FileUpload'
import AudioPlayer from './components/AudioPlayer'
import SpectrumChart from './components/SpectrumChart'
import ResultsPanel from './components/ResultsPanel'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function App() {
  const [yourMixFile, setYourMixFile] = useState(null)
  const [referenceFile, setReferenceFile] = useState(null)
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleAnalyze = async () => {
    if (!yourMixFile || !referenceFile) {
      setError('Please upload both audio files')
      return
    }

    setLoading(true)
    setError(null)
    setResults(null)

    const formData = new FormData()
    formData.append('your_mix', yourMixFile)
    formData.append('reference', referenceFile)

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
    setResults(null)
    setError(null)
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>A/B This</h1>
        <p className="subtitle">Compare your mix to reference tracks with professional analysis</p>
      </header>

      <main className="app-main">
        {!results ? (
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
                onClick={handleAnalyze}
                disabled={!yourMixFile || !referenceFile || loading}
              >
                {loading ? 'Analyzing...' : 'Analyze'}
              </button>
              {(yourMixFile || referenceFile) && (
                <button className="btn btn-secondary" onClick={handleReset}>
                  Reset
                </button>
              )}
            </div>

            {loading && (
              <div className="loading-indicator">
                <div className="spinner"></div>
                <p>Processing audio files... This may take 10-20 seconds</p>
              </div>
            )}
          </div>
        ) : (
          <div className="results-section">
            <div className="results-header">
              <h2>Analysis Results</h2>
              <button className="btn btn-secondary" onClick={handleReset}>
                New Comparison
              </button>
            </div>

            <AudioPlayer
              yourMixFile={yourMixFile}
              referenceFile={referenceFile}
              yourMixName={results.your_mix.filename}
              referenceName={results.reference.filename}
            />

            <SpectrumChart
              yourMixData={results.your_mix.spectrum_data}
              referenceData={results.reference.spectrum_data}
            />

            <ResultsPanel results={results} />
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
