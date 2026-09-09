import { useState, useCallback, useRef } from 'react'

const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz'
const NUMBERS = '0123456789'
const SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?'

// Cryptographically secure random integer in [0, max - 1]
function getSecureRandomInt(max: number): number {
  if (max <= 0) return 0
  const array = new Uint32Array(1)
  window.crypto.getRandomValues(array)
  return array[0] % max
}

function generatePassword(
  length: number,
  useUpper: boolean,
  useLower: boolean,
  useNumbers: boolean,
  useSymbols: boolean
): string {
  let charset = ''
  const guaranteed: string[] = []

  if (useUpper) {
    charset += UPPERCASE
    guaranteed.push(UPPERCASE[getSecureRandomInt(UPPERCASE.length)])
  }
  if (useLower) {
    charset += LOWERCASE
    guaranteed.push(LOWERCASE[getSecureRandomInt(LOWERCASE.length)])
  }
  if (useNumbers) {
    charset += NUMBERS
    guaranteed.push(NUMBERS[getSecureRandomInt(NUMBERS.length)])
  }
  if (useSymbols) {
    charset += SYMBOLS
    guaranteed.push(SYMBOLS[getSecureRandomInt(SYMBOLS.length)])
  }

  if (!charset || length <= 0) return ''

  // Fill remaining slots
  const remainingCount = Math.max(0, length - guaranteed.length)
  const rest = Array.from({ length: remainingCount }, () =>
    charset[getSecureRandomInt(charset.length)]
  )

  // Shuffle combined array using Fisher-Yates
  const all = [...guaranteed, ...rest]
  for (let i = all.length - 1; i > 0; i--) {
    const j = getSecureRandomInt(i + 1)
    const temp = all[i]
    all[i] = all[j]
    all[j] = temp
  }

  return all.slice(0, length).join('')
}

type Strength = 'None' | 'Too Weak' | 'Weak' | 'Moderate' | 'Strong' | 'Very Strong'

function getStrength(password: string, options: number): { label: Strength; pct: number; color: string; desc: string } {
  const len = password.length
  if (len === 0 || options === 0) {
    return { label: 'None', pct: 0, color: '#9e9e9e', desc: 'Select at least one character set.' }
  }

  let score = 0
  if (len >= 8) score++
  if (len >= 12) score++
  if (len >= 16) score++
  if (options >= 3) score++
  if (options === 4) score++

  const map: Record<number, { label: Strength; pct: number; color: string; desc: string }> = {
    0: { label: 'Too Weak', pct: 15, color: '#e53935', desc: "This password won't survive a second." },
    1: { label: 'Weak', pct: 35, color: '#fb8c00', desc: 'Easily crackable. Add more options.' },
    2: { label: 'Moderate', pct: 58, color: '#d4a020', desc: 'Not bad, but not Fort Knox either.' },
    3: { label: 'Strong', pct: 80, color: '#43a047', desc: 'Solid. Hard to crack.' },
    4: { label: 'Very Strong', pct: 100, color: '#1e88e5', desc: 'Excellent. Nearly uncrackable.' },
    5: { label: 'Very Strong', pct: 100, color: '#1e88e5', desc: 'Excellent. Nearly uncrackable.' },
  }
  return map[Math.min(score, 5)]
}

