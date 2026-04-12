import { FiBarChart2, FiBook, FiSearch, FiEdit3 } from 'react-icons/fi';

const DECORATIONS = {
  dashboard: <FiBarChart2 />,
  shelf: <FiBook />,
  explore: <FiSearch />,
  review: <FiEdit3 />,
};

export default function HeroHeader({ title, subtitle, actions, variant = 'dashboard', children }) {
  return (
    <section className={`hero-header hero-header--${variant}`}>
      <div className="hero-header__decoration" aria-hidden="true">
        {DECORATIONS[variant] || <FiBook />}
      </div>
      <div className="hero-header__content">
        <h1 className="hero-header__title">{title}</h1>
        {subtitle && <p className="hero-header__subtitle">{subtitle}</p>}
        {actions && <div className="hero-header__actions">{actions}</div>}
        {children}
      </div>
    </section>
  );
}
