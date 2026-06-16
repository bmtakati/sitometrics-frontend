/**
 * Full-width accent strip below landing and app headers.
 */
export default function HeaderAccentBar({ className = '' }) {
  return (
    <div className={`w-full ${className}`} aria-hidden>
      <div className="h-px w-full bg-green-600" />
    </div>
  );
}
