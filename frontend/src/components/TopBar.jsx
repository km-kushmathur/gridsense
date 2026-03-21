import { useNavigate } from 'react-router-dom';
import { ShinyText } from './ui/ShinyText';

export function TopBar({ cityName }) {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#08111bcc] backdrop-blur-xl">
      <div className="page-shell flex items-center justify-between py-4">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-left transition hover:border-white/20 hover:bg-white/[0.05]"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-grid-clean/15 text-grid-clean shadow-[0_0_24px_rgba(34,197,94,0.18)]">
            <span className="h-2.5 w-2.5 rounded-full bg-grid-clean" />
          </span>
          <span>
            <span className="block font-display text-lg font-semibold text-white">GridSense</span>
            <span className="block text-xs text-slate-400">Understand your grid in plain English</span>
          </span>
        </button>

        <div className="hidden items-center gap-4 lg:flex">
          {cityName && (
            <button
              onClick={() => navigate('/')}
              className="metric-chip hover:border-white/20 hover:bg-white/[0.06]"
            >
              <span className="h-2 w-2 rounded-full bg-sky-300" />
              <span>{cityName}</span>
            </button>
          )}

          <div className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm text-slate-300">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-grid-clean shadow-[0_0_12px_rgba(34,197,94,0.55)]" style={{ animation: 'pulse 2s infinite' }} />
              <ShinyText className="text-sm font-medium">Live updates every 5 minutes</ShinyText>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
