import { useState, useCallback, useRef } from 'react'

const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz'
const NUMBERS = '0123456789'
const SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?'

function generatePassword(
  length: number,
  useUpper: boolean,
  useLower: boolean,
  useNumbers: boolean,
  useSymbols: boolean
): string {
  let charset = ''
  const guaranteed: string[] = []

  if (useUpper) { charset += UPPERCASE; guaranteed.push(UPPERCASE[Math.floor(Math.random() * UPPERCASE.length)]) }
  if (useLower) { charset += LOWERCASE; guaranteed.push(LOWERCASE[Math.floor(Math.random() * LOWERCASE.length)]) }
  if (useNumbers) { charset += NUMBERS; guaranteed.push(NUMBERS[Math.floor(Math.random() * NUMBERS.length)]) }
  if (useSymbols) { charset += SYMBOLS; guaranteed.push(SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]) }

  if (!charset) return ''

  const rest = Array.from({ length: length - guaranteed.length }, () =>
    charset[Math.floor(Math.random() * charset.length)]
  )
  const all = [...guaranteed, ...rest]
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [all[i], all[j]] = [all[j], all[i]]
  }
  return all.join('')
}

type Strength = 'Too Weak' | 'Weak' | 'Moderate' | 'Strong' | 'Very Strong'

function getStrength(password: string, options: number): { label: Strength; pct: number; color: string; desc: string } {
  const len = password.length
  let score = 0
  if (len >= 8) score++
  if (len >= 12) score++
  if (len >= 16) score++
  if (options >= 3) score++
  if (options === 4) score++

  const map: Record<number, { label: Strength; pct: number; color: string; desc: string }> = {
    0: { label: 'Too Weak', pct: 8, color: '#e53935', desc: "This password won't survive a second." },
    1: { label: 'Weak', pct: 28, color: '#fb8c00', desc: 'Easily crackable. Add more options.' },
    2: { label: 'Moderate', pct: 52, color: '#d4a020', desc: 'Not bad, but not Fort Knox either.' },
    3: { label: 'Strong', pct: 75, color: '#43a047', desc: 'Solid. Hard to crack.' },
    4: { label: 'Very Strong', pct: 100, color: '#1e88e5', desc: 'Excellent. Nearly uncrackable.' },
    5: { label: 'Very Strong', pct: 100, color: '#1e88e5', desc: 'Excellent. Nearly uncrackable.' },
  }
  return map[Math.min(score, 5)]
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      className={`toggle-track ${on ? 'on' : 'off'}`}
      role="switch"
      aria-checked={on}
      tabIndex={0}
      onClick={() => onChange(!on)}
      onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') onChange(!on) }}
    >
      <div className="toggle-thumb" />
    </div>
  )
}

function Screw() {
  return <div className="screw" />
}

