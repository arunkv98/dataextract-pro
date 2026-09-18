// import './styles/main.css';
// import { renderHomePage } from './pages/HomePage';
// import { renderPDFExtractionPage } from './pages/PDFExtractionPage';

const app = document.querySelector<HTMLDivElement>('#app');

function handleRoute() {
  if (!app) return;
  
  const path = window.location.pathname;
  
  if (path === '/pdf-extraction') {
    app.innerHTML = renderPDFExtractionPage();
  } else {
    app.innerHTML = renderHomePage();
  }
}

// Handle navigation
window.addEventListener('popstate', handleRoute);

// Override link clicks for SPA navigation
document.addEventListener('click', (e) => {
  const target = e.target as HTMLElement;
  const link = target.closest('a');
  
  if (link && link.href) {
    const url = new URL(link.href);
    if (url.origin === window.location.origin) {
      e.preventDefault();
      window.history.pushState({}, '', url.pathname);
      handleRoute();
    }
  }
});

// Initial route
handleRoute();
function renderPDFExtractionPage(): string {
  throw new Error("Function not implemented.");
}

function renderHomePage(): string {
  throw new Error("Function not implemented.");
}

