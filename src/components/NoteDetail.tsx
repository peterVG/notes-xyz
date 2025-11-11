import React from 'react';
import { NoteWithTags } from '../types';

interface NoteDetailProps {
  note: NoteWithTags | null;
  onTagClick: (tagName: string) => void;
}

const NoteDetail: React.FC<NoteDetailProps> = ({ note, onTagClick }) => {
  if (!note) {
    return (
      <div className="flex items-center justify-center h-full text-center">
        <div>
            <h2 className="text-2xl font-bold text-slate-700 dark:text-slate-200">Welcome to Notes XYZ</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-2">Select a note from the list to view its details, or upload an ENEX file to get started.</p>
        </div>
      </div>
    );
  }

  // Evernote's content is HTML, so we need to render it as such.
  // The content is wrapped in a div to allow for scrolling if it overflows.
  return (
    <article className="h-full flex flex-col">
      <header className="flex-shrink-0 pb-4 border-b border-slate-200 dark:border-slate-700">
        <div className="relative group">
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white cursor-pointer">
            {note.title}
          </h1>
          <div 
            className="
              text-xs text-slate-500 dark:text-slate-400 
              flex flex-wrap gap-x-4 gap-y-1 
              transition-all duration-300 ease-in-out 
              opacity-0 max-h-0 overflow-hidden 
              group-hover:opacity-100 group-hover:max-h-20 group-hover:mt-2"
          >
            <span><strong>Author:</strong> {note.author || 'N/A'}</span>
            <span><strong>Created:</strong> {new Date(note.createdAt).toLocaleString()}</span>
            <span><strong>Updated:</strong> {new Date(note.updatedAt).toLocaleString()}</span>
          </div>
        </div>

        {note.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {note.tags.map(tag => (
              <button
                key={tag}
                onClick={() => onTagClick(tag)}
                className="px-2 py-1 text-xs font-medium text-sky-800 dark:text-sky-200 bg-sky-100 dark:bg-sky-900/50 rounded-full hover:bg-sky-200 dark:hover:bg-sky-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </header>
      <div 
        className="mt-4 flex-grow overflow-y-auto prose dark:prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: note.content }} 
      />
    </article>
  );
};

export default NoteDetail;
