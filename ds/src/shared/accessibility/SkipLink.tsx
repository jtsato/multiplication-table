export function SkipLink({ targetId, label }: { targetId: string; label: string }) {
  return (
    <a className="skip-link" href={`#${targetId}`}>
      {label}
    </a>
  );
}
