// Header and Footer templates
const headerTemplate = `
<header class="site-header">
  <a class="brand" href="index.html">NN</a>
  <nav aria-label="Primary">
    <a href="about.html">About</a>
    <a href="articles.html">Articles</a>
    <button id="theme-toggle" class="ghost" aria-label="Toggle theme">🌓</button>
  </nav>
</header>
`;

const footerTemplate = `
<footer class="site-footer">
  <small>
      © <span id="year"></span> 
      Nazarii Nyzhnyk:
      💻 <a href="https://github.com/nazariinyzhnyk">GitHub</a>
      🔗 <a href="https://www.linkedin.com/in/nazariinyzhnyk/">LinkedIn</a>
  </small>
</footer>
`;

// Load header and footer
function loadPartials() {
  // Load header
  const headerPlaceholder = document.getElementById('header-placeholder');
  if (headerPlaceholder) {
    headerPlaceholder.outerHTML = headerTemplate;
  }

  // Load footer
  const footerPlaceholder = document.getElementById('footer-placeholder');
  if (footerPlaceholder) {
    footerPlaceholder.outerHTML = footerTemplate;
  }

  // Initialize theme toggle after header is loaded
  initializeThemeToggle();
  // Set year after footer is loaded
  setYear();
}

function initializeThemeToggle() {
  const toggle = document.getElementById('theme-toggle');
  if (toggle) {
    const stored = localStorage.getItem('theme');
    if (stored) document.documentElement.setAttribute('data-theme', stored);

    toggle.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', current);
      localStorage.setItem('theme', current);
    });
  }
}

function setYear() {
  const yearElement = document.getElementById('year');
  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }
}

// Load partials when DOM is ready
document.addEventListener('DOMContentLoaded', loadPartials);
