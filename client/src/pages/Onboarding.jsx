import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  FiArrowRight, FiArrowLeft, FiCheck, FiBookOpen,
  FiMoon, FiZap, FiGlobe, FiTrendingUp,
} from 'react-icons/fi';

const GENRES = [
  'Fiction', 'Mystery', 'Science Fiction', 'Fantasy', 'Non-Fiction',
  'History', 'Biography', 'Philosophy', 'Self-Help', 'Psychology',
  'Business', 'Classics', 'Romance', 'Thriller', 'Poetry',
];

const GOALS = [
  { value: 5,  label: 'Casual',    desc: '5 books a year',    sub: 'One every ~10 weeks' },
  { value: 12, label: 'Regular',   desc: '12 books a year',   sub: 'One per month • recommended' },
  { value: 24, label: 'Dedicated', desc: '24 books a year',   sub: 'Two per month' },
  { value: 50, label: 'Marathon',  desc: '50 books a year',   sub: 'Nearly one per week' },
];

const MOTIVATIONS = [
  { value: 'escape',     icon: <FiMoon />,       label: 'Escape into stories',    desc: 'Fiction, fantasy, adventure' },
  { value: 'learn',      icon: <FiZap />,        label: 'Learn new skills',       desc: 'Business, self-help, practical guides' },
  { value: 'understand', icon: <FiGlobe />,      label: 'Understand the world',   desc: 'History, biography, science' },
  { value: 'grow',       icon: <FiTrendingUp />, label: 'Grow as a person',       desc: 'Philosophy, psychology, reflection' },
];

export default function Onboarding() {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [genres, setGenres] = useState([]);
  const [yearlyGoal, setYearlyGoal] = useState(12);
  const [motivation, setMotivation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const toggleGenre = (g) => {
    setError('');
    setGenres((prev) =>
      prev.includes(g) ? prev.filter(x => x !== g) : prev.length < 5 ? [...prev, g] : prev
    );
  };

  const next = () => {
    setError('');
    if (step === 1 && genres.length < 2) {
      setError('Pick at least 2 genres you enjoy.');
      return;
    }
    setStep(step + 1);
  };

  const back = () => {
    setError('');
    setStep(Math.max(1, step - 1));
  };

  const finish = async () => {
    setError('');
    setSubmitting(true);
    try {
      const res = await axios.put('/api/auth/onboarding', { genres, yearlyGoal, motivation });
      updateUser(res.data.user);
      navigate('/home', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // "Skip for now" — mark onboarding complete with minimal defaults
  const skip = async () => {
    setSubmitting(true);
    try {
      const res = await axios.put('/api/auth/onboarding', {
        genres: ['Fiction'],
        yearlyGoal: 12,
        motivation: '',
      });
      updateUser(res.data.user);
      navigate('/home', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong.');
      setSubmitting(false);
    }
  };

  return (
    <div className="onboarding-page">
      <div className="onboarding-bg" />

      <header className="onboarding-header">
        <div className="onboarding-brand">
          <FiBookOpen /> ShelfLife
        </div>
        <button className="onboarding-signout" onClick={logout}>Sign out</button>
      </header>

      <main className="onboarding-container">
        {/* Step progress */}
        <div className="onboarding-steps">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className={`onboarding-step-dot ${step === n ? 'active' : ''} ${step > n ? 'done' : ''}`}
            >
              {step > n ? <FiCheck /> : n}
            </div>
          ))}
        </div>

        <div className="onboarding-card glass-card">
          {/* ---------- STEP 1: Genres ---------- */}
          {step === 1 && (
            <>
              <h1 className="onboarding-title">Welcome{user?.name ? `, ${user.name.split(' ')[0]}` : ''}.</h1>
              <p className="onboarding-sub">
                Let's set up your shelf. First — what kinds of books do you actually return to? Pick 2–5 so we can tune your recommendations from day one.
              </p>

              <div className="onboarding-genre-grid">
                {GENRES.map((g) => {
                  const selected = genres.includes(g);
                  return (
                    <button
                      key={g}
                      type="button"
                      className={`onboarding-genre ${selected ? 'selected' : ''}`}
                      onClick={() => toggleGenre(g)}
                      disabled={!selected && genres.length >= 5}
                    >
                      {selected && <FiCheck className="onboarding-genre-check" />}
                      {g}
                    </button>
                  );
                })}
              </div>
              <p className="onboarding-hint">{genres.length}/5 selected</p>
            </>
          )}

          {/* ---------- STEP 2: Yearly goal ---------- */}
          {step === 2 && (
            <>
              <h1 className="onboarding-title">Set your reading goal</h1>
              <p className="onboarding-sub">
                A gentle target to keep you on pace. You can change this anytime.
              </p>

              <div className="onboarding-goal-grid">
                {GOALS.map((g) => (
                  <button
                    key={g.value}
                    type="button"
                    className={`onboarding-goal-card ${yearlyGoal === g.value ? 'selected' : ''}`}
                    onClick={() => setYearlyGoal(g.value)}
                  >
                    <span className="onboarding-goal-num">{g.value}</span>
                    <span className="onboarding-goal-label">{g.label}</span>
                    <span className="onboarding-goal-sub">{g.sub}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* ---------- STEP 3: Motivation ---------- */}
          {step === 3 && (
            <>
              <h1 className="onboarding-title">What draws you to reading?</h1>
              <p className="onboarding-sub">
                Optional — helps us personalize your recommendations.
              </p>

              <div className="onboarding-motiv-grid">
                {MOTIVATIONS.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    className={`onboarding-motiv ${motivation === m.value ? 'selected' : ''}`}
                    onClick={() => setMotivation(motivation === m.value ? '' : m.value)}
                  >
                    <div className="onboarding-motiv-icon">{m.icon}</div>
                    <div className="onboarding-motiv-text">
                      <strong>{m.label}</strong>
                      <p>{m.desc}</p>
                    </div>
                    {motivation === m.value && <FiCheck className="onboarding-motiv-check" />}
                  </button>
                ))}
              </div>
            </>
          )}

          {error && <div className="onboarding-error">{error}</div>}

          <div className="onboarding-footer">
            {step > 1 ? (
              <button className="btn-ghost" onClick={back} disabled={submitting}>
                <FiArrowLeft /> Back
              </button>
            ) : (
              <button className="btn-ghost" onClick={skip} disabled={submitting}>
                Skip for now
              </button>
            )}

            {step < 3 ? (
              <button className="btn-primary" onClick={next} disabled={submitting}>
                Continue <FiArrowRight />
              </button>
            ) : (
              <button className="btn-primary" onClick={finish} disabled={submitting}>
                {submitting ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="spinner" /> Saving…
                  </span>
                ) : (
                  <>Finish setup <FiCheck /></>
                )}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
