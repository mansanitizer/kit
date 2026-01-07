import React, { useState, useEffect, useCallback, useRef } from 'react';
import { SearchResult } from '../shared/types';
import LoadingOverlay from './LoadingOverlay';
import ErrorDialog from './ErrorDialog';
import Win98Icon from '../Common/Win98Icon';
import './Search.css';

interface SearchProps {
  onClose: () => void;
}

interface SearchHistoryItem {
  query: string;
  timestamp: number;
  resultCount: number;
}

const Search: React.FC<SearchProps> = ({ onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting' | 'error'>('disconnected');
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const [searchOptions, setSearchOptions] = useState({
    includeArchived: false,
    fileTypes: [] as string[],
    categories: [] as string[],
  });

  // Load search history from localStorage
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem('fileops-search-history');
      if (savedHistory) {
        setSearchHistory(JSON.parse(savedHistory));
      }
    } catch (error) {
      console.warn('Failed to load search history:', error);
    }
  }, []);

  // Setup connection monitoring
  useEffect(() => {
    const handleStatusUpdate = (event: CustomEvent) => {
      const { status, isConnected } = event.detail;
      setConnectionStatus(status);
    };

    window.addEventListener('fileops:status-update', handleStatusUpdate as EventListener);
    
    // Get initial connection status
    // TODO: Uncomment when preload script is updated
    // if (window.electronAPI?.fileops?.getConnectionStatus) {
    //   window.electronAPI.fileops.getConnectionStatus().then((status: any) => {
    //     setConnectionStatus(status.status);
    //   });
    // }

    return () => {
      window.removeEventListener('fileops:status-update', handleStatusUpdate as EventListener);
    };
  }, []);

  // Debounced search function
  const debouncedSearch = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
      return (searchQuery: string) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          if (searchQuery.trim()) {
            performSearch(searchQuery);
          }
        }, 500); // 500ms delay
      };
    })(),
    []
  );

  // Effect for debounced search
  useEffect(() => {
    if (query.trim()) {
      debouncedSearch(query);
    } else {
      setResults([]);
    }
  }, [query, debouncedSearch]);

  // Generate search suggestions
  useEffect(() => {
    if (query.trim() && query.length > 2) {
      generateSuggestions(query);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [query]);

  const generateSuggestions = async (searchQuery: string) => {
    try {
      // Get recent search history for suggestions
      const recentSearches = searchHistory
        .filter(item => item.query.toLowerCase().includes(searchQuery.toLowerCase()))
        .slice(0, 5)
        .map(item => item.query);

      // Get tags and keywords from FileOps if available
      let fileOpsSuggestions: string[] = [];
      // TODO: Uncomment when preload script is updated
      // if (window.electronAPI?.fileops?.getAllTagsAndKeywords) {
      //   try {
      //     const tagsData = await window.electronAPI.fileops.getAllTagsAndKeywords();
      //     if (tagsData.tags) {
      //       fileOpsSuggestions = tagsData.tags
      //         .filter((tag: string) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      //         .slice(0, 3);
      //     }
      //   } catch (error) {
      //     console.warn('Failed to get FileOps suggestions:', error);
      //   }
      // }

      // Combine suggestions
      const allSuggestions = [...new Set([...recentSearches, ...fileOpsSuggestions])];
      setSuggestions(allSuggestions);
      setShowSuggestions(allSuggestions.length > 0);
    } catch (error) {
      console.warn('Failed to generate suggestions:', error);
    }
  };

  const performSearch = async (searchQuery: string) => {
    setSearching(true);
    setError(null);
    setShowSuggestions(false);
    
    try {
      if (window.electronAPI?.fileops?.query) {
        const searchResults = await window.electronAPI.fileops.query(
          searchQuery,
          searchOptions
        );
        setResults(searchResults);
        
        // Add to search history
        addToSearchHistory(searchQuery, searchResults.length);
        
        console.log(`Search completed: "${searchQuery}" - ${searchResults.length} results`);
      } else {
        // Fallback mock results
        const mockResults = [
          {
            fileId: '1',
            title: 'Sample Document.pdf',
            description: 'A sample PDF document containing the search term',
            originalPath: '/path/to/sample.pdf',
            tags: ['document', 'pdf'],
            category: 'document',
            relevanceScore: 0.95,
            finalScore: 0.95,
            matchedFields: ['title', 'description'],
            reasoning: 'High relevance - matches in title and description',
            modifiedAt: new Date().toISOString(),
            sizeKB: 245,
          },
          {
            fileId: '2',
            title: 'Project Plan.docx',
            description: 'Project planning document with search term',
            originalPath: '/path/to/project.docx',
            tags: ['document', 'planning'],
            category: 'document',
            relevanceScore: 0.88,
            finalScore: 0.88,
            matchedFields: ['description'],
            reasoning: 'Good relevance - matches in description',
            modifiedAt: new Date(Date.now() - 86400000).toISOString(),
            sizeKB: 156,
          },
        ];
        setResults(mockResults);
        addToSearchHistory(searchQuery, mockResults.length);
        console.log('Using fallback mock search results');
      }
    } catch (error) {
      console.error('Search failed:', error);
      setError(`Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const addToSearchHistory = (query: string, resultCount: number) => {
    const newHistoryItem: SearchHistoryItem = {
      query,
      timestamp: Date.now(),
      resultCount,
    };

    setSearchHistory(prev => {
      const updated = [newHistoryItem, ...prev.filter(item => item.query !== query)].slice(0, 20);
      
      // Save to localStorage
      try {
        localStorage.setItem('fileops-search-history', JSON.stringify(updated));
      } catch (error) {
        console.warn('Failed to save search history:', error);
      }
      
      return updated;
    });
  };

  const handleSearch = () => {
    if (!query.trim()) return;
    performSearch(query);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    setShowSuggestions(false);
    performSearch(suggestion);
  };

  const handleHistoryItemClick = (historyItem: SearchHistoryItem) => {
    setQuery(historyItem.query);
    performSearch(historyItem.query);
  };

  const clearSearchHistory = () => {
    setSearchHistory([]);
    try {
      localStorage.removeItem('fileops-search-history');
    } catch (error) {
      console.warn('Failed to clear search history:', error);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    // In a real app, this would open the file or show file details
    const info = `
File Details:
- Name: ${result.title}
- Type: ${result.category}
- Size: ${formatFileSize(result.sizeKB)}
- Modified: ${formatDate(result.modifiedAt)}
- Relevance: ${(result.finalScore * 100).toFixed(0)}%
- Tags: ${result.tags.join(', ')}
- Path: ${result.originalPath}
- Reasoning: ${result.reasoning}
    `;
    alert(info);
  };

  const getFileIcon = (result: SearchResult) => {
    const extension = result.title.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return 'file';
      case 'docx':
      case 'doc':
        return 'file';
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
        return 'file';
      case 'txt':
        return 'file';
      default:
        return 'folder';
    }
  };

  const formatFileSize = (sizeKB: number) => {
    if (sizeKB < 1024) {
      return `${sizeKB} KB`;
    } else {
      return `${(sizeKB / 1024).toFixed(1)} MB`;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return '#00ff00';
      case 'connecting':
        return '#ffff00';
      case 'error':
        return '#ff0000';
      default:
        return '#cccccc';
    }
  };

  return (
    <div className="win98-search">
      {/* Loading Overlay */}
      <LoadingOverlay 
        show={searching} 
        message="Searching FileOps database..." 
      />

      {/* Error Dialog */}
      {error && (
        <ErrorDialog
          title="Search Error"
          message="Failed to perform search"
          details={error}
          onClose={() => setError(null)}
          onRetry={() => handleSearch()}
        />
      )}

      {/* Search Form */}
      <div className="win98-search-form">
        <div className="win98-search-input-group">
          <label className="win98-search-label">Find:</label>
          <div className="win98-search-input-container">
            <input
              ref={searchInputRef}
              type="text"
              className="win98-search-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder="Enter search terms..."
            />
            
            {/* Search Suggestions */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="win98-search-suggestions">
                {suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="win98-search-suggestion-item"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    {suggestion}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div className="win98-search-options">
          <div className="win98-search-options-row">
            <label className="win98-checkbox">
              <input
                type="checkbox"
                checked={searchOptions.includeArchived}
                onChange={(e) => setSearchOptions(prev => ({
                  ...prev,
                  includeArchived: e.target.checked
                }))}
              />
              <span className="win98-checkbox-label">Include archived files</span>
            </label>
          </div>
          
          <div className="win98-search-options-row">
            <label className="win98-search-label">File Types:</label>
            <div className="win98-search-checkboxes">
              {['document', 'image', 'video', 'audio', 'spreadsheet', 'archive', 'code'].map(type => (
                <label key={type} className="win98-checkbox">
                  <input
                    type="checkbox"
                    checked={searchOptions.fileTypes.includes(type)}
                    onChange={(e) => setSearchOptions(prev => ({
                      ...prev,
                      fileTypes: e.target.checked 
                        ? [...prev.fileTypes, type]
                        : prev.fileTypes.filter(t => t !== type)
                    }))}
                  />
                  <span className="win98-checkbox-label">{type}</span>
                </label>
              ))}
            </div>
          </div>
          
          <div className="win98-search-options-row">
            <label className="win98-search-label">Categories:</label>
            <div className="win98-search-checkboxes">
              {['project', 'personal', 'work', 'finance', 'documentation'].map(category => (
                <label key={category} className="win98-checkbox">
                  <input
                    type="checkbox"
                    checked={searchOptions.categories.includes(category)}
                    onChange={(e) => setSearchOptions(prev => ({
                      ...prev,
                      categories: e.target.checked 
                        ? [...prev.categories, category]
                        : prev.categories.filter(c => c !== category)
                    }))}
                  />
                  <span className="win98-checkbox-label">{category}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="win98-search-buttons">
          <button 
            className="win98-button" 
            onClick={handleSearch} 
            disabled={searching || !query.trim()}
          >
            {searching ? 'Searching...' : 'Find Now'}
          </button>
          <button className="win98-button" onClick={() => {
            setQuery('');
            setResults([]);
            setError(null);
          }}>
            Clear
          </button>
        </div>

        {/* Connection Status */}
        <div className="win98-search-status">
          <div 
            className="win98-connection-indicator"
            style={{ 
              backgroundColor: getConnectionStatusColor(),
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              display: 'inline-block',
              marginRight: '5px'
            }}
          ></div>
          <span className="win98-search-status-text">
            {connectionStatus === 'connected' ? 'FileOps Connected' : 
             connectionStatus === 'connecting' ? 'Connecting...' :
             connectionStatus === 'error' ? 'Connection Error' : 'FileOps Disconnected'}
          </span>
        </div>
      </div>

      {/* Search History */}
      {searchHistory.length > 0 && (
        <div className="win98-search-history">
          <div className="win98-search-history-header">
            <span>Recent Searches</span>
            <button 
              className="win98-button win98-button-small" 
              onClick={clearSearchHistory}
              title="Clear search history"
            >
              Clear
            </button>
          </div>
          <div className="win98-search-history-list">
            {searchHistory.slice(0, 5).map((item, index) => (
              <div
                key={index}
                className="win98-search-history-item"
                onClick={() => handleHistoryItemClick(item)}
              >
                <span className="win98-search-history-query">{item.query}</span>
                <span className="win98-search-history-meta">
                  {item.resultCount} results • {new Date(item.timestamp).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search Results */}
      <div className="win98-search-results">
        <div className="win98-search-results-header">
          <span>Results ({results.length})</span>
          {results.length > 0 && (
            <span className="win98-search-results-query">
              for "{query}"
            </span>
          )}
        </div>
        
        <div className="win98-search-results-content">
          {searching ? (
            <div className="win98-loading">
              <div className="win98-loading-spinner"></div>
              <span>Searching...</span>
            </div>
          ) : results.length > 0 ? (
            <div className="win98-search-results-list">
              {results.map((result) => (
                <div 
                  key={result.fileId} 
                  className="win98-search-result-item"
                  onClick={() => handleResultClick(result)}
                >
                  <div className="win98-search-result-icon">
                    <Win98Icon name={getFileIcon(result)} size={16} />
                  </div>
                  <div className="win98-search-result-content">
                    <div className="win98-search-result-title">{result.title}</div>
                    <div className="win98-search-result-description">{result.description}</div>
                    <div className="win98-search-result-meta">
                      <span>{formatFileSize(result.sizeKB)}</span>
                      <span className="win98-search-result-separator">•</span>
                      <span>{formatDate(result.modifiedAt)}</span>
                      <span className="win98-search-result-separator">•</span>
                      <span>Score: {(result.finalScore * 100).toFixed(0)}%</span>
                    </div>
                    <div className="win98-search-result-reasoning">
                      {result.reasoning}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : query && !searching ? (
            <div className="win98-search-no-results">
              <div className="win98-search-no-results-icon">
                <Win98Icon name="search" size={32} />
              </div>
              <div className="win98-search-no-results-text">
                No files found matching "{query}"
              </div>
              <div className="win98-search-no-results-suggestions">
                <div>Suggestions:</div>
                <ul>
                  <li>Try different keywords</li>
                  <li>Check your spelling</li>
                  <li>Use more general terms</li>
                  <li>Try removing some filters</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="win98-search-placeholder">
              <div className="win98-search-placeholder-icon">
                <Win98Icon name="search" size={32} />
              </div>
              <div className="win98-search-placeholder-text">
                Enter search terms and click "Find Now" to search files
              </div>
              <div className="win98-search-placeholder-tips">
                <div>Search Tips:</div>
                <ul>
                  <li>Use natural language: "Find documents about project planning"</li>
                  <li>Search by file type: "PDF documents"</li>
                  <li>Search by date: "Files from last week"</li>
                  <li>Use tags: "Files tagged with 'important'"</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Search;
