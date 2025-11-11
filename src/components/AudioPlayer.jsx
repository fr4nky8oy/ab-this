import { useState, useRef, useEffect, useImperativeHandle, forwardRef } from 'react'
import { MultiBandEQProcessor } from '../services/MultiBandEQProcessor'
import './AudioPlayer.css'

const AudioPlayer = forwardRef(({ yourMixFile, referenceFile, yourMixName, referenceName, yourMixRegion, referenceRegion }, ref) => {
  const [playing, setPlaying] = useState(null) // 'your' or 'reference' or null
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [loopEnabled, setLoopEnabled] = useState(false)

  const yourAudioRef = useRef(null)
  const refAudioRef = useRef(null)
  const eqProcessorRef = useRef(null)
  const eqConnectedRef = useRef(false)

  useEffect(() => {
    if (!yourMixFile || !referenceFile) return

    console.log('AudioPlayer setup - Regions:', { yourMixRegion, referenceRegion })

    // Calculate region durations
    const yourRegionDuration = yourMixRegion ? (yourMixRegion.end - yourMixRegion.start) : 0
    const refRegionDuration = referenceRegion ? (referenceRegion.end - referenceRegion.start) : 0
    const regionDuration = Math.max(yourRegionDuration, refRegionDuration)

    // Create Your Mix audio element
    if (yourMixFile) {
      yourAudioRef.current = new Audio(URL.createObjectURL(yourMixFile))

      yourAudioRef.current.addEventListener('loadedmetadata', () => {
        console.log('Your Mix metadata loaded')
        if (yourMixRegion) {
          console.log('Setting Your Mix to start at:', yourMixRegion.start, 'seconds')
          // Set audio to start at region start
          yourAudioRef.current.currentTime = yourMixRegion.start
          setDuration(yourMixRegion.duration || regionDuration)
          setCurrentTime(0) // Display starts at 0:00 (relative to region start)
          console.log('Your Mix currentTime set to:', yourAudioRef.current.currentTime)
        } else {
          console.log('No region for Your Mix - using full file')
          setDuration(yourAudioRef.current.duration)
        }
      })

      yourAudioRef.current.addEventListener('timeupdate', () => {
        if (yourMixRegion) {
          // Calculate time relative to region start
          const relativeTime = yourAudioRef.current.currentTime - yourMixRegion.start
          setCurrentTime(Math.max(0, relativeTime))

          // Loop or stop at region end
          if (yourAudioRef.current.currentTime >= yourMixRegion.end) {
            if (loopEnabled) {
              yourAudioRef.current.currentTime = yourMixRegion.start
            } else {
              yourAudioRef.current.pause()
              setPlaying(null)
            }
          }
        } else {
          setCurrentTime(yourAudioRef.current.currentTime)
        }
      })

      yourAudioRef.current.addEventListener('ended', () => {
        setPlaying(null)
      })
    }

    // Create Reference audio element
    if (referenceFile) {
      refAudioRef.current = new Audio(URL.createObjectURL(referenceFile))

      refAudioRef.current.addEventListener('loadedmetadata', () => {
        console.log('Reference metadata loaded')
        if (referenceRegion) {
          console.log('Setting Reference to start at:', referenceRegion.start, 'seconds')
          // Set audio to start at region start
          refAudioRef.current.currentTime = referenceRegion.start
          if (!duration) setDuration(referenceRegion.duration || regionDuration)
          setCurrentTime(0) // Display starts at 0:00 (relative to region start)
          console.log('Reference currentTime set to:', refAudioRef.current.currentTime)
        } else {
          console.log('No region for Reference - using full file')
          if (!duration) setDuration(refAudioRef.current.duration)
        }
      })

      refAudioRef.current.addEventListener('timeupdate', () => {
        if (referenceRegion) {
          // Calculate time relative to region start
          const relativeTime = refAudioRef.current.currentTime - referenceRegion.start
          setCurrentTime(Math.max(0, relativeTime))

          // Loop or stop at region end
          if (refAudioRef.current.currentTime >= referenceRegion.end) {
            if (loopEnabled) {
              refAudioRef.current.currentTime = referenceRegion.start
            } else {
              refAudioRef.current.pause()
              setPlaying(null)
            }
          }
        } else {
          setCurrentTime(refAudioRef.current.currentTime)
        }
      })

      refAudioRef.current.addEventListener('ended', () => {
        setPlaying(null)
      })
    }

    return () => {
      if (yourAudioRef.current) {
        yourAudioRef.current.pause()
        URL.revokeObjectURL(yourAudioRef.current.src)
      }
      if (refAudioRef.current) {
        refAudioRef.current.pause()
        URL.revokeObjectURL(refAudioRef.current.src)
      }
    }
  }, [yourMixFile, referenceFile, yourMixRegion, referenceRegion, loopEnabled])

  const playYourMix = () => {
    if (playing === 'your') {
      yourAudioRef.current.pause()
      setPlaying(null)
    } else {
      if (refAudioRef.current) refAudioRef.current.pause()

      // If region exists, convert relative time to absolute time
      if (yourMixRegion) {
        const absoluteTime = yourMixRegion.start + currentTime
        console.log('Playing Your Mix from:', absoluteTime, '(region start:', yourMixRegion.start, '+ current:', currentTime, ')')
        yourAudioRef.current.currentTime = absoluteTime
      } else {
        yourAudioRef.current.currentTime = currentTime
      }

      yourAudioRef.current.play()
      setPlaying('your')
    }
  }

  const playReference = () => {
    if (playing === 'reference') {
      refAudioRef.current.pause()
      setPlaying(null)
    } else {
      if (yourAudioRef.current) yourAudioRef.current.pause()

      // If region exists, convert relative time to absolute time
      if (referenceRegion) {
        refAudioRef.current.currentTime = referenceRegion.start + currentTime
      } else {
        refAudioRef.current.currentTime = currentTime
      }

      refAudioRef.current.play()
      setPlaying('reference')
    }
  }

  const togglePlayback = () => {
    if (playing === 'your') {
      yourAudioRef.current.pause()

      // Convert relative time to absolute time for reference
      if (referenceRegion) {
        refAudioRef.current.currentTime = referenceRegion.start + currentTime
      } else {
        refAudioRef.current.currentTime = currentTime
      }

      refAudioRef.current.play()
      setPlaying('reference')
    } else if (playing === 'reference') {
      refAudioRef.current.pause()

      // Convert relative time to absolute time for your mix
      if (yourMixRegion) {
        yourAudioRef.current.currentTime = yourMixRegion.start + currentTime
      } else {
        yourAudioRef.current.currentTime = currentTime
      }

      yourAudioRef.current.play()
      setPlaying('your')
    }
  }

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = x / rect.width
    const newTime = percentage * duration

    setCurrentTime(newTime)

    // Convert relative time to absolute time for regions
    if (yourAudioRef.current) {
      if (yourMixRegion) {
        yourAudioRef.current.currentTime = yourMixRegion.start + newTime
      } else {
        yourAudioRef.current.currentTime = newTime
      }
    }

    if (refAudioRef.current) {
      if (referenceRegion) {
        refAudioRef.current.currentTime = referenceRegion.start + newTime
      } else {
        refAudioRef.current.currentTime = newTime
      }
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatTimeSeconds = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Expose EQ methods to parent via ref
  useImperativeHandle(ref, () => ({
    async initializeAllEQ(eqSuggestions) {
      try {
        if (!yourAudioRef.current) {
          throw new Error('Audio element not ready')
        }

        // Initialize processor if not already done
        if (!eqProcessorRef.current) {
          console.log('AudioPlayer: Initializing MultiBand EQ processor...')
          const processor = new MultiBandEQProcessor()
          await processor.initialize()
          eqProcessorRef.current = processor
        }

        // Connect to audio element if not already connected
        if (!eqConnectedRef.current) {
          console.log('AudioPlayer: Connecting EQ to Your Mix audio element...')
          eqProcessorRef.current.connectAudioElement(yourAudioRef.current)
          eqConnectedRef.current = true
        }

        // Initialize all bands
        eqProcessorRef.current.initializeAllBands(eqSuggestions)
        console.log(`AudioPlayer: Initialized ${eqSuggestions.length} EQ bands`)
        return true
      } catch (error) {
        console.error('AudioPlayer: Failed to initialize EQ:', error)
        throw error
      }
    },

    toggleMasterEQ() {
      if (!eqProcessorRef.current) {
        throw new Error('EQ not initialized')
      }
      return eqProcessorRef.current.toggleMaster()
    },

    toggleBand(bandIndex, enabled) {
      if (!eqProcessorRef.current) {
        throw new Error('EQ not initialized')
      }
      return eqProcessorRef.current.toggleBand(bandIndex, enabled)
    },

    setWetDry(percentage) {
      if (!eqProcessorRef.current) {
        throw new Error('EQ not initialized')
      }
      return eqProcessorRef.current.setWetDry(percentage)
    },

    getMasterEnabled() {
      return eqProcessorRef.current?.getMasterEnabled() || false
    },

    getWetDry() {
      return eqProcessorRef.current?.getWetDry() || 100
    },

    getBandEnabled(bandIndex) {
      return eqProcessorRef.current?.getBandEnabled(bandIndex) || false
    }
  }))

  // Cleanup EQ processor on unmount
  useEffect(() => {
    return () => {
      if (eqProcessorRef.current) {
        eqProcessorRef.current.dispose()
      }
    }
  }, [])

  return (
    <div className="audio-player">
      <h3>A/B Playback</h3>

      {(yourMixRegion || referenceRegion) && (
        <div className="region-info-display" style={{
          background: 'rgba(59, 130, 246, 0.1)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          borderRadius: '8px',
          padding: '12px',
          marginBottom: '16px',
          fontSize: '14px'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Analyzed Regions:</div>
          {yourMixRegion && (
            <div style={{ marginBottom: '4px' }}>
              <span style={{ color: '#3b82f6' }}>▶ Your Mix:</span> {formatTimeSeconds(yourMixRegion.start)} - {formatTimeSeconds(yourMixRegion.end)} ({yourMixRegion.duration?.toFixed(1)}s)
            </div>
          )}
          {referenceRegion && (
            <div>
              <span style={{ color: '#10b981' }}>▶ Reference:</span> {formatTimeSeconds(referenceRegion.start)} - {formatTimeSeconds(referenceRegion.end)} ({referenceRegion.duration?.toFixed(1)}s)
            </div>
          )}
        </div>
      )}

      <div className="player-controls">
        <button
          className={`play-btn play-btn-blue ${playing === 'your' ? 'active' : ''}`}
          onClick={playYourMix}
        >
          {playing === 'your' ? '⏸' : '▶'} Your Mix
        </button>

        <button
          className="toggle-btn"
          onClick={togglePlayback}
          disabled={!playing}
        >
          ⇄ Switch
        </button>

        <button
          className={`play-btn play-btn-green ${playing === 'reference' ? 'active' : ''}`}
          onClick={playReference}
        >
          {playing === 'reference' ? '⏸' : '▶'} Reference
        </button>
      </div>

      <div className="playback-info">
        {playing === 'your' && <span className="now-playing">▶ {yourMixName}</span>}
        {playing === 'reference' && <span className="now-playing">▶ {referenceName}</span>}
        {!playing && (
          <div className="playback-info-idle">
            <span className="now-playing-idle">Ready to play</span>
            <button
              className={`loop-btn ${loopEnabled ? 'active' : ''}`}
              onClick={() => setLoopEnabled(!loopEnabled)}
              title={loopEnabled ? 'Loop enabled' : 'Loop disabled'}
            >
              🔁
            </button>
          </div>
        )}
      </div>

      <div className="timeline">
        <span className="time">{formatTime(currentTime)}</span>
        <div className="progress-bar" onClick={handleSeek}>
          <div
            className="progress-fill"
            style={{ width: `${(currentTime / duration) * 100}%` }}
          />
        </div>
        <span className="time">{formatTime(duration)}</span>
      </div>
    </div>
  )
})

AudioPlayer.displayName = 'AudioPlayer'

export default AudioPlayer
