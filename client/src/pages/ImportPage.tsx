import { useState, useEffect } from 'react'
import * as XLSX from 'xlsx'
import type { User } from '../App'
import api from '../api/client'

/* ---------- CSV & Excel Parser ---------- */
function parseFile(data: any, type: 'csv' | 'xlsx'): Record<string, string>[] {
  if (type === 'csv') {
    const text = typeof data === 'string' ? data : ''
    const lines = text.trim().split('\n').filter(l => l.trim())
    if (lines.length < 2) return []
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, '_'))
    return lines.slice(1).map(line => {
      const vals = line.split(',').map(v => v.trim())
      return headers.reduce((obj, h, i) => ({ ...obj, [h]: vals[i] || '' }), {} as Record<string, string>)
    })
  } else {
    const workbook = XLSX.read(data, { type: 'array' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    return XLSX.utils.sheet_to_json(worksheet)
  }
}

function stripPII(rows: any[]) {
  const piiCols = ['name', 'phone', 'email', 'national_id', 'id_number', 'phone_number']
  const stripped: string[] = []
  const cleaned = rows.map(row => {
    const newRow = { ...row }
    piiCols.forEach(col => {
      Object.keys(newRow).forEach(key => {
        if (key.toLowerCase().replace(/[^a-z]/g, '') === col.replace(/[^a-z]/g, '')) {
          if (!stripped.includes(key)) stripped.push(key)
          delete newRow[key]
        }
      })
    })
    return newRow
  })
  return { cleaned, stripped }
}

/* ---------- 6-month Sample CSV ---------- */
const SAMPLE_CSV = `sessionDate,headcount,rsvpCount,avgRating,responseCount
2023-11-05,42,35,3.9,18
2023-11-12,45,38,4.1,20
2023-11-19,44,37,4.0,19
2023-11-26,48,40,4.2,21
2023-12-03,50,43,4.3,22
2023-12-10,47,39,4.1,20
2023-12-17,52,44,4.4,23
2023-12-24,38,30,3.8,15
2023-12-31,40,33,3.9,17
2024-01-07,45,38,4.2,20
2024-01-14,52,44,4.5,22
2024-01-21,48,40,4.1,19
2024-01-28,55,46,4.6,24
2024-02-04,43,35,3.9,18
2024-02-11,58,50,4.7,25
2024-02-18,60,52,4.8,27
2024-02-25,54,45,4.3,21
2024-03-03,57,48,4.5,23
2024-03-10,62,53,4.7,26
2024-03-17,59,50,4.6,24
2024-03-24,65,55,4.8,28
2024-03-31,61,52,4.7,25
2024-04-07,64,54,4.8,27
2024-04-14,63,53,4.7,26`

/* ---------- Expected fields for column mapping ---------- */
const EXPECTED_FIELDS = [
  { key: 'sessiondate', label: 'Session Date', required: true, aliases: ['week_date', 'date', 'session_date'] },
  { key: 'headcount', label: 'Headcount', required: true, aliases: ['attendance', 'count'] },
  { key: 'participation_rate', label: 'Participation Rate', required: false, aliases: ['rate', 'participation'] },
  { key: 'rsvpcount', label: 'RSVP Count', required: false, aliases: ['rsvp_count'] },
  { key: 'avgrating', label: 'Avg Rating', required: false, aliases: ['avg_rating', 'rating'] },
  { key: 'responsecount', label: 'Response Count', required: false, aliases: ['response_count'] },
]

/* ---------- Locations ---------- */
const NAIROBI_LOCATIONS = ['Nairobi CBD', 'Westlands', 'Eastlands', 'Southlands', 'Northlands', 'Other Nairobi']
const RECORD_YEARS = ['Less than 1 year', '1-2 years', '2-5 years', '5+ years']
const TECH_STACKS = ['Excel', 'Google Sheets', 'WhatsApp logs', 'Dedicated CMS', 'Other']

export function ImportPage({ user }: { user: User }) {
  const [groups, setGroups] = useState<any[]>([])
  const [groupId, setGroupId] = useState('')
  const [csvText, setCsvText] = useState('')
  const [preview, setPreview] = useState<any[]>([])
  const [detectedHeaders, setDetectedHeaders] = useState<string[]>([])
  const [colMapping, setColMapping] = useState<Record<string, string>>({})
  const [strippedCols, setStrippedCols] = useState<string[]>([])

  if (user.role !== 'admin') {
    return (
      <div className="anim-up p-8 text-center text-rose-500">
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚫</div>
        <h2>Access Denied</h2>
        <p>Only administrators can access the Data Import module.</p>
        <button className="btn btn-primary mt-4" onClick={() => window.location.href = '/'}>Go to Dashboard</button>
      </div>
    );
  }

  // Step 1 = Upload, 2 = Church Profile, 3 = Review, 4 = Done
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [err, setErr] = useState('')

  // Church profile state
  const [churchName, setChurchName] = useState('')
  const [membership, setMembership] = useState('')
  const [location, setLocation] = useState('')
  const [yearsOfRecords, setYearsOfRecords] = useState('')
  const [techStack, setTechStack] = useState<string[]>([])
  const [profileSaving, setProfileSaving] = useState(false)

  useEffect(() => {
    api.get('/api/groups').then(r => {
      setGroups(r.data)
      if (r.data.length > 0) setGroupId(String(r.data[0].id))
    }).catch(console.error)
    // Pre-fill church profile if exists
    api.get('/api/church/profile').then(r => {
      if (r.data) {
        setChurchName(r.data.churchName || '')
        setMembership(String(r.data.activeMembership || ''))
        setLocation(r.data.location || '')
        setYearsOfRecords(r.data.yearsOfRecords || '')
        setTechStack(r.data.techStack ? r.data.techStack.split(',') : [])
      }
    }).catch(() => { })
  }, [])

  const loadSample = () => { setCsvText(SAMPLE_CSV); setErr('') }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (evt) => {
      const data = evt.target?.result
      if (file.name.endsWith('.csv')) {
        setCsvText(data as string)
      } else {
        const rows = parseFile(data, 'xlsx')
        const { cleaned, stripped } = stripPII(rows)
        setStrippedCols(stripped)
        setDetectedHeaders(Object.keys(cleaned[0] || {}))
        setPreview(cleaned)
        autoMap(Object.keys(cleaned[0] || {}))
        setStep(2)
      }
    }
    if (file.name.endsWith('.csv')) reader.readAsText(file)
    else reader.readAsArrayBuffer(file)
  }

  const autoMap = (headers: string[]) => {
    const auto: Record<string, string> = {}
    EXPECTED_FIELDS.forEach(f => {
      const match = headers.find(h =>
        h.toLowerCase().replace(/[_\s]/g, '') === f.key.toLowerCase().replace(/[_\s]/g, '') ||
        f.aliases?.includes(h.toLowerCase())
      )
      if (match) auto[f.key] = match
    })
    setColMapping(auto)
  }

  const parsePreview = () => {
    setErr('')
    const rawRows = parseFile(csvText, 'csv')
    if (rawRows.length === 0) return setErr('Could not parse CSV. Check format and try again.')

    const { cleaned, stripped } = stripPII(rawRows)
    setStrippedCols(stripped)
    const headers = Object.keys(cleaned[0] || {})
    setDetectedHeaders(headers)
    autoMap(headers)
    setPreview(cleaned)
    setStep(2)
  }

  const saveProfile = async () => {
    if (!churchName.trim()) return setErr('Church name is required.')
    setProfileSaving(true); setErr('')
    try {
      await api.post('/api/church/profile', {
        churchName,
        activeMembership: membership ? parseInt(membership) : null,
        location,
        yearsOfRecords,
        techStack,
      })
      setStep(3)
    } catch (e: any) {
      setErr(e.response?.data?.error || 'Failed to save profile.')
    } finally { setProfileSaving(false) }
  }

  const doImport = async () => {
    setLoading(true); setErr('')
    const rows = preview.map(r => ({
      sessionDate: r[colMapping['sessiondate']] || r.sessiondate || r.session_date,
      headcount: r[colMapping['headcount']] || r.headcount,
      participationRate: r[colMapping['participation_rate']] || r.participation_rate || r.rate || null,
      rsvpCount: r[colMapping['rsvpcount']] || r.rsvpcount || r.rsvp_count || 0,
      avgRating: r[colMapping['avgrating']] || r.avgrating || r.avg_rating || null,
      responseCount: r[colMapping['responsecount']] || r.responsecount || r.response_count || 1,
    }))
    try {
      const res = await api.post('/api/admin/import', { groupId: parseInt(groupId), rows })
      setResult(res.data)
      setStep(4)
    } catch (e: any) {
      setErr(e.response?.data?.error || 'Import failed.')
    } finally { setLoading(false) }
  }

  const selectedGroup = groups.find(g => String(g.id) === String(groupId)) || { name: 'Unknown' }
  const dateRange = preview.length >= 2
    ? `${preview[0][colMapping['sessiondate'] || 'sessiondate'] || '?'} → ${preview[preview.length - 1][colMapping['sessiondate'] || 'sessiondate'] || '?'}`
    : null

  const STEPS = [['1', 'Upload CSV'], ['2', 'Church Profile'], ['3', 'Review'], ['4', 'Done']]

  return (
    <div className="anim-up">
      <div className="page-header">
        <div className="crumb"><span>Data</span><span className="crumb-sep">/</span><span className="crumb-cur">Data Import</span></div>
        <h1 className="page-title">Historical Data <span className="title-accent">Import</span></h1>
        <p className="page-sub">Upload your existing attendance records to train the SVR forecasting models</p>
      </div>

      {/* Scope notice */}
      <div className="notice notice-info mb-4 anim-up-1">
        <span className="notice-icon">📋</span>
        <div className="notice-body">
          <div className="notice-title">Scoped for Nairobi Evangelical Churches</div>
          <div className="notice-msg">This system targets churches with 100–500 active members using a purposive sample of 5–10 churches. A minimum of 6 months of existing digital attendance records is required for meaningful SVR forecasts.</div>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-5 anim-up-1">
        {STEPS.map(([n, lbl], i) => (
          <div key={n} className="flex items-center gap-2">
            <div style={{
              width: 28, height: 28, borderRadius: '50%', display: 'flex',
              alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700,
              background: step > parseInt(n) ? 'var(--a-emerald)' : step === parseInt(n) ? 'linear-gradient(135deg,var(--a-indigo),var(--a-violet))' : 'var(--bg-float)',
              color: step >= parseInt(n) ? '#fff' : 'var(--t-lo)',
              border: `1px solid ${step >= parseInt(n) ? 'transparent' : 'var(--border-glass)'}`,
            }}>{step > parseInt(n) ? '✓' : n}</div>
            <span style={{ fontSize: '0.8rem', color: step === parseInt(n) ? 'var(--t-hi)' : 'var(--t-lo)', fontWeight: step === parseInt(n) ? 600 : 400 }}>{lbl}</span>
            {i < 3 && <div style={{ width: 24, height: 1, background: 'var(--border-glass)', margin: '0 2px' }} />}
          </div>
        ))}
      </div>

      {/* STEP 1 — Upload CSV */}
      {step === 1 && (
        <div className="flex-col gap-4 anim-up-2">
          <div className="glass p-6">
            <div className="sec-head mb-4">
              <div>
                <div className="sec-title">Select Faith Group</div>
                <div className="sec-sub">Choose which group this historical data belongs to</div>
              </div>
            </div>
            <select className="field-select" style={{ maxWidth: 320 }} value={groupId} onChange={e => setGroupId(e.target.value)}>
              {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>

          <div className="glass p-6">
            <div className="sec-head mb-4">
              <div>
                <div className="sec-title">Upload Your Existing Attendance Records</div>
                <div className="sec-sub">
                  Supported formats: CSV exported from <strong>Excel, Google Sheets</strong>, or any spreadsheet tool.
                  Required columns: <code style={{ color: 'var(--a-indigo)', background: 'var(--a-indigo-dim)', padding: '1px 6px', borderRadius: 4 }}>sessionDate, headcount</code> — Optional: <code style={{ color: 'var(--a-emerald)', background: 'var(--a-emerald-dim)', padding: '1px 6px', borderRadius: 4 }}>rsvpCount, avgRating, responseCount</code>
                </div>
              </div>
              <button className="btn btn-glass btn-sm" onClick={loadSample}>Load 6-Month Sample</button>
            </div>

            <textarea
              className="field-textarea"
              rows={10}
              placeholder={"sessionDate,headcount,rsvpCount,avgRating,responseCount\n2024-01-07,45,38,4.2,20\n..."}
              value={csvText}
              onChange={e => { setCsvText(e.target.value); setErr('') }}
              style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.78rem' }}
            />

            {err && (
              <div className="notice notice-danger mt-3">
                <span className="notice-icon">⚠</span>
                <div className="notice-body"><div className="notice-msg">{err}</div></div>
              </div>
            )}

            <div className="flex gap-3 mt-4 items-center">
              <button className="btn btn-primary" onClick={parsePreview} disabled={!csvText.trim()}>
                Map Columns →
              </button>
              <div style={{ color: 'var(--t-lo)', fontSize: '0.8rem' }}>or</div>
              <label className="btn btn-glass" style={{ margin: 0, cursor: 'pointer' }}>
                📁 Browse CSV/XLSX
                <input type="file" hidden accept=".csv,.xlsx,.xls" onChange={handleFileUpload} />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2 — Church Profile */}
      {step === 2 && (
        <div className="flex-col gap-4 anim-up-2">
          {/* Column mapping */}
          <div className="glass p-6">
            <div className="sec-title mb-2">Column Mapping</div>
            <div className="sec-sub mb-4">Your CSV has these headers. Map each to the expected system field.</div>
            <div className="bento bento-2" style={{ gap: 12 }}>
              {EXPECTED_FIELDS.map(f => (
                <div key={f.key} className="field">
                  <label className="field-label">
                    {f.label}{f.required ? ' *' : ''} <span style={{ fontWeight: 400, color: 'var(--t-lo)', fontSize: '0.7rem' }}>(expected: {f.key})</span>
                  </label>
                  <select className="field-select" value={colMapping[f.key] || ''} onChange={e => setColMapping(m => ({ ...m, [f.key]: e.target.value }))}>
                    <option value="">— Not mapped —</option>
                    {detectedHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Church profile */}
          <div className="glass p-6">
            <div className="sec-title mb-1">Church Profile</div>
            <div className="sec-sub mb-4">Provide demographic details for this sampled church. This data is stored for research documentation purposes.</div>

            {err && (
              <div className="notice notice-danger mb-4">
                <span className="notice-icon">⚠</span>
                <div className="notice-body"><div className="notice-msg">{err}</div></div>
              </div>
            )}

            <div className="bento bento-2" style={{ gap: 14 }}>
              <div className="field">
                <label className="field-label">Church Name *</label>
                <input className="field-input" type="text" placeholder="e.g. Nairobi Chapel" value={churchName} onChange={e => setChurchName(e.target.value)} />
              </div>
              <div className="field">
                <label className="field-label">Approximate Active Membership</label>
                <input className="field-input" type="number" placeholder="e.g. 250" value={membership} onChange={e => setMembership(e.target.value)} min="0" />
              </div>
              <div className="field">
                <label className="field-label">Primary Location</label>
                <select className="field-select" value={location} onChange={e => setLocation(e.target.value)}>
                  <option value="">Select area…</option>
                  {NAIROBI_LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div className="field">
                <label className="field-label">Years of Digital Record-Keeping</label>
                <select className="field-select" value={yearsOfRecords} onChange={e => setYearsOfRecords(e.target.value)}>
                  <option value="">Select…</option>
                  {RECORD_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>

            <div className="field mt-4">
              <label className="field-label">Current Tech Stack (select all that apply)</label>
              <div className="flex gap-3" style={{ flexWrap: 'wrap', marginTop: 6 }}>
                {TECH_STACKS.map(ts => (
                  <label key={ts} className="flex items-center gap-2 pointer" style={{ fontSize: '0.8rem', color: 'var(--t-mid)' }}>
                    <input
                      type="checkbox"
                      checked={techStack.includes(ts)}
                      onChange={e => setTechStack(s => e.target.checked ? [...s, ts] : s.filter(x => x !== ts))}
                      style={{ accentColor: 'var(--a-indigo)', width: 15, height: 15 }}
                    />
                    {ts}
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button className="btn btn-glass" onClick={() => setStep(1)}>← Back</button>
              <button className="btn btn-primary" onClick={saveProfile} disabled={profileSaving}>
                {profileSaving ? '⏳ Saving…' : 'Save & Continue →'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3 — Preview */}
      {step === 3 && (
        <div className="flex-col gap-4 anim-up-2">
          <div className="flex-col gap-3" style={{ fontSize: '0.82rem', color: 'var(--t-mid)', lineHeight: 1.6 }}>
            <p>1. Export your attendance records as a <strong>CSV file</strong> from Google Sheets, Excel, or your CMS.</p>
            <p>2. Ensure your CSV contains at minimum three columns named <strong>group_id</strong>, <strong>session_date</strong> (YYYY-MM-DD), and <strong>headcount</strong>.</p>
            <p>3. PII like member names or phone numbers will be automatically stripped during processing to comply with DPA 2019.</p>
            <p>4. The feature engineering pipeline will run automatically after a successful upload.</p>
          </div>

          <div className="notice notice-ok">
            <span className="notice-icon">✓</span>
            <div className="notice-body">
              <div className="notice-title">{preview.length} rows parsed for <strong>{selectedGroup?.name}</strong></div>
              <div className="notice-msg">Review the data below. Click <strong>Confirm and Import</strong> to write to the database and trigger SVR retraining.</div>
            </div>
          </div>

          {strippedCols.length > 0 && (
            <div className="notice notice-info">
              <span className="notice-icon">🛡️</span>
              <div className="notice-body">
                <div className="notice-title">PII Automatically Stripped</div>
                <div className="notice-msg">The following sensitive columns were removed for DPA 2019 compliance: <strong>{strippedCols.join(', ')}</strong></div>
              </div>
            </div>
          )}

          <div className="glass" style={{ overflow: 'hidden' }}>
            <div className="table-shell" style={{ border: 'none', maxHeight: 340, overflowY: 'auto' }}>
              <table className="data-tbl">
                <thead>
                  <tr>
                    {detectedHeaders.map(k => <th key={k}>{k}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {preview.slice(0, 10).map((row, i) => (
                    <tr key={i}>
                      {detectedHeaders.map((h, j) => <td key={j}>{String(row[h])}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {preview.length > 10 && (
              <div style={{ padding: '10px', textAlign: 'center', fontSize: '0.75rem', color: 'var(--t-lo)', borderTop: '1px solid var(--border-glass)' }}>
                + {preview.length - 10} more rows (showing first 10 rows preview)
              </div>
            )}
          </div>

          {err && (
            <div className="notice notice-danger">
              <span className="notice-icon">⚠</span>
              <div className="notice-body"><div className="notice-msg">{err}</div></div>
            </div>
          )}

          <div className="flex gap-3">
            <button className="btn btn-glass" onClick={() => setStep(2)}>← Back</button>
            <button className="btn btn-primary" onClick={doImport} disabled={loading}>
              {loading ? '⏳ Importing & Training…' : `🚀 Confirm and Import ${preview.length} Rows →`}
            </button>
          </div>
        </div>
      )}

      {/* STEP 4 — Done */}
      {step === 4 && result && (
        <div className="flex-col gap-4 anim-up-2">
          <div className="glass p-6 text-center">
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>🎉</div>
            <div style={{ fontFamily: 'Syne', fontSize: '1.2rem', fontWeight: 800, color: 'var(--t-hi)', marginBottom: 8 }}>
              Import Complete!
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--t-mid)', marginBottom: 24, lineHeight: 1.6 }}>
              <strong style={{ color: 'var(--a-emerald)' }}>{result.imported} rows</strong> imported into{' '}
              <strong>{selectedGroup?.name}</strong>{churchName ? ` (${churchName})` : ''}.
              {dateRange && <div style={{ marginTop: 4, fontSize: '0.75rem', color: 'var(--t-lo)' }}>Date range: {dateRange}</div>}
              {result.skipped > 0 && <span style={{ color: 'var(--a-amber)' }}> {result.skipped} rows skipped.</span>}
            </div>

            <div className="notice notice-ok" style={{ textAlign: 'left', marginBottom: 16 }}>
              <span className="notice-icon">⚙️</span>
              <div className="notice-body">
                <div className="notice-title">SVR Retraining Triggered</div>
                <div className="notice-msg">Your SVR model has been trained on {result.imported} historical records across {groups.length} faith groups. Pipeline is running in the background. Head to AI Forecast in ~30 seconds to see the new predictions.</div>
              </div>
            </div>

            {/* Future recommendation card */}
            <div className="notice notice-info" style={{ textAlign: 'left', marginBottom: 24 }}>
              <span className="notice-icon">🔭</span>
              <div className="notice-body">
                <div className="notice-title">Future Onboarding</div>
                <div className="notice-msg">Once your historical data is loaded and forecasting is active, you can invite your team to log new sessions directly via the Attendance page. For churches currently without digital records, a guided onboarding flow is planned for a future release.</div>
              </div>
            </div>

            <div className="flex gap-3" style={{ justifyContent: 'center' }}>
              <button className="btn btn-glass" onClick={() => { setStep(1); setCsvText(''); setPreview([]); setResult(null) }}>
                Import Another Group
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