function Toggle({
  on,
  disabled,
  onChange,
}: {
  on: boolean
  disabled?: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div
      className={`toggle-track ${on ? 'on' : 'off'}`}
      style={{
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
      role="switch"
      aria-checked={on}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      onClick={() => {
        if (!disabled) onChange(!on)
      }}
      onKeyDown={(e) => {
        if (!disabled && (e.key === ' ' || e.key === 'Enter')) {
          e.preventDefault()
          onChange(!on)
        }
      }}
    >
      <div className="toggle-thumb" />
    </div>
  )
}

function Screw() {
  return <div className="screw" />
}

export default function App() {
  const [length, setLength] = useState(14)
  const [useUpper, setUseUpper] = useState(true)
  const [useLower, setUseLower] = useState(true)
  const [useNumbers, setUseNumbers] = useState(true)
  const [useSymbols, setUseSymbols] = useState(true)
  const [password, setPassword] = useState(() =>
    generatePassword(14, true, true, true, true)
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
    setCopied(false)
    setSpinning(true)
    setTimeout(() => setSpinning(false), 500)
  }, [length, useUpper, useLower, useNumbers, useSymbols])

  const handleCopy = async () => {
    if (!password) return
    try {
      await navigator.clipboard.writeText(password)
      setCopied(true)
      if (copyTimeout.current) clearTimeout(copyTimeout.current)
      copyTimeout.current = setTimeout(() => setCopied(false), 1800)
    } catch {
      // Fallback
      const textarea = document.createElement('textarea')
      textarea.value = password
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      textarea.remove()
      setCopied(true)
      if (copyTimeout.current) clearTimeout(copyTimeout.current)
      copyTimeout.current = setTimeout(() => setCopied(false), 1800)
    }
  }

  const handleToggle = (key: 'upper' | 'lower' | 'nums' | 'syms') => {
    const nextStates = {
      upper: key === 'upper' ? !useUpper : useUpper,
      lower: key === 'lower' ? !useLower : useLower,
      nums: key === 'nums' ? !useNumbers : useNumbers,
      syms: key === 'syms' ? !useSymbols : useSymbols,
    }

    // Prevent deselecting all options (keep at least one active)
    const nextCount = Object.values(nextStates).filter(Boolean).length
    if (nextCount === 0) return

    setUseUpper(nextStates.upper)
    setUseLower(nextStates.lower)
    setUseNumbers(nextStates.nums)
    setUseSymbols(nextStates.syms)

    regenerate(length, nextStates.upper, nextStates.lower, nextStates.nums, nextStates.syms)
  }

  const handleLength = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value)
    setLength(val)
    regenerate(val)
  }

  const sliderPercent = ((length - 6) / (32 - 6)) * 100
  const sliderStyle = {
    background: `linear-gradient(to right, #1c1c1c ${sliderPercent}%, rgba(0,0,0,0.12) ${sliderPercent}%)`,
  }

  const optionsList = [
    { label: 'Include Uppercase Letters', on: useUpper, key: 'upper' as const },
    { label: 'Include Lowercase Letters', on: useLower, key: 'lower' as const },
    { label: 'Include Numbers', on: useNumbers, key: 'nums' as const },
    { label: 'Include Symbols', on: useSymbols, key: 'syms' as const },
  ]

  return (
    <div
      className="bg-wave size-full flex items-center justify-center relative overflow-hidden"
      style={{ fontFamily: "'Inter', sans-serif", minHeight: '100vh', padding: '20px 0' }}
    >
      {/* Glow blobs */}
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
          <button
            className="copy-btn"
            onClick={handleCopy}
            disabled={!password}
            style={{ opacity: !password ? 0.4 : 1 }}
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <button
            className={`refresh-btn ${spinning ? 'spinning' : ''}`}
            onClick={() => regenerate()}
            title="Regenerate password"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M13.5 2.5A7 7 0 1 0 14 8" />
              <polyline points="14 2 14 6 10 6" />
            </svg>
          </button>
        </div>

        {/* Strength indicator */}
        <div
          style={{
            background: `${strength.color}15`,
            border: `1px solid ${strength.color}35`,
            borderRadius: 10,
            padding: '8px 14px',
            marginBottom: 20,
            transition: 'background 0.3s ease, border-color 0.3s ease',
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
        {optionsList.map(({ label, on, key }) => {
          const isOnlyActive = on && activeOptions === 1
          return (
            <div
              key={key}
              className="flex items-center justify-between"
              style={{
                paddingBottom: 16,
                marginBottom: 16,
                borderBottom: '1px solid rgba(0,0,0,0.06)',
              }}
            >
              <span style={{ fontSize: '0.9rem', fontWeight: 500, color: '#222' }}>
                {label}
              </span>
              <Toggle
                on={on}
                disabled={isOnlyActive}
                onChange={() => handleToggle(key)}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
