export default function Loading() {
  return (
    <main style={{
      minHeight: '100vh',
      background: '#FFFBF7',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: '16px',
    }}>
      {/* Spinner */}
      <div style={{
        width: '48px',
        height: '48px',
        border: '3px solid #E5DFD8',
        borderTopColor: '#D4AF37',
        borderRadius: '50%',
        animation: 'ika-spin 0.8s linear infinite',
      }} />
      <p style={{
        fontFamily: "'Playfair Display', serif",
        fontSize: '16px',
        color: '#9A9A9A',
        letterSpacing: '2px',
      }}>
        IKA
      </p>
      <style>{`@keyframes ika-spin { to { transform: rotate(360deg); } }`}</style>
    </main>
  )
}
