import { useState, useRef, useEffect } from 'react'
import './AudioPlayer.css'

function AudioPlayer({ yourMixFile, referenceFile, yourMixName, referenceName }) {
  const [playing, setPlaying] = useState(null) // 'your' or 'reference' or null
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  const yourAudioRef = useRef(null)
  const refAudioRef = useRef(null)
  const audioContextRef = useRef(null)

  useEffect(() => {
    // Create audio elements
    if (yourMixFile) {
      yourAudioRef.current = new Audio(URL.createObjectURL(yourMixFile))
      yourAudioRef.current.addEventListener('loadedmetadata', () => {
        setDuration(yourAudioRef.current.duration)
      })
      yourAudioRef.current.addEventListener('timeupdate', () => {
        setCurrentTime(yourAudioRef.current.currentTime)
      })
      yourAudioRef.current.addEventListener('ended', () => {
        setPlaying(null)
      })
    }

    if (referenceFile) {
      refAudioRef.current = new Audio(URL.createObjectURL(referenceFile))
      refAudioRef.current.addEventListener('loadedmetadata', () => {
        if (!duration) setDuration(refAudioRef.current.duration)
      })
      refAudioRef.current.addEventListener('timeupdate', () => {
        setCurrentTime(refAudioRef.current.currentTime)
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
  }, [yourMixFile, referenceFile])

  const playYourMix = () => {
    if (playing === 'your') {
      yourAudioRef.current.pause()
      setPlaying(null)
    } else {
      if (refAudioRef.current) refAudioRef.current.pause()
      yourAudioRef.current.currentTime = currentTime
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
      refAudioRef.current.currentTime = currentTime
      refAudioRef.current.play()
      setPlaying('reference')
    }
  }

  const togglePlayback = () => {
    if (playing === 'your') {
      yourAudioRef.current.pause()
      refAudioRef.current.currentTime = currentTime
      refAudioRef.current.play()
      setPlaying('reference')
    } else if (playing === 'reference') {
      refAudioRef.current.pause()
      yourAudioRef.current.currentTime = currentTime
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
    if (yourAudioRef.current) yourAudioRef.current.currentTime = newTime
    if (refAudioRef.current) refAudioRef.current.currentTime = newTime
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="audio-player">
      <h3>A/B Playback</h3>

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
        {!playing && <span className="now-playing-idle">Ready to play</span>}
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
}

export default AudioPlayer
