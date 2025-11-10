import { useEffect, useRef, useState } from 'react'
import WaveSurfer from 'wavesurfer.js'
import RegionsPlugin from 'wavesurfer.js/plugins/regions'
import './WaveformSelector.css'

function WaveformSelector({ audioFile, label, color, onRegionChange }) {
  const containerRef = useRef(null)
  const wavesurferRef = useRef(null)
  const regionsPluginRef = useRef(null)
  const activeRegionRef = useRef(null)
  const onRegionChangeRef = useRef(onRegionChange)
  const [duration, setDuration] = useState(0)
  const [regionStart, setRegionStart] = useState(0)
  const [regionEnd, setRegionEnd] = useState(40)
  const [isPlaying, setIsPlaying] = useState(false)

  // Keep the callback ref up to date
  useEffect(() => {
    onRegionChangeRef.current = onRegionChange
  }, [onRegionChange])

  useEffect(() => {
    if (!containerRef.current || !audioFile) return

    let dragDebounceTimer = null

    // Inject CSS for white region handles
    const style = document.createElement('style')
    style.textContent = `
      .wavesurfer-region::before,
      .wavesurfer-region::after {
        background: white !important;
        width: 3px !important;
      }
      .wavesurfer-handle {
        background: white !important;
        width: 3px !important;
      }
    `
    document.head.appendChild(style)

    // Create wavesurfer instance
    const wavesurfer = WaveSurfer.create({
      container: containerRef.current,
      waveColor: color === 'blue' ? '#3b82f6' : '#10b981',
      progressColor: color === 'blue' ? '#3b82f6' : '#10b981', // Keep same as waveColor
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
      console.log(`WaveformSelector (${label}): Audio ready, duration:`, audioDuration)

      // Create initial region (first 40 seconds or full duration if shorter)
      const initialEnd = Math.min(40, audioDuration)

      const region = wsRegions.addRegion({
        start: 0,
        end: initialEnd,
        color: 'rgba(255, 255, 255, 0.3)', // White overlay for selected region
        drag: true,
        resize: true,
      })

      activeRegionRef.current = region

      setRegionStart(0)
      setRegionEnd(initialEnd)

      console.log(`WaveformSelector (${label}): Initial region created 0 -> ${initialEnd}`)

      // Notify parent component
      if (onRegionChangeRef.current) {
        onRegionChangeRef.current({
          start: 0,
          end: initialEnd,
          duration: initialEnd,
        })
      }
    })

    // Listen for region updates during drag/resize - update display AND debounce parent notification
    wsRegions.on('region-updated', (region) => {
      console.log(`WaveformSelector (${label}): region-updated event - ${region.start.toFixed(1)} -> ${region.end.toFixed(1)}`)
      const start = region.start
      const end = region.end

      // Update state for display immediately
      setRegionStart(start)
      setRegionEnd(end)

      // Clear previous timer
      if (dragDebounceTimer) {
        clearTimeout(dragDebounceTimer)
      }

      // Wait 500ms after last drag movement, then notify parent
      dragDebounceTimer = setTimeout(() => {
        console.log(`WaveformSelector (${label}): Drag finished (debounced), notifying parent`)
        handleRegionEnd(region)
      }, 500)
    })

    // Listen for ALL region events to debug
    wsRegions.on('region-clicked', (region) => {
      console.log(`WaveformSelector (${label}): region-clicked`)
    })

    wsRegions.on('region-in', (region) => {
      console.log(`WaveformSelector (${label}): region-in`)
    })

    wsRegions.on('region-out', (region) => {
      console.log(`WaveformSelector (${label}): region-out - ${region.start.toFixed(1)} -> ${region.end.toFixed(1)}`)
      handleRegionEnd(region)
    })

    // Listen for region updates when drag/resize ends - enforce limits and notify parent
    wsRegions.on('region-update-end', (region) => {
      console.log(`WaveformSelector (${label}): region-update-end event - ${region.start.toFixed(1)} -> ${region.end.toFixed(1)}`)
      handleRegionEnd(region)
    })

    const handleRegionEnd = (region) => {
      let start = region.start
      let end = region.end
      let adjustedStart = start
      let adjustedEnd = end
      let needsAdjustment = false

      // Enforce 40-second maximum
      if (end - start > 40) {
        adjustedEnd = start + 40
        needsAdjustment = true
      }

      // Ensure region doesn't go beyond audio duration
      if (adjustedEnd > audioDuration) {
        adjustedEnd = audioDuration
        adjustedStart = Math.max(0, adjustedEnd - 40)
        needsAdjustment = true
      }

      // Apply adjustments if needed
      if (needsAdjustment) {
        region.setOptions({ start: adjustedStart, end: adjustedEnd })
      }

      // Update state for display
      setRegionStart(adjustedStart)
      setRegionEnd(adjustedEnd)
      activeRegionRef.current = region

      // Notify parent component
      if (onRegionChangeRef.current) {
        console.log(`WaveformSelector (${label}): Notifying parent of region change: ${adjustedStart.toFixed(1)} -> ${adjustedEnd.toFixed(1)}`)
        onRegionChangeRef.current({
          start: adjustedStart,
          end: adjustedEnd,
          duration: adjustedEnd - adjustedStart,
        })
      } else {
        console.log(`WaveformSelector (${label}): WARNING - onRegionChangeRef.current is null!`)
      }
    }

    // Stop playback when audio finishes
    wavesurfer.on('finish', () => {
      setIsPlaying(false)
    })

    wavesurfer.on('pause', () => {
      setIsPlaying(false)
    })

    wavesurfer.on('play', () => {
      setIsPlaying(true)
    })

    wavesurferRef.current = wavesurfer

    // Cleanup
    return () => {
      // Clear debounce timer
      if (dragDebounceTimer) {
        clearTimeout(dragDebounceTimer)
      }

      if (wavesurfer) {
        wavesurfer.destroy()
      }
      if (style && style.parentNode) {
        style.parentNode.removeChild(style)
      }
    }
  }, [audioFile, color]) // Removed onRegionChange to prevent recreation loop

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handlePlayRegion = () => {
    if (!wavesurferRef.current || !activeRegionRef.current) return

    if (isPlaying) {
      wavesurferRef.current.pause()
    } else {
      // Play only the selected region
      activeRegionRef.current.play()
    }
  }

  return (
    <div className={`waveform-selector waveform-${color}`}>
      <div className="waveform-header">
        <h4>{label}</h4>
        <span className="file-name">{audioFile?.name}</span>
      </div>

      <div ref={containerRef} className="waveform-container" />

      <div className="waveform-controls">
        <button
          className={`play-region-btn ${isPlaying ? 'playing' : ''}`}
          onClick={handlePlayRegion}
        >
          {isPlaying ? '⏸ Pause' : '▶ Play Selected Region'}
        </button>
      </div>

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
