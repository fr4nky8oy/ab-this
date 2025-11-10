import { useEffect, useRef, useState } from 'react'
import WaveSurfer from 'wavesurfer.js'
import RegionsPlugin from 'wavesurfer.js/plugins/regions'
import './WaveformSelector.css'

function WaveformSelector({ audioFile, label, color, onRegionChange }) {
  const containerRef = useRef(null)
  const wavesurferRef = useRef(null)
  const regionsPluginRef = useRef(null)
  const [duration, setDuration] = useState(0)
  const [regionStart, setRegionStart] = useState(0)
  const [regionEnd, setRegionEnd] = useState(40)

  useEffect(() => {
    if (!containerRef.current || !audioFile) return

    // Create wavesurfer instance
    const wavesurfer = WaveSurfer.create({
      container: containerRef.current,
      waveColor: color === 'blue' ? '#3b82f6' : '#10b981',
      progressColor: color === 'blue' ? '#60a5fa' : '#34d399',
      cursorColor: '#fff',
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      height: 100,
      normalize: true,
      backend: 'WebAudio',
    })

    // Register regions plugin
    const wsRegions = wavesurfer.registerPlugin(RegionsPlugin.create())
    regionsPluginRef.current = wsRegions

    // Load audio file
    wavesurfer.load(URL.createObjectURL(audioFile))

    // When audio is ready
    wavesurfer.on('ready', () => {
      const audioDuration = wavesurfer.getDuration()
      setDuration(audioDuration)

      // Create initial region (first 40 seconds or full duration if shorter)
      const initialEnd = Math.min(40, audioDuration)

      wsRegions.addRegion({
        start: 0,
        end: initialEnd,
        color: color === 'blue' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(16, 185, 129, 0.2)',
        drag: true,
        resize: true,
      })

      setRegionStart(0)
      setRegionEnd(initialEnd)

      // Notify parent component
      if (onRegionChange) {
        onRegionChange({
          start: 0,
          end: initialEnd,
          duration: initialEnd,
        })
      }
    })

    // Listen for region updates
    wsRegions.on('region-updated', (region) => {
      const start = region.start
      const end = region.end
      let adjustedEnd = end

      // Enforce 40-second maximum
      if (end - start > 40) {
        adjustedEnd = start + 40
        region.setOptions({ end: adjustedEnd })
      }

      setRegionStart(start)
      setRegionEnd(adjustedEnd)

      // Notify parent component
      if (onRegionChange) {
        onRegionChange({
          start: start,
          end: adjustedEnd,
          duration: adjustedEnd - start,
        })
      }
    })

    wavesurferRef.current = wavesurfer

    // Cleanup
    return () => {
      if (wavesurfer) {
        wavesurfer.destroy()
      }
    }
  }, [audioFile, color, onRegionChange])

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className={`waveform-selector waveform-${color}`}>
      <div className="waveform-header">
        <h4>{label}</h4>
        <span className="file-name">{audioFile?.name}</span>
      </div>

      <div ref={containerRef} className="waveform-container" />

      <div className="waveform-info">
        <div className="region-info">
          <span className="region-label">Selected Region:</span>
          <span className="region-time">
            {formatTime(regionStart)} - {formatTime(regionEnd)}
          </span>
          <span className={`region-duration ${regionEnd - regionStart > 40 ? 'warning' : ''}`}>
            ({(regionEnd - regionStart).toFixed(1)}s / 40s max)
          </span>
        </div>
        <div className="total-duration">
          Total: {formatTime(duration)}
        </div>
      </div>
    </div>
  )
}

export default WaveformSelector
