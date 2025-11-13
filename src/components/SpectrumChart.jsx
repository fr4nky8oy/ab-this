import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import './SpectrumChart.css'

function SpectrumChart({ yourMixData, referenceData }) {
  // Combine data for chart
  const chartData = yourMixData.frequencies.map((freq, index) => ({
    frequency: freq,
    yourMix: yourMixData.magnitudes[index],
    reference: referenceData.magnitudes[index],
  }))

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-freq">{`${Math.round(payload[0].payload.frequency)} Hz`}</p>
          <p className="tooltip-your">{`Your Mix: ${payload[1].value.toFixed(1)} dB`}</p>
          <p className="tooltip-ref">{`Reference: ${payload[0].value.toFixed(1)} dB`}</p>
        </div>
      )
    }
    return null
  }

  // Format frequency labels for X-axis
  const formatFreq = (freq) => {
    if (freq >= 1000) {
      return `${(freq / 1000).toFixed(freq >= 10000 ? 0 : 1)}k`
    }
    return freq
  }

  return (
    <div className="spectrum-chart">
      <h3>Frequency Spectrum Comparison</h3>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis
            dataKey="frequency"
            scale="log"
            domain={[20, 20000]}
            tickFormatter={formatFreq}
            stroke="#888"
            label={{ value: 'Frequency (Hz)', position: 'insideBottom', offset: -5, fill: '#888' }}
          />
          <YAxis
            stroke="#888"
            label={{ value: 'Magnitude (dB)', angle: -90, position: 'insideLeft', fill: '#888' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Line
            type="monotone"
            dataKey="reference"
            stroke="#10b981"
            strokeWidth={2}
            dot={false}
            name="Reference"
          />
          <Line
            type="monotone"
            dataKey="yourMix"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
            name="Your Mix"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default SpectrumChart