export default function App() {
  const [length, setLength] = useState(12)
  const [useUpper, setUseUpper] = useState(true)
  const [useLower, setUseLower] = useState(true)
  const [useNumbers, setUseNumbers] = useState(true)
  const [useSymbols, setUseSymbols] = useState(true)
  const [password, setPassword] = useState(() =>
    generatePassword(12, true, true, true, true)
  )
  const [copied, setCopied] = useState(false)
  const [spinning, setSpinning] = useState(false)
  const copyTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const activeOptions = [useUpper, useLower, useNumbers, useSymbols].filter(Boolean).length
  const strength = getStrength(password, activeOptions)

  const regenerate = useCallback((
    len = length,
    upper = useUpper,
    lower = useLower,
    nums = useNumbers,
    syms = useSymbols
  ) => {
    const pw = generatePassword(len, upper, lower, nums, syms)
    setPassword(pw)
    setSpinning(true)
    setTimeout(() => setSpinning(false), 500)
  }, [length, useUpper, useLower, useNumbers, useSymbols])

  const handleCopy = () => {
    if (!password) return
    navigator.clipboard.writeText(password).then(() => {
      setCopied(true)
      if (copyTimeout.current) clearTimeout(copyTimeout.current)
      copyTimeout.current = setTimeout(() => setCopied(false), 1800)
    })
  }

  const handleToggle = (setter: (v: boolean) => void, current: boolean, key: 'upper' | 'lower' | 'nums' | 'syms') => {
    const next = !current
    setter(next)
    const args = {
      upper: key === 'upper' ? next : useUpper,
      lower: key === 'lower' ? next : useLower,
      nums: key === 'nums' ? next : useNumbers,
      syms: key === 'syms' ? next : useSymbols,
    }
    const any = args.upper || args.lower || args.nums || args.syms
    if (any) regenerate(length, args.upper, args.lower, args.nums, args.syms)
  }

  const handleLength = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value)
    setLength(val)
    regenerate(val)
  }

  const sliderStyle = {
    background: `linear-gradient(to right, #1c1c1c ${((length - 6) / (32 - 6)) * 100}%, rgba(0,0,0,0.12) ${((length - 6) / (32 - 6)) * 100}%)`,
  }

  return (
    <div
      className="bg-wave size-full flex items-center justify-center"
      style={{ fontFamily: "'Inter', sans-serif", minHeight: '100vh' }}
    >
      {/* Extra blobs */}
      <div className="blob1" />
      <div className="blob2" />

      {/* Card */}
      <div
        className="glass-card relative rounded-2xl w-full mx-4"
        style={{ maxWidth: 480, padding: '36px 36px 32px' }}
      >
        {/* Corner screws */}
        <div className="absolute top-4 left-4"><Screw /></div>
        <div className="absolute top-4 right-4"><Screw /></div>
        <div className="absolute bottom-4 left-4"><Screw /></div>
        <div className="absolute bottom-4 right-4"><Screw /></div>

        {/* Header */}
        <div className="text-center mb-6">
          <h1
            style={{
              fontSize: '1.6rem',
              fontWeight: 700,
              color: '#111',
              letterSpacing: '-0.02em',
              marginBottom: 4,
            }}
          >
            Password generator
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#888', fontWeight: 400 }}>
            Generate strong unique passwords
          </p>
        </div>

        {/* Password output */}
        <div className="pw-field flex items-center gap-2 px-4 py-3 mb-3">
          <span
            style={{
              flex: 1,
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '1rem',
              fontWeight: 500,
              color: '#111',
              letterSpacing: '0.04em',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              minWidth: 0,
            }}
          >
            {password || '——'}
          </span>
          <button className="copy-btn" onClick={handleCopy}>
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <button
            type="button"
            className={`refresh-btn ${spinning ? 'spinning' : ''}`}
            onClick={() => regenerate()}
            aria-label="Regenerate"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
            </svg>
          </button>
        </div>

        {/* Strength indicator */}
        <div
          style={{
            background: 'rgba(212, 160, 32, 0.1)',
            border: '1px solid rgba(212, 160, 32, 0.25)',
            borderRadius: 10,
            padding: '8px 14px',
            marginBottom: 20,
          }}
        >
          <div className="flex items-center justify-between mb-2" style={{ gap: 8 }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: strength.color }}>
              {strength.label}:
            </span>
            <span style={{ fontSize: '0.8rem', color: '#666', flex: 1 }}>
              {strength.desc}
            </span>
          </div>
          <div className="strength-bar-track">
            <div
              className="strength-bar-fill"
              style={{ width: `${strength.pct}%`, background: strength.color }}
            />
          </div>
        </div>

        {/* Divider */}
        <div style={{ borderTop: '1px solid rgba(0,0,0,0.07)', marginBottom: 20 }} />

        {/* Password length slider */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <label style={{ fontSize: '0.9rem', fontWeight: 500, color: '#222' }}>
              Password length
            </label>
            <span
              style={{
                fontSize: '0.875rem',
                fontWeight: 700,
                color: '#111',
                background: 'rgba(0,0,0,0.06)',
                borderRadius: 6,
                padding: '2px 8px',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {length}
            </span>
          </div>
          <input
            type="range"
            min={6}
            max={32}
            value={length}
            onChange={handleLength}
            style={{ ...sliderStyle, width: '100%' }}
          />
          <div className="flex justify-between" style={{ marginTop: 4 }}>
            <span style={{ fontSize: '0.7rem', color: '#aaa' }}>6</span>
            <span style={{ fontSize: '0.7rem', color: '#aaa' }}>32</span>
          </div>
        </div>

        {/* Options */}
        {[
          { label: 'Include Uppercase Letters', on: useUpper, key: 'upper' as const, setter: setUseUpper },
          { label: 'Include Lowercase Letters', on: useLower, key: 'lower' as const, setter: setUseLower },
          { label: 'Include Numbers', on: useNumbers, key: 'nums' as const, setter: setUseNumbers },
          { label: 'Include Symbols', on: useSymbols, key: 'syms' as const, setter: setUseSymbols },
        ].map(({ label, on, key, setter }) => (
          <div
            key={key}
            className="flex items-center justify-between"
            style={{ paddingBottom: 16, marginBottom: 16, borderBottom: '1px solid rgba(0,0,0,0.06)' }}
          >
            <span style={{ fontSize: '0.9rem', fontWeight: 500, color: '#222' }}>{label}</span>
            <Toggle on={on} onChange={() => handleToggle(setter, on, key)} />
          </div>
        ))}
      </div>
    </div>
  )
}
