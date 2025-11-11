/**
 * Multi-Band EQ Processor
 * Web Audio API implementation for multiple simultaneous EQ bands with wet/dry control
 */

export class MultiBandEQProcessor {
  constructor() {
    this.audioContext = null
    this.sourceNode = null
    this.bands = [] // Array of {filter, gain, enabled, config}
    this.bypassGain = null
    this.eqChainInputGain = null
    this.eqChainOutputGain = null
    this.wetGain = null
    this.dryGain = null
    this.outputGain = null
    this.masterEnabled = false
    this.wetDryValue = 100 // 0-100%
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

      // Create wet/dry mixing architecture
      this.dryGain = this.audioContext.createGain()
      this.wetGain = this.audioContext.createGain()
      this.outputGain = this.audioContext.createGain()
      this.eqChainInputGain = this.audioContext.createGain()
      this.eqChainOutputGain = this.audioContext.createGain()

      // Initially dry (bypass) at 100%, wet (EQ) at 0%
      this.dryGain.gain.value = 1
      this.wetGain.gain.value = 0

      // Connect dry path directly to output
      this.dryGain.connect(this.outputGain)

      // EQ chain will be: eqChainInputGain -> [filters] -> eqChainOutputGain -> wetGain -> output
      this.eqChainOutputGain.connect(this.wetGain)
      this.wetGain.connect(this.outputGain)

      // Output to speakers
      this.outputGain.connect(this.audioContext.destination)

      console.log('MultiBandEQProcessor initialized')
      return true
    } catch (error) {
      console.error('Failed to initialize AudioContext:', error)
      throw new Error('Web Audio API not supported')
    }
  }

  connectAudioElement(audioElement) {
    try {
      this.audioElement = audioElement

      // Create MediaElementSource from the audio element
      this.sourceNode = this.audioContext.createMediaElementSource(audioElement)

      // Connect source to both dry and wet (EQ) paths
      this.sourceNode.connect(this.dryGain)
      this.sourceNode.connect(this.eqChainInputGain)

      console.log('MultiBandEQProcessor: Connected to audio element')
      return true
    } catch (error) {
      console.error('Failed to connect audio element:', error)
      throw new Error('Could not connect audio element')
    }
  }

  initializeAllBands(eqSuggestions) {
    try {
      // Clear existing bands
      this.clearAllBands()

      // Create filters for all suggestions
      let previousNode = this.eqChainInputGain

      eqSuggestions.forEach((eq, index) => {
        // Create biquad filter
        const filter = this.audioContext.createBiquadFilter()
        filter.type = 'peaking'
        filter.frequency.value = eq.frequency
        filter.Q.value = eq.q
        filter.gain.value = eq.gain_db

        // Create gain node for this band (to enable/disable)
        const gainNode = this.audioContext.createGain()
        gainNode.gain.value = 1 // Start with all bands enabled

        // Chain: previous -> filter -> gain -> next
        previousNode.connect(filter)
        filter.connect(gainNode)

        // Store band info
        this.bands.push({
          filter: filter,
          gain: gainNode,
          enabled: true, // All start enabled
          config: {
            frequency: eq.frequency,
            q: eq.q,
            gain_db: eq.gain_db,
            type: eq.type,
            message: eq.message
          }
        })

        previousNode = gainNode
      })

      // Connect last band to output
      if (this.bands.length > 0) {
        previousNode.connect(this.eqChainOutputGain)
      }

      console.log(`MultiBandEQProcessor: Initialized ${this.bands.length} EQ bands`)
      return true
    } catch (error) {
      console.error('Failed to initialize bands:', error)
      throw error
    }
  }

  toggleBand(bandIndex, enabled) {
    if (bandIndex < 0 || bandIndex >= this.bands.length) {
      console.error('Invalid band index:', bandIndex)
      return false
    }

    const band = this.bands[bandIndex]
    band.enabled = enabled

    // When disabled, set filter gain to 0 (no effect)
    // When enabled, restore original gain
    const now = this.audioContext.currentTime
    const fadeTime = 0.02 // 20ms to avoid clicks

    if (enabled) {
      band.filter.gain.linearRampToValueAtTime(band.config.gain_db, now + fadeTime)
    } else {
      band.filter.gain.linearRampToValueAtTime(0, now + fadeTime)
    }

    console.log(`MultiBandEQProcessor: Band ${bandIndex} (${band.config.frequency}Hz) ${enabled ? 'ENABLED' : 'DISABLED'}`)
    return enabled
  }

  setWetDry(percentage) {
    if (!this.audioContext) return false

    // Clamp to 0-100
    percentage = Math.max(0, Math.min(100, percentage))
    this.wetDryValue = percentage

    const now = this.audioContext.currentTime
    const fadeTime = 0.02 // 20ms crossfade

    // Calculate gains (equal power crossfade)
    const wetAmount = percentage / 100
    const dryAmount = 1 - wetAmount

    this.wetGain.gain.linearRampToValueAtTime(wetAmount, now + fadeTime)
    this.dryGain.gain.linearRampToValueAtTime(dryAmount, now + fadeTime)

    console.log(`MultiBandEQProcessor: Wet/Dry set to ${percentage}% (wet: ${wetAmount.toFixed(2)}, dry: ${dryAmount.toFixed(2)})`)
    return true
  }

  toggleMaster() {
    if (!this.audioContext) return false

    this.masterEnabled = !this.masterEnabled

    // When master is toggled, we adjust wet/dry
    if (this.masterEnabled) {
      // Turn on - restore wet/dry to saved value
      this.setWetDry(this.wetDryValue)
    } else {
      // Turn off - full dry (bypass)
      const now = this.audioContext.currentTime
      const fadeTime = 0.02
      this.wetGain.gain.linearRampToValueAtTime(0, now + fadeTime)
      this.dryGain.gain.linearRampToValueAtTime(1, now + fadeTime)
    }

    console.log('MultiBandEQProcessor: Master EQ', this.masterEnabled ? 'ON' : 'OFF')
    return this.masterEnabled
  }

  getMasterEnabled() {
    return this.masterEnabled
  }

  getWetDry() {
    return this.wetDryValue
  }

  getBandEnabled(bandIndex) {
    if (bandIndex < 0 || bandIndex >= this.bands.length) return false
    return this.bands[bandIndex].enabled
  }

  getBandCount() {
    return this.bands.length
  }

  clearAllBands() {
    // Disconnect all existing bands
    this.bands.forEach(band => {
      try {
        if (band.filter) band.filter.disconnect()
        if (band.gain) band.gain.disconnect()
      } catch (e) {
        // Ignore disconnect errors
      }
    })
    this.bands = []
  }

  dispose() {
    try {
      this.clearAllBands()

      if (this.dryGain) this.dryGain.disconnect()
      if (this.wetGain) this.wetGain.disconnect()
      if (this.eqChainInputGain) this.eqChainInputGain.disconnect()
      if (this.eqChainOutputGain) this.eqChainOutputGain.disconnect()
      if (this.outputGain) this.outputGain.disconnect()

      if (this.audioContext && this.audioContext.state !== 'closed') {
        this.audioContext.close()
      }

      this.audioContext = null
      console.log('MultiBandEQProcessor disposed')
    } catch (error) {
      console.error('Error disposing MultiBandEQProcessor:', error)
    }
  }
}
