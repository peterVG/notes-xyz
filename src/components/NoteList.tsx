
import React from 'react';
import { NoteWithTags } from '../types';

interface NoteListProps {
  notes: NoteWithTags[];
  onSelectNote: (id: number) => void;
  selectedNoteId: number | null;
}

const NoteList: React.FC<NoteListProps> = ({ notes, onSelectNote, selectedNoteId }) => {
  if (notes.length === 0) {
    return <div className="p-4 text-center text-slate-500 dark:text-slate-400">No notes found.</div>;
  }
  
  return (
    <ul>
      {notes.map(note => (
        <li key={note.id}>
          <button
            onClick={() => onSelectNote(note.id)}
            className={`w-full text-left p-4 border-b border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700/50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 ${selectedNoteId === note.id ? 'bg-blue-100 dark:bg-blue-900/50' : ''}`}
          >
            <h3 className="font-semibold text-slate-800 dark:text-slate-100 truncate">{note.title}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {new Date(note.updatedAt).toLocaleDateString()}
            </p>
             {note.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                    {note.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="px-2 py-0.5 text-xs text-slate-600 dark:text-slate-300 bg-slate-200 dark:bg-slate-600 rounded-full">{tag}</span>
                    ))}
                </div>
            )}
          </button>
        </li>
      ))}
    </ul>
  );
};

export default NoteList;
