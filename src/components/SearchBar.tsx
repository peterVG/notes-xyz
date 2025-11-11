
import React, { useState } from 'react';
import { SearchBy } from '../services/databaseService';

interface SearchBarProps {
  onSearch: (query: string, by: SearchBy) => void;
  disabled: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, disabled }) => {
  const [query, setQuery] = useState('');
  const [searchBy, setSearchBy] = useState<SearchBy>('title');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query, searchBy);
  };
  
  const handleClear = () => {
    setQuery('');
    onSearch('', 'title');
  };

  return (
    <form onSubmit={handleSearch} className="p-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search notes..."
          disabled={disabled}
          className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={searchBy}
          onChange={(e) => setSearchBy(e.target.value as SearchBy)}
          disabled={disabled}
          className="px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="title">Title</option>
          <option value="content">Content</option>
          <option value="author">Author</option>
          <option value="tag">Tag</option>
        </select>
      </div>
      <div className="flex gap-2 mt-2">
         <button type="submit" disabled={disabled} className="w-full px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-slate-400">
            Search
         </button>
         <button type="button" onClick={handleClear} disabled={disabled} className="w-full px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 bg-slate-200 dark:bg-slate-600 rounded-md hover:bg-slate-300 dark:hover:bg-slate-500 disabled:bg-slate-400">
            Clear
         </button>
      </div>
    </form>
  );
};

export default SearchBar;
