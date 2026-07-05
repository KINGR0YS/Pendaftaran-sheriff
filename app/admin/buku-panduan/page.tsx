'use client';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import RoleGuard from '@/components/RoleGuard';
import handbookData from '@/lib/handbook.json';
import { BookOpen, Search, Menu, X, ArrowLeft } from 'lucide-react';
import { Playfair_Display, League_Spartan, Lora } from 'next/font/google';

const playfair = Playfair_Display({ subsets: ['latin'], weight: ['500', '600', '700', '800', '900'] });
const spartan = League_Spartan({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'] });
const lora = Lora({ subsets: ['latin'], weight: ['400', '500', '600'] });

interface HandbookSection {
  id: string;
  title: string;
  content: string;
}

export default function BukuPanduanPage() {
  const { showToast } = useToast();
  const [activeSectionId, setActiveSectionId] = useState('pendahuluan');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [highlightQuery, setHighlightQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Close search results when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Strips HTML tags to search clean text content
  const stripHtml = (html: string) => {
    return html.replace(/<[^>]*>/g, ' ');
  };

  // Escapes regex special characters
  const escapeRegExp = (string: string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };

  // Run search logic
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    const q = query.trim();

    if (q.length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    const lowercaseQuery = q.toLowerCase();
    const results: any[] = [];

    handbookData.forEach((section: HandbookSection) => {
      const cleanText = stripHtml(section.content);
      const index = cleanText.toLowerCase().indexOf(lowercaseQuery);

      if (index !== -1) {
        // Build search snippet around match
        const start = Math.max(0, index - 50);
        const end = Math.min(cleanText.length, index + q.length + 70);
        let snippet = cleanText.slice(start, end).replace(/\s+/g, ' ').trim();
        
        if (start > 0) snippet = '...' + snippet;
        if (end < cleanText.length) snippet = snippet + '...';

        // Highlight matched word in snippet
        const highlightRegex = new RegExp(`(${escapeRegExp(q)})`, 'gi');
        const highlightedSnippet = snippet.replace(highlightRegex, '<mark>$1</mark>');

        results.push({
          id: section.id,
          title: section.title,
          snippet: highlightedSnippet
        });
      }
    });

    setSearchResults(results);
    setShowSearchResults(true);
  };

  const handleSelectSearchResult = (sectionId: string) => {
    setActiveSectionId(sectionId);
    setHighlightQuery(searchQuery);
    setShowSearchResults(false);
    setIsSidebarOpen(false);
    showToast(`Membuka: ${handbookData.find(s => s.id === sectionId)?.title}`, 'success');
  };

  // Generates highlighted text content without replacing tag attributes/names
  const getHighlightedContent = () => {
    const activeSection = handbookData.find(s => s.id === activeSectionId);
    if (!activeSection) return '';
    if (!highlightQuery || highlightQuery.trim() === '') return activeSection.content;

    const escapedQuery = escapeRegExp(highlightQuery);
    // Regex matches only text outside tags
    const regex = new RegExp(`(?<!<[^>]*)((${escapedQuery}))`, 'gi');
    return activeSection.content.replace(regex, '<mark class="search-hit">$1</mark>');
  };

  const activeSection = handbookData.find(s => s.id === activeSectionId) || handbookData[0];

  return (
    <RoleGuard allowedRoles={['pelatih', 'dismag', 'superadmin']}>
      <div style={{ maxWidth: '100%', overflowX: 'hidden' }}>
        
        {/* Scoped Stylings to Match Classical eBook Aesthetic */}
        <style dangerouslySetInnerHTML={{ __html: `
          :root {
            --navy-950: #060d18;
            --navy-900: #0b1a2e;
            --navy-850: #0e2138;
            --navy-800: #13283f;
            --navy-700: #1c3a5a;
            --navy-600: #2a4d73;
            --gold-700: #8a6b1a;
            --gold-600: #a9821f;
            --gold-500: #c9a227;
            --gold-400: #dab847;
            --gold-300: #e6cc73;
            --gold-100: #f3e7c2;
            --cream: #efe5cb;
            --ink: #edf1f6;
            --ink-mute: #9fb2c8;
            --ink-faint: #6f8398;
            --red: #b3473f;
            --red-soft: #3a1f1f;
            --green: #3e7a52;
            --green-soft: #16291d;
          }

          .hb-container {
            display: flex;
            background: linear-gradient(135deg, var(--navy-950) 0%, #030810 100%);
            border: 1px solid var(--gold-700);
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6);
            min-height: calc(100vh - 160px);
            margin-top: 1rem;
            position: relative;
          }

          /* Left Sidebar Navigation */
          .hb-sidebar {
            width: 260px;
            border-right: 1px solid var(--gold-700);
            display: flex;
            flex-direction: column;
            background: rgba(11, 26, 46, 0.4);
            flex-shrink: 0;
            transition: all 0.3s ease;
          }

          .hb-sidebar-header {
            padding: 1.25rem 1rem;
            border-bottom: 1px solid var(--gold-700);
            display: flex;
            align-items: center;
            justify-content: space-between;
          }

          .hb-sidebar-title {
            color: var(--gold-400);
            font-size: 0.9rem;
            font-weight: 700;
            letter-spacing: 2px;
            text-transform: uppercase;
          }

          .hb-nav-list {
            padding: 1rem 0.5rem;
            display: flex;
            flex-direction: column;
            gap: 4px;
            overflow-y: auto;
            flex: 1;
          }

          .hb-nav-btn {
            background: none;
            border: none;
            border-left: 2px solid transparent;
            color: var(--ink-mute);
            padding: 0.65rem 0.75rem;
            border-radius: 6px;
            text-align: left;
            cursor: pointer;
            font-size: 0.85rem;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 10px;
            transition: all 0.2s ease;
          }

          .hb-nav-btn:hover {
            background: rgba(255, 255, 255, 0.04);
            color: var(--ink);
          }

          .hb-nav-btn.active {
            background: linear-gradient(90deg, rgba(201, 162, 39, 0.12), transparent);
            color: var(--gold-300);
            border-left-color: var(--gold-500);
          }

          .hb-nav-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: var(--gold-700);
            flex-shrink: 0;
          }

          .hb-nav-btn.active .hb-nav-dot {
            background: var(--gold-400);
            box-shadow: 0 0 6px var(--gold-400);
          }

          /* Content Panel Pane */
          .hb-content {
            flex: 1;
            padding: 2.5rem 3rem;
            overflow-y: auto;
            color: var(--ink);
            min-width: 0;
          }

          /* Highlight Styling */
          mark.search-hit {
            background: var(--gold-400) !important;
            color: #1a1306 !important;
            padding: 0 2px;
            border-radius: 2px;
          }

          /* SOP Table and Lists styling inside content */
          .hb-content h3.block-title {
            color: var(--gold-300);
            font-size: 1.25rem;
            margin-top: 2rem;
            margin-bottom: 0.75rem;
            padding-bottom: 6px;
            border-bottom: 1px solid var(--navy-700);
          }

          .hb-content p {
            line-height: 1.7;
            font-size: 0.95rem;
            margin-bottom: 1.2rem;
            color: var(--ink);
          }

          .hb-content ul, .hb-content ol {
            margin-bottom: 1.5rem;
            padding-left: 1.25rem;
          }

          .hb-content ul li {
            list-style-type: none;
            position: relative;
            padding-left: 1.25rem;
            margin-bottom: 0.5rem;
            font-size: 0.92rem;
            line-height: 1.6;
          }

          .hb-content ul li::before {
            content: "▸";
            position: absolute;
            left: 0;
            color: var(--gold-500);
            font-size: 0.85rem;
          }

          .hb-content ol li {
            margin-bottom: 0.5rem;
            font-size: 0.92rem;
            line-height: 1.6;
          }

          .hb-content table {
            width: 100%;
            border-collapse: collapse;
            margin: 1.5rem 0;
            background: rgba(11, 26, 46, 0.3);
            border: 1px solid var(--gold-700);
            border-radius: 6px;
            overflow: hidden;
          }

          .hb-content th {
            background: rgba(201, 162, 39, 0.08);
            border-bottom: 2px solid var(--gold-700);
            color: var(--gold-300);
            font-weight: 700;
            text-align: left;
            padding: 0.75rem 1rem;
            font-size: 0.85rem;
            letter-spacing: 0.5px;
          }

          .hb-content td {
            padding: 0.75rem 1rem;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            font-size: 0.85rem;
            line-height: 1.5;
          }

          .hb-content tr:hover {
            background: rgba(255, 255, 255, 0.02);
          }

          .hb-content blockquote {
            border-left: 3px solid var(--gold-500);
            background: rgba(201, 162, 39, 0.03);
            padding: 0.75rem 1.25rem;
            margin: 1.5rem 0;
            font-style: italic;
            border-radius: 0 6px 6px 0;
          }

          .hb-content img {
            max-width: 100%;
            height: auto;
            border-radius: 8px;
            border: 1px solid var(--navy-600);
            margin: 1.5rem auto;
            display: block;
            box-shadow: 0 4px 15px rgba(0,0,0,0.5);
          }

          .hb-content .code-box {
            background: rgba(5, 7, 13, 0.7);
            border: 1px solid var(--navy-700);
            padding: 1rem;
            border-radius: 6px;
            font-family: monospace;
            font-size: 0.85rem;
            color: var(--gold-100);
            overflow-x: auto;
            margin: 1.5rem 0;
          }

          /* Classical Header rules */
          .hb-frame-rule {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 6px;
          }

          .hb-frame-rule .line {
            flex: 1;
            height: 2px;
            background: linear-gradient(90deg, var(--gold-700), var(--gold-400));
            border-radius: 1px;
          }

          .hb-frame-rule .cap {
            width: 8px;
            height: 10px;
            background: var(--gold-400);
            border-radius: 1px;
          }

          /* Floating Search overlay styling */
          .hb-search-results {
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: #0b1424;
            border: 1px solid var(--gold-600);
            border-radius: 8px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.7);
            max-height: 400px;
            overflow-y: auto;
            z-index: 99;
            margin-top: 8px;
          }

          .hb-res-item {
            display: block;
            width: 100%;
            text-align: left;
            padding: 12px 16px;
            background: none;
            border: none;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            color: var(--ink);
            cursor: pointer;
            transition: background 0.2s ease;
          }

          .hb-res-item:last-child {
            border-bottom: none;
          }

          .hb-res-item:hover {
            background: rgba(201, 162, 39, 0.12);
          }

          .hb-res-title {
            color: var(--gold-300);
            font-weight: 700;
            font-size: 0.85rem;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            margin-bottom: 4px;
          }

          .hb-res-snippet {
            font-size: 0.8rem;
            color: var(--ink-mute);
            line-height: 1.4;
          }

          .hb-res-snippet mark {
            background: var(--gold-500);
            color: #1a1306;
            padding: 0 1px;
            border-radius: 1px;
          }

          .hb-res-empty {
            padding: 16px;
            color: var(--ink-faint);
            font-size: 0.85rem;
            text-align: center;
          }

          /* Mobile Overlay Toggle */
          .hb-mobile-menu-btn {
            display: none;
            background: none;
            border: 1px solid var(--gold-600);
            color: var(--gold-300);
            width: 36px;
            height: 36px;
            border-radius: 6px;
            align-items: center;
            justify-content: center;
            cursor: pointer;
          }

          @media (max-width: 900px) {
            .hb-sidebar {
              position: absolute;
              left: -260px;
              top: 0;
              bottom: 0;
              z-index: 80;
              background: #060d18;
              height: 100%;
            }

            .hb-sidebar.open {
              left: 0;
              box-shadow: 10px 0 25px rgba(0, 0, 0, 0.7);
            }

            .hb-mobile-menu-btn {
              display: flex;
            }

            .hb-content {
              padding: 1.5rem 1.5rem;
            }
          }
        ` }} />

        {/* TOP CONFIG AND SEARCH PANEL */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button className="hb-mobile-menu-btn" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
              {isSidebarOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
            <h2 className="dashboard-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              📚 Buku Panduan Sheriff
            </h2>
          </div>

          {/* Search Box with Real-time Snippets */}
          <div ref={searchContainerRef} style={{ position: 'relative', width: '100%', maxWidth: '380px' }}>
            <div className="search-input-wrapper" style={{ margin: 0 }}>
              <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
              <input
                type="text"
                placeholder="Cari pedoman / SOP..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                style={{ paddingLeft: '2.25rem', width: '100%', height: '38px', borderRadius: '999px', border: '1px solid var(--color-border-custom)' }}
              />
              {searchQuery && (
                <button 
                  onClick={() => { setSearchQuery(''); setSearchResults([]); setHighlightQuery(''); setShowSearchResults(false); }}
                  style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {showSearchResults && (
              <div className="hb-search-results">
                {searchResults.length === 0 ? (
                  <div className="hb-res-empty">Tidak ditemukan hasil untuk "{searchQuery}"</div>
                ) : (
                  searchResults.map((res: any, idx: number) => (
                    <button 
                      key={idx} 
                      type="button" 
                      className="hb-res-item" 
                      onClick={() => handleSelectSearchResult(res.id)}
                    >
                      <div className="hb-res-title">{res.title}</div>
                      <div className="hb-res-snippet" dangerouslySetInnerHTML={{ __html: res.snippet }} />
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

        </div>

        {/* EBOOK CONTENT WRAPPER */}
        <div className="hb-container">
          
          {/* Mobile Overlay Background */}
          {isSidebarOpen && (
            <div 
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 70 }} 
              onClick={() => setIsSidebarOpen(false)}
            />
          )}

          {/* Left Navigation Sidebar */}
          <aside className={`hb-sidebar ${isSidebarOpen ? 'open' : ''}`}>
            <div className="hb-sidebar-header">
              <span className="hb-sidebar-title">Daftar Isi</span>
              <button 
                className="hb-mobile-menu-btn" 
                style={{ display: 'none' }} // Managed via css media query above
                onClick={() => setIsSidebarOpen(false)}
              >
                <X size={16} />
              </button>
            </div>
            
            <nav className="hb-nav-list">
              {handbookData.map((section: HandbookSection) => (
                <button
                  key={section.id}
                  className={`hb-nav-btn ${activeSectionId === section.id ? 'active' : ''}`}
                  onClick={() => {
                    setActiveSectionId(section.id);
                    setIsSidebarOpen(false);
                    // clear highlighting when changing tabs manually
                    setHighlightQuery('');
                  }}
                >
                  <span className="hb-nav-dot" />
                  {section.title}
                </button>
              ))}
            </nav>
          </aside>

          {/* Right Content Pane */}
          <main className="hb-content">
            
            <div className="hb-frame-rule">
              <div className="hb-frame-rule .cap"></div>
              <div className="hb-frame-rule .line"></div>
              <div className="hb-frame-rule .cap"></div>
            </div>

            <span style={{ 
              fontFamily: spartan.style.fontFamily, 
              fontSize: '0.7rem', 
              letterSpacing: '3px', 
              textTransform: 'uppercase', 
              color: 'var(--gold-400)',
              display: 'block',
              marginBottom: '0.5rem'
            }}>
              PANDUAN SOP SHERIFF
            </span>

            <h2 className={playfair.className} style={{ 
              fontSize: '2rem', 
              fontWeight: 700, 
              color: 'var(--cream)',
              marginBottom: '1.5rem',
              lineHeight: 1.2
            }}>
              {activeSection.title}
            </h2>

            {/* Main content body */}
            <div 
              className={lora.className}
              dangerouslySetInnerHTML={{ __html: getHighlightedContent() }} 
            />

          </main>

        </div>

      </div>
    </RoleGuard>
  );
}
