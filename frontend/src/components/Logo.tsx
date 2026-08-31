export default function Logo({ size = 32 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2.5 select-none">
      <div
        className="rounded-lg bg-indigo-700 text-white font-semibold tracking-tight flex items-center justify-center relative"
        style={{ width: size, height: size, fontSize: size * 0.45, lineHeight: 1 }}
        aria-label="JobPulse logo"
      >
        <span className="absolute" style={{ left: size * 0.18, top: size * 0.12 }}>J</span>
        <span className="absolute" style={{ right: size * 0.18, bottom: size * 0.12 }}>P</span>
      </div>
      <span className="text-lg font-semibold tracking-tight text-neutral-900">
        JobPulse<span className="text-indigo-700">.</span>
      </span>
    </div>
  );
}
