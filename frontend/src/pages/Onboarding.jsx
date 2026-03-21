import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatedContent } from '../components/ui/AnimatedContent';
import { BlurText } from '../components/ui/BlurText';
import { GradientText } from '../components/ui/GradientText';
import { Particles } from '../components/ui/Particles';
import { StarBorder } from '../components/ui/StarBorder';

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

export default function Onboarding() {
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

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
      <Particles className="opacity-80" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[380px] bg-[radial-gradient(circle_at_top,rgba(34,197,94,0.16),transparent_60%)]" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-[34rem] bg-[radial-gradient(circle_at_right,rgba(59,139,212,0.16),transparent_58%)]" />

      <main className="page-shell relative flex min-h-screen flex-col justify-center py-16">
        <AnimatedContent className="mx-auto w-full max-w-6xl" delay={50}>
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)] lg:items-center">
            <section>
              <span className="section-kicker">Real-time grid carbon advisor</span>
              <h1 className="section-title max-w-3xl text-4xl sm:text-5xl lg:text-6xl">
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
                <label htmlFor="city-search" className="text-sm font-medium text-slate-300">
                  Start with a city, campus, or community
                </label>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <input
                    id="city-search"
                    type="text"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Charlottesville, Austin, University of Virginia..."
                    className="h-14 flex-1 rounded-2xl border border-white/10 bg-black/20 px-5 text-base text-white outline-none transition placeholder:text-slate-500 focus:border-grid-clean/60 focus:bg-black/30"
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
                  <p className="mt-3 text-base leading-7 text-slate-200">{item.body}</p>
                </div>
              ))}

              <div className="card-glass p-6">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-400">Why this page matters</p>
                <p className="mt-3 text-sm leading-7 text-slate-300">
                  Most people do not know when the grid is under pressure. GridSense makes that visible, then shows the cleanest hours to charge EVs, run laundry, or reduce strain during a heat wave.
                </p>
              </div>
            </AnimatedContent>
          </div>
        </AnimatedContent>

        <AnimatedContent delay={260} className="mt-20">
          <div className="mx-auto max-w-6xl">
            <span className="section-kicker">How it works</span>
            <h2 className="section-title max-w-2xl">A first-time visitor should understand the whole product in under a minute.</h2>
            <p className="section-subtitle max-w-3xl">
              The website is organized to answer one question after another: how clean the grid is right now, what is affecting it, when it will be cleaner next, and what action you should take.
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {HOW_IT_WORKS.map((item, index) => (
                <AnimatedContent key={item.step} delay={320 + index * 80}>
                  <div className="card-glass hover-lift h-full p-6">
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-grid-clean/80">{item.step}</p>
                    <h3 className="mt-4 font-display text-xl font-semibold text-white">{item.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-300">{item.body}</p>
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
