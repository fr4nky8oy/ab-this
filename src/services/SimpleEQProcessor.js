/**
 * Simple EQ Processor
 * Minimal Web Audio API implementation for single-band EQ preview
 */

export class SimpleEQProcessor {
  constructor() {
    this.audioContext = null
    this.sourceNode = null
    this.filterNode = null
    this.bypassGain = null
    this.eqGain = null
    this.outputGain = null
    this.eqEnabled = false
    this.audioElement = null
  }

  async initialize() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext
      this.audioContext = new AudioContext()

      // Resume if suspended (iOS requirement)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume()
      }

      // Create dual-path routing: bypass and EQ
      this.bypassGain = this.audioContext.createGain()
      this.eqGain = this.audioContext.createGain()
      this.outputGain = this.audioContext.createGain()

      // Initially bypass is on (1), EQ is off (0)
      this.bypassGain.gain.value = 1
      this.eqGain.gain.value = 0

      // Connect bypass path directly
      this.bypassGain.connect(this.outputGain)

      // Output to speakers
      this.outputGain.connect(this.audioContext.destination)

      console.log('SimpleEQProcessor initialized')
      return true
    } catch (error) {
      console.error('Failed to initialize AudioContext:', error)
      throw new Error('Web Audio API not supported')
    }
  }

  connectAudioElement(audioElement) {
    try {
      // Store reference
      this.audioElement = audioElement

      // Create MediaElementSource from the audio element
      this.sourceNode = this.audioContext.createMediaElementSource(audioElement)

      // Connect source to both bypass and EQ paths
      this.sourceNode.connect(this.bypassGain)
      this.sourceNode.connect(this.eqGain)

      console.log('SimpleEQProcessor: Connected to audio element')
      return true
    } catch (error) {
      console.error('Failed to connect audio element:', error)
      throw new Error('Could not connect audio element')
    }
  }

  setEQ(frequency, gainDb, q) {
    try {
      // Clear existing filter
      if (this.filterNode) {
        this.filterNode.disconnect()
      }

      // Create single peaking filter
      this.filterNode = this.audioContext.createBiquadFilter()
      this.filterNode.type = 'peaking'
      this.filterNode.frequency.value = frequency
      this.filterNode.Q.value = q
      this.filterNode.gain.value = gainDb

      // Connect EQ path: eqGain -> filter -> output
      this.eqGain.connect(this.filterNode)
      this.filterNode.connect(this.outputGain)

      console.log(`SimpleEQProcessor: EQ set - ${frequency}Hz, ${gainDb}dB, Q:${q}`)
      return true
    } catch (error) {
      console.error('Failed to setup EQ:', error)
      throw error
    }
  }

  toggleEQ() {
    if (!this.audioContext) return false

    const now = this.audioContext.currentTime
    const fadeTime = 0.02 // 20ms crossfade to avoid clicks

    if (this.eqEnabled) {
      // Switch to bypass (original audio)
      this.bypassGain.gain.linearRampToValueAtTime(1, now + fadeTime)
      this.eqGain.gain.linearRampToValueAtTime(0, now + fadeTime)
    } else {
      // Switch to EQ (processed audio)
      this.bypassGain.gain.linearRampToValueAtTime(0, now + fadeTime)
      this.eqGain.gain.linearRampToValueAtTime(1, now + fadeTime)
    }

    this.eqEnabled = !this.eqEnabled
    console.log('SimpleEQProcessor: EQ', this.eqEnabled ? 'ON' : 'OFF')
    return this.eqEnabled
  }

  getEQEnabled() {
    return this.eqEnabled
  }

  dispose() {
    try {
      if (this.filterNode) this.filterNode.disconnect()
      if (this.bypassGain) this.bypassGain.disconnect()
      if (this.eqGain) this.eqGain.disconnect()
      if (this.outputGain) this.outputGain.disconnect()

      if (this.audioContext && this.audioContext.state !== 'closed') {
        this.audioContext.close()
      }

      this.audioBuffer = null
      this.audioContext = null
      console.log('SimpleEQProcessor disposed')
    } catch (error) {
      console.error('Error disposing EQ processor:', error)
    }
  }
}
