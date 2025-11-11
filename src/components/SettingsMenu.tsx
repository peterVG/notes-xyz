import React, { useState } from 'react';

interface SettingsMenuProps {
  onImportClick: () => void;
  onExportClick: () => void;
  onClearClick: () => void;
  isImportDisabled: boolean;
  isExportDisabled: boolean;
  isClearDisabled: boolean;
}

const GearIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

const SettingsMenu: React.FC<SettingsMenuProps> = ({
  onImportClick,
  onExportClick,
  onClearClick,
  isImportDisabled,
  isExportDisabled,
  isClearDisabled,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsMenuOpen(true)}
      onMouseLeave={() => setIsMenuOpen(false)}
    >
      <button 
        className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-800 focus:ring-blue-500"
        aria-label="Settings"
        aria-haspopup="true"
        aria-expanded={isMenuOpen}
      >
        <GearIcon />
      </button>

      {isMenuOpen && (
        <div 
            className="absolute right-0 mt-1 w-48 bg-white dark:bg-slate-800 rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 z-10"
            role="menu"
            aria-orientation="vertical"
            aria-labelledby="options-menu"
        >
          <button
            onClick={onImportClick}
            disabled={isImportDisabled}
            className="w-full text-left block px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
            role="menuitem"
          >
            Import DB
          </button>
          <button
            onClick={onExportClick}
            disabled={isExportDisabled}
            className="w-full text-left block px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
            role="menuitem"
          >
            Export DB
          </button>
          <div className="border-t border-slate-200 dark:border-slate-700 my-1"></div>
          <button
            onClick={onClearClick}
            disabled={isClearDisabled}
            className="w-full text-left block px-4 py-2 text-sm text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
            role="menuitem"
          >
            Clear & Reset
          </button>
        </div>
      )}
    </div>
  );
};

export default SettingsMenu;