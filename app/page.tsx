'use client'

import { useState } from 'react'
import { createWorker } from 'tesseract.js'

interface SummaryData {
  platform: string
  totalEarnings: string
  deliveries?: string
  hours?: string
  tips?: string
  period?: string
}

export default function Home() {
  const [mode, setMode] = useState<'upload' | 'manual'>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<SummaryData | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Manual entry state
  const [manualData, setManualData] = useState({
    platform: 'DoorDash',
    earnings: '',
    deliveries: '',
    hours: '',
    tips: ''
  })

  const extractDataFromText = (text: string): SummaryData | null => {
    // Detect platform
    let platform = 'Unknown Platform'
    if (text.match(/doordash|dasher/i)) platform = 'DoorDash'
    else if (text.match(/uber eats|uber driver/i)) platform = 'Uber'
    else if (text.match(/lyft/i)) platform = 'Lyft'
    else if (text.match(/grubhub/i)) platform = 'Grubhub'
    else if (text.match(/instacart/i)) platform = 'Instacart'

    // Extract dollar amounts
    const dollarMatches = text.match(/\$[\d,]+\.?\d*/g)
    if (!dollarMatches || dollarMatches.length === 0) {
      return null
    }

    // Find the largest amount (usually total earnings)
    const amounts = dollarMatches.map(m => parseFloat(m.replace(/[$,]/g, '')))
    const totalEarnings = `$${Math.max(...amounts).toFixed(2)}`

    // Extract numbers (for deliveries, hours, etc.)
    const numbers = text.match(/\b\d+\b/g) || []
    
    // Try to find deliveries/trips
    let deliveries = ''
    const deliveryMatch = text.match(/(\d+)\s*(deliver|trip|order)/i)
    if (deliveryMatch) {
      deliveries = deliveryMatch[1]
    }

    // Try to find tips
    let tips = ''
    const tipMatch = text.match(/tip[s]?[:\s]*(\$[\d,]+\.?\d*)/i)
    if (tipMatch) {
      tips = tipMatch[1]
    }

    return {
      platform,
      totalEarnings,
      deliveries,
      tips,
      period: 'Extracted from image'
    }
  }

  const handleFileUpload = async () => {
    if (!file) return

    setProcessing(true)
    setError(null)
    setProgress(0)

    try {
      const worker = await createWorker('eng', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setProgress(Math.round(m.progress * 100))
          }
        }
      })

      const { data: { text } } = await worker.recognize(file)
      await worker.terminate()

      const extracted = extractDataFromText(text)
      
      if (extracted) {
        setResult(extracted)
      } else {
        setError('Could not extract earnings data. Try manual entry below.')
      }

    } catch (err) {
      setError('Error processing image. Please try manual entry.')
      console.error(err)
    } finally {
      setProcessing(false)
      setProgress(0)
    }
  }

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!manualData.earnings) {
      setError('Please enter at least the total earnings')
      return
    }

    setResult({
      platform: manualData.platform,
      totalEarnings: manualData.earnings.startsWith('$') ? manualData.earnings : `$${manualData.earnings}`,
      deliveries: manualData.deliveries || undefined,
      hours: manualData.hours || undefined,
      tips: manualData.tips ? (manualData.tips.startsWith('$') ? manualData.tips : `$${manualData.tips}`) : undefined,
      period: 'Manually entered'
    })
  }

  const reset = () => {
    setFile(null)
    setResult(null)
    setError(null)
    setManualData({ platform: 'DoorDash', earnings: '', deliveries: '', hours: '', tips: '' })
  }

  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    card: {
      maxWidth: '600px',
      width: '100%',
      background: 'white',
      borderRadius: '20px',
      padding: '40px',
      boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
    },
    title: {
      fontSize: '36px',
      fontWeight: 'bold',
      marginBottom: '8px',
      color: '#1a202c',
      textAlign: 'center' as const,
    },
    subtitle: {
      color: '#718096',
      marginBottom: '30px',
      textAlign: 'center' as const,
    },
    modeSelector: {
      display: 'flex',
      gap: '10px',
      marginBottom: '30px',
      background: '#f7fafc',
      padding: '6px',
      borderRadius: '12px',
    },
    modeButton: (active: boolean) => ({
      flex: 1,
      padding: '12px',
      border: 'none',
      borderRadius: '8px',
      fontSize: '15px',
      fontWeight: '600',
      cursor: 'pointer',
      background: active ? '#667eea' : 'transparent',
      color: active ? 'white' : '#4a5568',
      transition: 'all 0.2s',
    }),
    uploadZone: {
      border: '3px dashed #cbd5e0',
      borderRadius: '12px',
      padding: '40px',
      textAlign: 'center' as const,
      cursor: 'pointer',
      transition: 'all 0.3s',
      marginBottom: '20px',
    },
    input: {
      width: '100%',
      padding: '12px',
      border: '2px solid #e2e8f0',
      borderRadius: '8px',
      fontSize: '15px',
      marginBottom: '15px',
      boxSizing: 'border-box' as const,
    },
    select: {
      width: '100%',
      padding: '12px',
      border: '2px solid #e2e8f0',
      borderRadius: '8px',
      fontSize: '15px',
      marginBottom: '15px',
      background: 'white',
      cursor: 'pointer',
    },
    button: {
      width: '100%',
      background: '#667eea',
      color: 'white',
      padding: '15px',
      borderRadius: '10px',
      border: 'none',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s',
    },
    buttonDisabled: {
      background: '#cbd5e0',
      cursor: 'not-allowed',
    },
    progress: {
      background: '#e2e8f0',
      borderRadius: '10px',
      overflow: 'hidden',
      marginBottom: '20px',
    },
    progressBar: (width: number) => ({
      background: '#667eea',
      height: '8px',
      width: `${width}%`,
      transition: 'width 0.3s',
    }),
    resultCard: {
      background: '#f0fdf4',
      border: '2px solid #86efac',
      borderRadius: '12px',
      padding: '25px',
      marginBottom: '20px',
    },
    resultRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '15px',
      paddingBottom: '15px',
      borderBottom: '1px solid #d1fae5',
    },
    label: {
      color: '#6b7280',
      fontSize: '14px',
      fontWeight: '500',
    },
    value: {
      color: '#1a202c',
      fontSize: '16px',
      fontWeight: '600',
    },
    earnings: {
      fontSize: '32px',
      color: '#10b981',
      fontWeight: 'bold',
    },
    error: {
      background: '#fef2f2',
      border: '2px solid #fca5a5',
      borderRadius: '8px',
      padding: '15px',
      color: '#991b1b',
      marginBottom: '20px',
    },
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>💰 EarningSummary</h1>
        <p style={styles.subtitle}>
          Extract from screenshot or enter manually
        </p>

        {!result ? (
          <>
            <div style={styles.modeSelector}>
              <button
                style={styles.modeButton(mode === 'upload')}
                onClick={() => setMode('upload')}
              >
                📸 Upload Image
              </button>
              <button
                style={styles.modeButton(mode === 'manual')}
                onClick={() => setMode('manual')}
              >
                ⌨️ Manual Entry
              </button>
            </div>

            {error && (
              <div style={styles.error}>
                ⚠️ {error}
              </div>
            )}

            {mode === 'upload' ? (
              <>
                <div style={styles.uploadZone}>
                  <input
                    type="file"
                    onChange={(e) => e.target.files && setFile(e.target.files[0])}
                    accept="image/*,.pdf"
                    style={{ display: 'none' }}
                    id="file-input"
                  />
                  <label htmlFor="file-input" style={{ cursor: 'pointer' }}>
                    <div style={{ fontSize: '48px', marginBottom: '10px' }}>📄</div>
                    <p style={{ fontWeight: '600', color: '#2d3748', marginBottom: '5px' }}>
                      Click to upload earnings screenshot
                    </p>
                    <p style={{ fontSize: '14px', color: '#a0aec0' }}>
                      PNG, JPG up to 10MB
                    </p>
                    {file && (
                      <p style={{ marginTop: '15px', color: '#667eea', fontWeight: '600' }}>
                        ✓ {file.name}
                      </p>
                    )}
                  </label>
                </div>

                {processing && (
                  <div style={styles.progress}>
                    <div style={styles.progressBar(progress)}></div>
                  </div>
                )}

                {file && (
                  <button
                    onClick={handleFileUpload}
                    disabled={processing}
                    style={{
                      ...styles.button,
                      ...(processing ? styles.buttonDisabled : {})
                    }}
                  >
                    {processing ? `Processing... ${progress}%` : '🔍 Extract Data'}
                  </button>
                )}
              </>
            ) : (
              <form onSubmit={handleManualSubmit}>
                <select
                  style={styles.select}
                  value={manualData.platform}
                  onChange={(e) => setManualData({...manualData, platform: e.target.value})}
                >
                  <option value="DoorDash">DoorDash</option>
                  <option value="Uber">Uber Driver / Uber Eats</option>
                  <option value="Lyft">Lyft</option>
                  <option value="Grubhub">Grubhub</option>
                  <option value="Instacart">Instacart</option>
                  <option value="Other">Other</option>
                </select>

                <input
                  type="text"
                  placeholder="Total Earnings (e.g., 450.25 or $450.25) *"
                  style={styles.input}
                  value={manualData.earnings}
                  onChange={(e) => setManualData({...manualData, earnings: e.target.value})}
                  required
                />

                <input
                  type="text"
                  placeholder="Number of Deliveries/Trips (optional)"
                  style={styles.input}
                  value={manualData.deliveries}
                  onChange={(e) => setManualData({...manualData, deliveries: e.target.value})}
                />

                <input
                  type="text"
                  placeholder="Hours Worked (optional)"
                  style={styles.input}
                  value={manualData.hours}
                  onChange={(e) => setManualData({...manualData, hours: e.target.value})}
                />

                <input
                  type="text"
                  placeholder="Tips Amount (optional)"
                  style={styles.input}
                  value={manualData.tips}
                  onChange={(e) => setManualData({...manualData, tips: e.target.value})}
                />

                <button type="submit" style={styles.button}>
                  ✨ Generate Summary
                </button>
              </form>
            )}
          </>
        ) : (
          <>
            <div style={styles.resultCard}>
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px', color: '#1a202c' }}>
                📊 Earnings Summary
              </h2>

              <div style={styles.resultRow}>
                <span style={styles.label}>Platform:</span>
                <span style={{...styles.value, fontSize: '18px'}}>{result.platform}</span>
              </div>

              <div style={{...styles.resultRow, borderBottom: 'none', marginBottom: 0}}>
                <span style={styles.label}>Total Earnings:</span>
                <span style={styles.earnings}>{result.totalEarnings}</span>
              </div>

              {result.deliveries && (
                <div style={styles.resultRow}>
                  <span style={styles.label}>Deliveries/Trips:</span>
                  <span style={styles.value}>{result.deliveries}</span>
                </div>
              )}

              {result.hours && (
                <div style={styles.resultRow}>
                  <span style={styles.label}>Hours Worked:</span>
                  <span style={styles.value}>{result.hours}</span>
                </div>
              )}

              {result.tips && (
                <div style={styles.resultRow}>
                  <span style={styles.label}>Tips:</span>
                  <span style={{...styles.value, color: '#10b981'}}>{result.tips}</span>
                </div>
              )}

              <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #d1fae5' }}>
                <span style={{...styles.label, fontSize: '12px'}}>{result.period}</span>
              </div>
            </div>

            <button
              onClick={reset}
              style={{...styles.button, background: '#e5e7eb', color: '#1f2937'}}
            >
              📝 Create Another
            </button>
          </>
        )}

        <p style={{ marginTop: '30px', textAlign: 'center', fontSize: '13px', color: '#9ca3af' }}>
          🔒 Your data is processed locally and never stored
        </p>
      </div>
    </div>
  )
}
