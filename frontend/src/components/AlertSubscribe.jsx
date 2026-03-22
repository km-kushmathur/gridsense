import { useEffect, useMemo, useState } from 'react';
import { sendAlertTest, subscribeAlerts, triggerAlert } from '../api/gridsense';

const TOPIC_PATTERN = /^[A-Za-z0-9-]{1,39}$/;

function BellIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M15 18H9M17 10C17 7.23858 14.7614 5 12 5C9.23858 5 7 7.23858 7 10V13.2C7 13.9526 6.73411 14.681 6.24952 15.2569L5 16.75H19L17.7505 15.2569C17.2659 14.681 17 13.9526 17 13.2V10Z"
        stroke="#64748B"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 19C10.4174 19.6254 11.127 20 12 20C12.873 20 13.5826 19.6254 14 19"
        stroke="#64748B"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function buildSuggestedTopic(city) {
  const slug = (city || 'gridsense')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 28);
  return `gridsense-${slug || 'alerts'}`.slice(0, 39);
}

export function AlertSubscribe({ city, onSubscribed }) {
  const suggestedTopic = useMemo(() => buildSuggestedTopic(city), [city]);

  const [expanded, setExpanded] = useState(false);
  const [topic, setTopic] = useState(suggestedTopic);
  const [subscription, setSubscription] = useState(null);
  const [loadingAction, setLoadingAction] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [triggerSent, setTriggerSent] = useState(false);
  const [testSent, setTestSent] = useState(false);

  useEffect(() => {
    setExpanded(false);
    setTopic(suggestedTopic);
    setSubscription(null);
    setError('');
    setCopied(false);
    setTriggerSent(false);
    setTestSent(false);
  }, [suggestedTopic]);

  useEffect(() => {
    if (!copied) return undefined;
    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  useEffect(() => {
    if (!triggerSent) return undefined;
    const timer = window.setTimeout(() => setTriggerSent(false), 2000);
    return () => window.clearTimeout(timer);
  }, [triggerSent]);

  useEffect(() => {
    if (!testSent) return undefined;
    const timer = window.setTimeout(() => setTestSent(false), 2000);
    return () => window.clearTimeout(timer);
  }, [testSent]);

  function getNormalizedTopic() {
    return topic.trim();
  }

  function validateTopic() {
    const normalizedTopic = getNormalizedTopic();
    if (!TOPIC_PATTERN.test(normalizedTopic)) {
      setError('Use letters, numbers, and hyphens only');
      return '';
    }
    return normalizedTopic;
  }

  async function handleSubscribe() {
    const normalizedTopic = validateTopic();
    if (!normalizedTopic) return;
    setLoadingAction('subscribe');
    setError('');
    try {
      const result = await subscribeAlerts(city, normalizedTopic);
      setSubscription(result);
      setExpanded(true);
      onSubscribed?.(result);
    } catch {
      setError("Couldn't connect — try again");
    } finally {
      setLoadingAction('');
    }
  }

  async function handleSendTest() {
    const normalizedTopic = validateTopic();
    if (!normalizedTopic) return;
    setLoadingAction('test');
    setError('');
    try {
      await sendAlertTest(city, normalizedTopic);
      setTestSent(true);
    } catch {
      setError("Couldn't connect — try again");
    } finally {
      setLoadingAction('');
    }
  }

  async function handleTriggerNow() {
    if (!subscription?.topic) return;
    setLoadingAction('trigger');
    setError('');
    try {
      await triggerAlert(subscription.topic);
      setTriggerSent(true);
    } catch {
      setError("Couldn't connect — try again");
    } finally {
      setLoadingAction('');
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(subscription?.ntfy_url || `https://ntfy.sh/${subscription?.topic || topic}`);
      setCopied(true);
    } catch {
      setError("Couldn't copy topic");
    }
  }

  const collapsedLabel = subscription ? `Watching ${city}` : 'Get notified when the grid changes';
  const collapsedSublabel = subscription ? 'Tap to view your ntfy topic details.' : 'Set up free push notifications on your phone — no account needed.';
  const collapsedAction = subscription ? 'View details' : 'Set up alerts';
  const topicUrl = subscription?.ntfy_url?.replace(/^https?:\/\//, '') || `ntfy.sh/${subscription?.topic || topic}`;

  return (
    <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
      {!expanded ? (
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white">
              <BellIcon />
            </div>
            <div>
              <p className={`text-base font-medium ${subscription ? 'text-grid-clean' : 'text-gray-900'}`}>{collapsedLabel}</p>
              <p className="mt-1 text-sm text-slate-500">{collapsedSublabel}</p>
            </div>
          </div>

          <button
            onClick={() => setExpanded(true)}
            className="min-h-[44px] shrink-0 rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
          >
            {collapsedAction}
          </button>
        </div>
      ) : subscription ? (
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-base font-semibold text-grid-clean">
                <span className="mr-2">✓</span>
                Watching {city}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                On your phone: download the ntfy app, then subscribe to this topic.
              </p>
            </div>

            <button
              onClick={() => setExpanded(false)}
              className="text-[11px] text-slate-400 transition hover:text-slate-600"
            >
              Collapse
            </button>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <code className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-green-700">
              {topicUrl}
            </code>
            <button
              onClick={handleCopy}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-medium text-slate-600 transition hover:border-slate-300"
            >
              {copied ? 'Copied ✓' : 'Copy'}
            </button>
          </div>

          <button
            onClick={handleTriggerNow}
            disabled={loadingAction === 'trigger'}
            className={`text-left text-[11px] transition ${
              triggerSent ? 'text-grid-clean' : 'text-slate-400 hover:text-slate-600'
            } disabled:opacity-60`}
          >
            {loadingAction === 'trigger'
              ? 'Sending alert...'
              : triggerSent
                ? 'Alert sent ✓'
                : 'Trigger test alert now →'}
          </button>

          {error ? <p className="text-[11px] text-[#EF4444]">{error}</p> : null}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <label htmlFor="alert-topic-input" className="block text-sm font-semibold text-gray-900">Choose a topic name</label>
              <p className="mt-1 text-sm text-slate-500">Anyone who knows this name can subscribe.</p>
            </div>

            <button
              onClick={() => setExpanded(false)}
              className="text-[11px] text-slate-400 transition hover:text-slate-600"
            >
              Hide
            </button>
          </div>

          <input
            id="alert-topic-input"
            type="text"
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
            placeholder="e.g. gridsense-uva-dorm-4"
            className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-base text-gray-900 outline-none transition placeholder:text-slate-400 focus:border-green-400"
          />

          <p className="text-sm text-slate-400">Suggested: {suggestedTopic}</p>

          <div className="grid gap-2 sm:grid-cols-2">
            <button
              onClick={handleSendTest}
              disabled={loadingAction === 'subscribe' || loadingAction === 'test'}
              className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-60"
            >
              {loadingAction === 'test' ? 'Sending...' : testSent ? 'Test sent ✓' : 'Send test'}
            </button>

            <button
              onClick={handleSubscribe}
              disabled={loadingAction === 'subscribe' || loadingAction === 'test'}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-grid-clean px-4 py-3 text-sm font-bold text-white transition hover:bg-[#1da34e] disabled:opacity-60"
            >
              {loadingAction === 'subscribe' ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-[1.5px] border-white/30 border-t-white" />
                  <span>Subscribing...</span>
                </>
              ) : 'Get Alerts'}
            </button>
          </div>

          {error ? <p className="text-[11px] text-[#EF4444]">{error}</p> : null}
        </div>
      )}
    </div>
  );
}
