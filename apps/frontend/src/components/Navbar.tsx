import "./Navbar.css";

const Navbar = () => {
  return (
    <nav className="navbar">
      <button className="navbar-menu-btn" aria-label="Menu">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      <div className="navbar-brand">
        <span className="navbar-brand-name">Koko</span>
        <span className="navbar-brand-tagline">Health Information Companion</span>
      </div>
    </nav>
  );
};

export default Navbar;
