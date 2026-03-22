import { useState, useRef, useCallback, useMemo, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatedContent } from '../components/ui/AnimatedContent';
import { BlurText } from '../components/ui/BlurText';
import { GradientText } from '../components/ui/GradientText';
import { Particles } from '../components/ui/Particles';
import { StarBorder } from '../components/ui/StarBorder';
import * as gridCache from '../cache/gridCache';

const EXAMPLE_CITIES = [
  'University of Virginia',
  'Charlottesville, VA',
  'Austin, TX',
  'Chicago, IL',
];

const VALUE_POINTS = [
  {
    title: 'Live carbon data',
    body: 'See how clean or dirty your local electricity is right now with one glance.',
  },
  {
    title: '24-hour forecast',
    body: 'Plan charging, laundry, and other heavy loads around the cleanest hours ahead.',
  },
  {
    title: 'Smart nudges',
    body: 'Get appliance-by-appliance suggestions that explain what to run and when.',
  },
];

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Enter your city or campus',
    body: 'Start with the place you care about. GridSense turns that location into a live grid view.',
  },
  {
    step: '02',
    title: 'Read the grid in plain English',
    body: 'We translate carbon intensity, weather, and forecast trends into a simple current status.',
  },
  {
    step: '03',
    title: 'Act when the grid is cleanest',
    body: 'The dashboard highlights the best windows for EV charging, laundry, and other big loads.',
  },
];

const MemoParticles = memo(Particles);

export default function Onboarding() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const navigate = useNavigate();
  const debounceRef = useRef(null);

  const handleSearchChange = useCallback((event) => {
    const value = event.target.value;
    setSearch(value);

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(value.trim());
    }, 150);
  }, []);

  // Check if user has previously visited the typed city
  const resumeHint = useMemo(() => {
    if (!debouncedSearch) return null;
    const cityName = debouncedSearch.replace(/,\s*\w{2}$/, '').trim();
    if (!cityName) return null;
    if (!gridCache.hasVisited(cityName)) return null;
    const age = gridCache.getLastVisitAge(cityName);
    if (!age) return null;
    const minutes = Math.floor(age / 60000);
    if (minutes < 1) return 'Resume — last seen just now';
    return `Resume — last seen ${minutes} min ago`;
  }, [debouncedSearch]);

  function go(city) {
    const name = city.replace(/,\s*\w{2}$/, '').trim();
    navigate(`/city/${encodeURIComponent(name)}`);
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (search.trim()) {
      go(search.trim());
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <MemoParticles className="opacity-80" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[380px] bg-[radial-gradient(circle_at_top,rgba(34,197,94,0.10),transparent_60%)]" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-[34rem] bg-[radial-gradient(circle_at_right,rgba(59,139,212,0.10),transparent_58%)]" />

      <main className="page-shell relative flex min-h-screen flex-col justify-center py-16">
        <AnimatedContent className="mx-auto w-full max-w-6xl" delay={50}>
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)] lg:items-center">
            <section>
              <span className="section-kicker">Real-time grid carbon advisor</span>
              <h1 className="section-title max-w-3xl text-4xl sm:text-5xl lg:text-6xl" style={{ letterSpacing: '-0.01em' }}>
                Meet <GradientText>GridSense</GradientText>, the fastest way to understand when your electricity is actually clean.
              </h1>
              <BlurText delay={180} className="section-subtitle max-w-2xl text-base sm:text-lg">
                GridSense watches your local power grid in real time, explains what the numbers mean, and helps you shift demand before the grid gets stressed.
              </BlurText>

              <div className="mt-8 flex flex-wrap gap-3">
                <span className="metric-chip">Built for campuses</span>
                <span className="metric-chip">Apartment communities</span>
                <span className="metric-chip">Small towns</span>
              </div>

              <form onSubmit={handleSubmit} className="card-glass mt-10 max-w-2xl p-4 sm:p-5">
                <label htmlFor="city-search" className="text-base font-semibold text-gray-900">
                  Start with a city, campus, or community
                </label>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <input
                    id="city-search"
                    type="text"
                    value={search}
                    onChange={handleSearchChange}
                    placeholder="Charlottesville, Austin, University of Virginia..."
                    className="h-14 flex-1 rounded-2xl border border-slate-200 bg-white px-5 text-base text-gray-900 outline-none transition placeholder:text-slate-400 focus:border-grid-clean/60 focus:bg-white"
                  />

                  <StarBorder className="sm:self-stretch">
                    <button
                      type="submit"
                      className="flex h-14 items-center justify-center rounded-full bg-grid-clean px-6 text-sm font-semibold text-slate-950 transition hover:bg-[#4ee27f]"
                    >
                      Open dashboard
                    </button>
                  </StarBorder>
                </div>

                {resumeHint && (
                  <p className="mt-2 text-sm font-medium text-grid-clean">{resumeHint}</p>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  {EXAMPLE_CITIES.map((city) => (
                    <button
                      key={city}
                      type="button"
                      onClick={() => {
                        setSearch(city);
                        go(city);
                      }}
                      className="pill-control"
                    >
                      {city}
                    </button>
                  ))}
                </div>
              </form>
            </section>

            <AnimatedContent delay={180} className="grid gap-4">
              {VALUE_POINTS.map((item) => (
                <div key={item.title} className="card-solid hover-lift p-6">
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-grid-clean">{item.title}</p>
                  <p className="mt-3 text-base leading-7 text-slate-600">{item.body}</p>
                </div>
              ))}

              <div className="card-glass p-6">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-400">Save energy without changing your routine</p>
                <p className="mt-3 text-base leading-7 text-slate-600">
                  You already charge your EV and run laundry — GridSense just tells you the best hour to do it. Less carbon, same effort.
                </p>
              </div>
            </AnimatedContent>
          </div>
        </AnimatedContent>

        <AnimatedContent delay={260} className="mt-20">
          <div className="mx-auto max-w-6xl">
            <span className="section-kicker">How it works</span>
            <h2 className="section-title max-w-2xl">From search to action in three steps</h2>
            <p className="section-subtitle max-w-3xl">
              Enter your location, see how clean the grid is right now, and get a recommendation for the best time to run your next load — all in under a minute.
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {HOW_IT_WORKS.map((item, index) => (
                <AnimatedContent key={item.step} delay={320 + index * 80}>
                  <div className="card-glass hover-lift h-full p-6">
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-grid-clean/80">{item.step}</p>
                    <h3 className="mt-4 font-display text-xl font-semibold text-gray-900">{item.title}</h3>
                    <p className="mt-3 text-base leading-7 text-slate-600">{item.body}</p>
                  </div>
                </AnimatedContent>
              ))}
            </div>
          </div>
        </AnimatedContent>
      </main>
    </div>
  );
}
