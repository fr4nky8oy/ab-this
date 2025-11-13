import { jsPDF } from 'jspdf'

/**
 * Generate a PDF report from analysis results
 * @param {Object} results - The analysis results object
 * @param {string} yourMixFilename - Your mix filename
 * @param {string} referenceFilename - Reference filename
 */
export function generatePDFReport(results, yourMixFilename, referenceFilename) {
  const { your_mix, reference, comparison, suggestions } = results

  const doc = new jsPDF()

  // Styling constants
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  const contentWidth = pageWidth - (margin * 2)
  let yPos = margin

  // Helper to add new page if needed
  const checkPageBreak = (neededSpace = 20) => {
    if (yPos + neededSpace > pageHeight - margin) {
      doc.addPage()
      yPos = margin
      return true
    }
    return false
  }

  // Helper to add section title
  const addSectionTitle = (title) => {
    checkPageBreak(15)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text(title, margin, yPos)
    yPos += 10
  }

  // Helper to add subsection title
  const addSubsectionTitle = (title) => {
    checkPageBreak(12)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text(title, margin, yPos)
    yPos += 8
  }

  // Helper to add normal text
  const addText = (text, indent = 0) => {
    checkPageBreak(8)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    const lines = doc.splitTextToSize(text, contentWidth - indent)
    doc.text(lines, margin + indent, yPos)
    yPos += lines.length * 6
  }

  // Helper to add key-value pair
  const addKeyValue = (key, value, indent = 0) => {
    checkPageBreak(8)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text(key + ':', margin + indent, yPos)
    doc.setFont('helvetica', 'normal')
    doc.text(String(value), margin + indent + 50, yPos)
    yPos += 6
  }

  // ============ HEADER ============
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('A/B This - Analysis Report', margin, yPos)
  yPos += 8

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Generated: ${new Date().toLocaleString()}`, margin, yPos)
  yPos += 15

  // ============ FILE INFO ============
  addSectionTitle('Files Analyzed')
  addKeyValue('Your Mix', yourMixFilename)
  addKeyValue('Reference', referenceFilename)
  yPos += 5

  // ============ SUMMARY ============
  addSectionTitle('Summary')

  addSubsectionTitle('Your Mix')
  addKeyValue('LUFS', your_mix?.dynamics?.lufs_integrated || 'N/A', 5)
  addKeyValue('Peak', (your_mix?.dynamics?.peak_db || 'N/A') + ' dB', 5)
  addKeyValue('Crest Factor', (your_mix?.dynamics?.crest_factor || 'N/A') + ' dB', 5)
  addKeyValue('Clarity', (your_mix?.masking?.clarity_score || 'N/A') + '/100', 5)
  yPos += 3

  addSubsectionTitle('Reference')
  addKeyValue('LUFS', reference?.dynamics?.lufs_integrated || 'N/A', 5)
  addKeyValue('Peak', (reference?.dynamics?.peak_db || 'N/A') + ' dB', 5)
  addKeyValue('Crest Factor', (reference?.dynamics?.crest_factor || 'N/A') + ' dB', 5)
  addKeyValue('Clarity', (reference?.masking?.clarity_score || 'N/A') + '/100', 5)
  yPos += 5

  // ============ KEY FINDINGS ============
  if (suggestions?.summary && suggestions.summary.length > 0) {
    addSectionTitle('Key Findings')
    suggestions.summary.forEach((finding, index) => {
      addText(`${index + 1}. ${finding}`, 5)
    })
    yPos += 5
  }

  // ============ FREQUENCY BALANCE ============
  addSectionTitle('Frequency Balance')

  Object.entries(comparison.frequency_balance.differences).forEach(([band, data]) => {
    addSubsectionTitle(band.replace('_', ' ').toUpperCase())
    addKeyValue('Difference', `${data.difference_db > 0 ? '+' : ''}${data.difference_db.toFixed(1)} dB (${data.status})`, 5)
    addKeyValue('Range', data.frequency_range, 5)
    yPos += 2
  })
  yPos += 3

  // ============ RESONANCES ============
  if (comparison.resonances.problem_resonances && comparison.resonances.problem_resonances.length > 0) {
    addSectionTitle('Resonances')
    addText(`Your Mix: ${comparison.resonances.your_high_severity} high severity resonances`, 5)
    addText(`Reference: ${comparison.resonances.reference_high_severity} high severity resonances`, 5)
    yPos += 3

    addSubsectionTitle('Top Resonances')
    comparison.resonances.problem_resonances.slice(0, 5).forEach((res) => {
      addText(`${res.frequency.toFixed(0)} Hz (${res.severity}): ${res.suggestion.message}`, 5)
    })
    yPos += 5
  }

  // ============ EQ SUGGESTIONS ============
  if (suggestions.eq_adjustments && suggestions.eq_adjustments.length > 0) {
    addSectionTitle('EQ Suggestions')
    suggestions.eq_adjustments.slice(0, 10).forEach((eq, index) => {
      addText(`${index + 1}. ${eq.type.toUpperCase()} at ${eq.frequency} Hz: ${eq.gain_db > 0 ? '+' : ''}${eq.gain_db.toFixed(1)} dB (Q: ${eq.q})`, 5)
      addText(`   ${eq.message}`, 5)
    })
    yPos += 5
  }

  // ============ DYNAMICS ============
  addSectionTitle('Dynamics')

  addSubsectionTitle('Compression')
  addText(comparison.dynamics.compression_comparison.description, 5)
  addKeyValue('Your Mix Crest Factor', (comparison.dynamics.compression_comparison.your_crest_factor || 'N/A') + ' dB', 5)
  addKeyValue('Reference Crest Factor', (comparison.dynamics.compression_comparison.reference_crest_factor || 'N/A') + ' dB', 5)
  yPos += 3

  addSubsectionTitle('Loudness')
  if (comparison.dynamics.loudness_comparison.description) {
    addText(comparison.dynamics.loudness_comparison.description, 5)
  }
  addKeyValue('LUFS Difference', `${comparison.dynamics.loudness_comparison.lufs_difference > 0 ? '+' : ''}${comparison.dynamics.loudness_comparison.lufs_difference.toFixed(1)} LUFS`, 5)
  yPos += 3

  // Dynamic Suggestions
  if (suggestions.crest_factor || suggestions.compression || suggestions.gain || suggestions.limiting) {
    addSubsectionTitle('Dynamic Suggestions')

    if (suggestions.crest_factor) {
      addText(`Crest Factor: ${suggestions.crest_factor.message}`, 5)
    }
    if (suggestions.compression) {
      addText(`Compression: ${suggestions.compression.message}`, 5)
    }
    if (suggestions.gain) {
      addText(`Gain: ${suggestions.gain.message}`, 5)
    }
    if (suggestions.limiting) {
      addText(`Limiting: ${suggestions.limiting.message}`, 5)
    }
    yPos += 5
  }

  // ============ STEREO WIDTH ============
  if (!comparison.stereo.both_mono) {
    addSectionTitle('Stereo Width')

    if (comparison.stereo.message) {
      addText(comparison.stereo.message, 5)
    } else {
      addKeyValue('Your Mix Width', `${comparison.stereo.overall_width_difference > 0 ? '+' : ''}${comparison.stereo.overall_width_difference.toFixed(1)}%`, 5)
      addText(comparison.stereo.assessment, 5)

      if (comparison.stereo.problem_bands && comparison.stereo.problem_bands.length > 0) {
        yPos += 3
        addSubsectionTitle('Per-Band Width Issues')
        comparison.stereo.problem_bands.forEach((pb) => {
          addText(`${pb.band.replace('_', ' ')}: Your ${pb.your_width.toFixed(1)}% | Ref ${pb.reference_width.toFixed(1)}% | Diff ${pb.difference > 0 ? '+' : ''}${pb.difference.toFixed(1)}%`, 5)
        })
      }
    }
    yPos += 5
  }

  // ============ STEREO SUGGESTIONS ============
  if (suggestions.stereo) {
    addSectionTitle('Stereo Suggestions')

    if (suggestions.stereo.overall) {
      addText(suggestions.stereo.overall.message, 5)
    }

    if (suggestions.stereo.per_band && suggestions.stereo.per_band.length > 0) {
      suggestions.stereo.per_band.forEach((item) => {
        addText(`${item.band.replace('_', ' ')}: ${item.message}`, 5)
      })
    }

    if (suggestions.stereo.phase) {
      addText(`⚠ ${suggestions.stereo.phase.message}`, 5)
    }
    yPos += 5
  }

  // ============ MASKING ISSUES ============
  if (suggestions.masking && suggestions.masking.length > 0) {
    addSectionTitle('Masking Issues')
    suggestions.masking.forEach((item) => {
      addText(`${item.bands.join(' / ')}: ${item.message}`, 5)
    })
    yPos += 5
  }

  // ============ FOOTER ============
  const totalPages = doc.internal.pages.length - 1
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text(
      `Page ${i} of ${totalPages} | A/B This - https://abthis.frankyredente.com`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    )
  }

  // Generate filename
  const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const filename = `ABThis_Report_${timestamp}.pdf`

  // Save the PDF
  doc.save(filename)
}
