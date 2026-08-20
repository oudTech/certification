export default function Seal({ status = 'verified', compact = false }) {
  const verified = status === 'verified'
  const stroke = verified ? '#039855' : '#d92d20'
  const fill = verified ? '#ecfdf3' : '#fef3f2'

  return (
    <svg
      className={`seal ${status}${compact ? ' seal-compact' : ''}`}
      viewBox="0 0 120 120"
      role="img"
      aria-label={verified ? 'Verified seal' : 'Not verified'}
    >
      <circle cx="60" cy="60" r="54" fill={fill} stroke={stroke} strokeWidth="4" />
      <circle cx="60" cy="60" r="42" fill="none" stroke={stroke} strokeWidth="2" strokeDasharray="4 3" />
      {verified ? (
        <path
          d="M38 62 L52 76 L84 44"
          fill="none"
          stroke={stroke}
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <>
          <path d="M42 42 L78 78" stroke={stroke} strokeWidth="8" strokeLinecap="round" />
          <path d="M78 42 L42 78" stroke={stroke} strokeWidth="8" strokeLinecap="round" />
        </>
      )}
    </svg>
  )
}
