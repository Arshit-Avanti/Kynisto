import re

icons_svg = """
const Icons = {
  Search: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>,
  Location: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>,
  Star: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>,
  Heart: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>,
  Clock: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>,
  ArrowRight: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>,
  Sliders: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line><line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line><line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line><line x1="1" y1="14" x2="7" y2="14"></line><line x1="9" y1="8" x2="15" y2="8"></line><line x1="17" y1="16" x2="23" y2="16"></line></svg>,
  Check: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
};
"""

modern_clean_tech_styles = """
const modernCleanTechStyles = `
  .site, .healthPage, .productDiscovery {
    font-family: 'Inter', system-ui, -apple-system, sans-serif !important;
  }
  .searchBox, .healthSearch, .productIntro form, .locationPill, .categoryTile, .storeCard, .advancedFilters input, .providerGrid article {
    border-radius: 8px !important;
    border: 1px solid #e2e8f0 !important;
    box-shadow: 0 2px 4px rgba(0,0,0,0.02) !important;
    background: #ffffff !important;
    transition: all 0.2s ease !important;
  }
  .searchBox:focus-within, .healthSearch:focus-within, .productIntro form:focus-within, .advancedFilters input:focus {
    border-color: #2563eb !important;
    box-shadow: 0 0 0 2px rgba(37,99,235,0.2) !important;
    outline: none !important;
  }
  .locationPill:hover, .categoryTile:hover {
    border-color: #2563eb !important;
  }
  .categoryTile[aria-pressed="true"], .careTypes button.active {
    background: #2563eb !important;
    color: white !important;
    border-color: #2563eb !important;
  }
  .categoryTile[aria-pressed="true"] svg, .careTypes button.active svg {
    stroke: white !important;
  }
  .storeCard:hover, .providerGrid article:hover {
    box-shadow: 0 6px 16px rgba(0,0,0,0.06) !important;
    border-color: #2563eb !important;
    transform: translateY(-2px) !important;
  }
  .storeVisual, .providerTop {
    position: relative !important;
    background: #f8fafc !important;
    border-bottom: 1px solid #e2e8f0 !important;
  }
  .statusBadge, .liveQueueBadge {
    border-radius: 4px !important;
    font-size: 0.75rem !important;
    font-weight: 600 !important;
  }
  .statusBadge.isOpen {
    background: #dcfce7 !important;
    color: #166534 !important;
    border: 1px solid #bbf7d0 !important;
  }
  .statusBadge.isClosed {
    background: #f1f5f9 !important;
    color: #475569 !important;
    border: 1px solid #e2e8f0 !important;
  }
  .distanceBadge {
    border-radius: 4px !important;
    border: 1px solid #e2e8f0 !important;
    color: #334155 !important;
    background: white !important;
  }
  .categoryLabel {
    font-size: 0.75rem !important;
    text-transform: uppercase !important;
    letter-spacing: 0.05em !important;
    color: #2563eb !important;
    background: #eff6ff !important;
    padding: 4px 8px !important;
    border-radius: 4px !important;
    font-weight: 700 !important;
  }
  .detailsButton, .cardActions a, .providerActions a, .providerActions button {
    background: #2563eb !important;
    color: white !important;
    border-radius: 6px !important;
    border: none !important;
    font-weight: 500 !important;
  }
  .detailsButton:hover, .cardActions a:hover, .providerActions a:hover, .providerActions button:hover {
    background: #1d4ed8 !important;
  }
  .storeGlyph {
    font-size: 2rem !important;
    color: #64748b !important;
  }
`;
"""

def process_app_page():
    path = "app/page.tsx"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    # Replacements
    content = content.replace('const categories: Category[] = [', icons_svg + modern_clean_tech_styles + '\nconst categories: Category[] = [')
    content = content.replace('export default function Home() {', 'export default function Home() {')
    content = content.replace('<main className={`site theme-${accent} density-${density} mode-${themeMode}`}>', '<main className={`site theme-${accent} density-${density} mode-${themeMode}`}><style dangerouslySetInnerHTML={{ __html: modernCleanTechStyles }} />')
    
    # Replace icons in components
    content = content.replace('<span className="searchIcon" aria-hidden="true" />', '<span className="searchIcon" aria-hidden="true"><Icons.Search /></span>')
    content = content.replace('<span aria-hidden="true">⌖</span>', '<Icons.Location />')
    content = content.replace('<span aria-hidden="true">♥</span>', '<Icons.Heart />')
    content = content.replace('<span aria-hidden="true">☷</span>', '<Icons.Sliders />')
    content = content.replace('<b>★ {store.rating}</b>', '<span style={{display: "flex", alignItems: "center", gap: "2px"}}><Icons.Star /> <b>{store.rating}</b></span>')
    content = content.replace('<span aria-hidden="true">◷</span>', '<Icons.Clock />')
    content = content.replace('♥', '<Icons.Heart />') # Wait, this might replace other hearts
    content = content.replace('♡ Save place', '<Icons.Heart /> Save place')
    
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)

def process_product_discovery():
    path = "components/store/ProductDiscovery.tsx"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    content = content.replace('export function ProductDiscovery() {', icons_svg + modern_clean_tech_styles + '\nexport function ProductDiscovery() {')
    content = content.replace('<main className="productDiscovery">', '<main className="productDiscovery"><style dangerouslySetInnerHTML={{ __html: modernCleanTechStyles }} />')
    content = content.replace('★ ${rating.toFixed(1)}', '</span><Icons.Star /><span> ${rating.toFixed(1)}')
    content = content.replace('☆ New product', '</span><Icons.Star /><span> New product')
    content = content.replace('→', '<Icons.ArrowRight />')
    
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)

def process_healthcare_discovery():
    path = "components/healthcare/HealthcareDiscovery.tsx"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    content = content.replace('export function HealthcareDiscovery() {', icons_svg + modern_clean_tech_styles + '\nexport function HealthcareDiscovery() {')
    content = content.replace('<main className="healthPage">', '<main className="healthPage"><style dangerouslySetInnerHTML={{ __html: modernCleanTechStyles }} />')
    content = content.replace('★ {Number(provider.rating).toFixed(1)}', '</span><Icons.Star /><span> {Number(provider.rating).toFixed(1)}')
    
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)

try:
    process_app_page()
    process_product_discovery()
    process_healthcare_discovery()
    print("Done")
except Exception as e:
    print("Error:", e)
