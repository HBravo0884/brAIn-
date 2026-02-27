import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import {
  Search,
  X,
  FileText,
  Calendar,
  Award,
  Target,
  CheckSquare,
  DollarSign,
  FileCheck,
  Briefcase,
} from 'lucide-react';

const GlobalSearch = () => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState({});
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const {
    documents,
    meetings,
    grants,
    paymentRequests,
    tasks,
    templates,
  } = useApp();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      const allResults = getAllResultsFlat();

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, allResults.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (allResults[selectedIndex]) {
          handleResultClick(allResults[selectedIndex]);
        }
      } else if (e.key === 'Escape') {
        setIsOpen(false);
        setQuery('');
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, results]);

  // Debounced search
  useEffect(() => {
    if (query.length >= 2) {
      const timer = setTimeout(() => {
        performSearch(query);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setResults({});
      setIsOpen(false);
    }
  }, [query]);

  const highlightText = (text, query) => {
    if (!query || !text) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <mark key={i} className="bg-yellow-200 font-semibold">
              {part}
            </mark>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </span>
    );
  };

  const searchInFields = (item, fields, query) => {
    const lowerQuery = query.toLowerCase();
    for (const field of fields) {
      const value = item[field];
      if (value && typeof value === 'string' && value.toLowerCase().includes(lowerQuery)) {
        return {
          matches: true,
          snippet: value.substring(0, 150),
          matchedField: field,
        };
      }
    }
    return { matches: false };
  };

  const searchInNestedStructure = (grant, query) => {
    const lowerQuery = query.toLowerCase();
    const matches = [];

    // Search grant itself
    if (grant.title?.toLowerCase().includes(lowerQuery) ||
        grant.description?.toLowerCase().includes(lowerQuery) ||
        grant.fundingAgency?.toLowerCase().includes(lowerQuery)) {
      matches.push({
        type: 'grant',
        item: grant,
        snippet: grant.description || grant.title,
        path: grant.title,
      });
    }

    // Search aims
    if (grant.aims && Array.isArray(grant.aims)) {
      grant.aims.forEach((aim) => {
        if (aim.title?.toLowerCase().includes(lowerQuery) ||
            aim.description?.toLowerCase().includes(lowerQuery)) {
          matches.push({
            type: 'aim',
            item: aim,
            grant: grant,
            snippet: aim.description || aim.title,
            path: `${grant.title} > ${aim.title}`,
          });
        }

        // Search sub-aims
        if (aim.subAims && Array.isArray(aim.subAims)) {
          aim.subAims.forEach((subAim) => {
            if (subAim.title?.toLowerCase().includes(lowerQuery) ||
                subAim.description?.toLowerCase().includes(lowerQuery)) {
              matches.push({
                type: 'subAim',
                item: subAim,
                aim: aim,
                grant: grant,
                snippet: subAim.description || subAim.title,
                path: `${grant.title} > ${aim.title} > ${subAim.title}`,
              });
            }

            // Search activities
            if (subAim.activities && Array.isArray(subAim.activities)) {
              subAim.activities.forEach((activity) => {
                if (activity.title?.toLowerCase().includes(lowerQuery) ||
                    activity.description?.toLowerCase().includes(lowerQuery) ||
                    activity.deliverables?.toLowerCase().includes(lowerQuery)) {
                  matches.push({
                    type: 'activity',
                    item: activity,
                    subAim: subAim,
                    aim: aim,
                    grant: grant,
                    snippet: activity.description || activity.title,
                    path: `${grant.title} > ${aim.title} > ${subAim.title} > ${activity.title}`,
                  });
                }
              });
            }
          });
        }
      });
    }

    return matches;
  };

  const performSearch = (searchQuery) => {
    const lowerQuery = searchQuery.toLowerCase();
    const searchResults = {};

    // Search Documents
    const documentResults = documents
      .map((doc) => {
        const search = searchInFields(doc, ['name', 'description', 'category'], searchQuery);
        if (search.matches) {
          return {
            ...doc,
            snippet: search.snippet,
            matchedField: search.matchedField,
          };
        }
        return null;
      })
      .filter(Boolean)
      .slice(0, 5);

    if (documentResults.length > 0) {
      searchResults.documents = {
        title: 'Documents',
        icon: FileText,
        items: documentResults,
        total: documents.filter((doc) =>
          searchInFields(doc, ['name', 'description', 'category'], searchQuery).matches
        ).length,
      };
    }

    // Search Meetings
    const meetingResults = meetings
      .map((meeting) => {
        const search = searchInFields(
          meeting,
          ['title', 'transcription', 'notes', 'agenda', 'attendees'],
          searchQuery
        );
        if (search.matches) {
          return {
            ...meeting,
            snippet: search.snippet,
            matchedField: search.matchedField,
          };
        }
        return null;
      })
      .filter(Boolean)
      .slice(0, 5);

    if (meetingResults.length > 0) {
      searchResults.meetings = {
        title: 'Meetings',
        icon: Calendar,
        items: meetingResults,
        total: meetings.filter((meeting) =>
          searchInFields(meeting, ['title', 'transcription', 'notes', 'agenda', 'attendees'], searchQuery).matches
        ).length,
      };
    }

    // Search Grants, Aims, Sub-Aims, and Activities
    const grantMatches = grants.flatMap((grant) => searchInNestedStructure(grant, searchQuery));

    if (grantMatches.length > 0) {
      searchResults.grants = {
        title: 'Grants & Aims',
        icon: Award,
        items: grantMatches.slice(0, 5),
        total: grantMatches.length,
      };
    }

    // Search Payment Requests
    const paymentResults = paymentRequests
      .map((pr) => {
        const search = searchInFields(
          pr,
          ['vendor', 'purpose', 'description', 'expenseType', 'budgetCategory'],
          searchQuery
        );
        if (search.matches) {
          return {
            ...pr,
            snippet: search.snippet,
            matchedField: search.matchedField,
          };
        }
        return null;
      })
      .filter(Boolean)
      .slice(0, 5);

    if (paymentResults.length > 0) {
      searchResults.paymentRequests = {
        title: 'Payment Requests',
        icon: DollarSign,
        items: paymentResults,
        total: paymentRequests.filter((pr) =>
          searchInFields(pr, ['vendor', 'purpose', 'description', 'expenseType', 'budgetCategory'], searchQuery).matches
        ).length,
      };
    }

    // Search Tasks
    const taskResults = tasks
      .map((task) => {
        const search = searchInFields(task, ['title', 'description'], searchQuery);
        if (search.matches) {
          return {
            ...task,
            snippet: search.snippet,
            matchedField: search.matchedField,
          };
        }
        return null;
      })
      .filter(Boolean)
      .slice(0, 5);

    if (taskResults.length > 0) {
      searchResults.tasks = {
        title: 'Tasks',
        icon: CheckSquare,
        items: taskResults,
        total: tasks.filter((task) =>
          searchInFields(task, ['title', 'description'], searchQuery).matches
        ).length,
      };
    }

    // Search Templates
    const templateResults = templates
      .map((template) => {
        const search = searchInFields(template, ['name', 'description', 'category'], searchQuery);
        if (search.matches) {
          return {
            ...template,
            snippet: search.snippet,
            matchedField: search.matchedField,
          };
        }
        return null;
      })
      .filter(Boolean)
      .slice(0, 5);

    if (templateResults.length > 0) {
      searchResults.templates = {
        title: 'Templates',
        icon: FileCheck,
        items: templateResults,
        total: templates.filter((template) =>
          searchInFields(template, ['name', 'description', 'category'], searchQuery).matches
        ).length,
      };
    }

    setResults(searchResults);
    setIsOpen(Object.keys(searchResults).length > 0);
    setSelectedIndex(0);
  };

  const getAllResultsFlat = () => {
    const flat = [];
    Object.keys(results).forEach((key) => {
      results[key].items.forEach((item) => {
        flat.push({ ...item, category: key });
      });
    });
    return flat;
  };

  const handleResultClick = (result) => {
    const category = result.category;

    if (category === 'documents') {
      navigate('/documents', { state: { highlightId: result.id } });
    } else if (category === 'meetings') {
      navigate('/meetings', { state: { openMeetingId: result.id } });
    } else if (category === 'grants') {
      if (result.type === 'grant') {
        navigate('/grants', { state: { viewGrantId: result.item.id } });
      } else if (result.type === 'aim') {
        navigate('/grants', { state: { viewGrantId: result.grant.id, expandAimId: result.item.id } });
      } else if (result.type === 'subAim') {
        navigate('/grants', {
          state: {
            viewGrantId: result.grant.id,
            expandAimId: result.aim.id,
            expandSubAimId: result.item.id
          }
        });
      } else if (result.type === 'activity') {
        navigate('/grants', {
          state: {
            viewGrantId: result.grant.id,
            expandAimId: result.aim.id,
            expandSubAimId: result.subAim.id,
            highlightActivityId: result.item.id
          }
        });
      }
    } else if (category === 'paymentRequests') {
      navigate('/payment-requests', { state: { highlightId: result.id } });
    } else if (category === 'tasks') {
      navigate('/workflows', { state: { highlightTaskId: result.id } });
    } else if (category === 'templates') {
      navigate('/templates', { state: { highlightId: result.id } });
    }

    setIsOpen(false);
    setQuery('');
  };

  const getTotalResults = () => {
    return Object.values(results).reduce((sum, category) => sum + category.total, 0);
  };

  const getResultTitle = (result, category) => {
    if (category === 'grants') {
      return result.item.title || result.item.name;
    } else if (category === 'documents') {
      return result.name;
    } else if (category === 'meetings') {
      return result.title;
    } else if (category === 'paymentRequests') {
      return `PRF #${result.prfNumber || result.id.slice(0, 8)} - ${result.vendor}`;
    } else if (category === 'tasks') {
      return result.title;
    } else if (category === 'templates') {
      return result.name;
    }
    return 'Unknown';
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-2xl">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search across all content..."
          className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all bg-white"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setIsOpen(false);
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && (
        <div className="absolute top-full mt-2 w-full bg-white rounded-lg shadow-2xl border border-gray-200 max-h-[600px] overflow-y-auto z-50">
          {/* Header */}
          <div className="sticky top-0 bg-gray-50 border-b border-gray-200 px-4 py-3">
            <p className="text-sm text-gray-600">
              Found <span className="font-semibold text-primary-600">{getTotalResults()}</span> results for "
              <span className="font-semibold">{query}</span>"
            </p>
          </div>

          {/* Results by Category */}
          <div className="py-2">
            {Object.keys(results).map((categoryKey, catIndex) => {
              const category = results[categoryKey];
              const CategoryIcon = category.icon;
              const startIndex = Object.keys(results)
                .slice(0, catIndex)
                .reduce((sum, key) => sum + results[key].items.length, 0);

              return (
                <div key={categoryKey} className="mb-2">
                  {/* Category Header */}
                  <div className="px-4 py-2 bg-gray-50 border-t border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CategoryIcon size={16} className="text-primary-600" />
                        <h3 className="text-sm font-semibold text-gray-700">{category.title}</h3>
                        <span className="text-xs text-gray-500">({category.total})</span>
                      </div>
                      {category.total > 5 && (
                        <span className="text-xs text-gray-500">Showing 5 of {category.total}</span>
                      )}
                    </div>
                  </div>

                  {/* Category Results */}
                  {category.items.map((item, index) => {
                    const flatIndex = startIndex + index;
                    const isSelected = flatIndex === selectedIndex;

                    return (
                      <div
                        key={item.id || `${categoryKey}-${index}`}
                        onClick={() => handleResultClick({ ...item, category: categoryKey })}
                        className={`px-4 py-3 cursor-pointer transition-colors ${
                          isSelected ? 'bg-primary-50 border-l-4 border-primary-500' : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <CategoryIcon
                            size={18}
                            className={`flex-shrink-0 mt-0.5 ${
                              isSelected ? 'text-primary-600' : 'text-gray-400'
                            }`}
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-gray-900 truncate">
                              {highlightText(getResultTitle(item, categoryKey), query)}
                            </h4>
                            {categoryKey === 'grants' && item.path && (
                              <p className="text-xs text-gray-500 mt-0.5 truncate">
                                {highlightText(item.path, query)}
                              </p>
                            )}
                            {item.snippet && (
                              <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                {highlightText(item.snippet, query)}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* Footer with keyboard shortcuts */}
          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-4 py-2">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-4">
                <span>
                  <kbd className="px-2 py-1 bg-white border border-gray-300 rounded">↑↓</kbd> Navigate
                </span>
                <span>
                  <kbd className="px-2 py-1 bg-white border border-gray-300 rounded">Enter</kbd> Select
                </span>
                <span>
                  <kbd className="px-2 py-1 bg-white border border-gray-300 rounded">Esc</kbd> Close
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;
