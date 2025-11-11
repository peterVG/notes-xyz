
import React from 'react';
import { NoteWithTags } from '../types';

interface NoteDetailProps {
  note: NoteWithTags | null;
}

const NoteDetail: React.FC<NoteDetailProps> = ({ note }) => {
  if (!note) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500 dark:text-slate-400">
        <div className="text-center">
            <h2 className="text-2xl font-semibold">Welcome to ENEX Viewer</h2>
            <p className="mt-2">Select a note from the list to view its content, or upload an ENEX file to get started.</p>
        </div>
      </div>
    );
  }

  return (
    <article className="prose prose-slate dark:prose-invert max-w-none">
      <h1>{note.title}</h1>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500 dark:text-slate-400 mb-6 border-b border-t border-slate-200 dark:border-slate-700 py-2">
        <span><strong>Author:</strong> {note.author}</span>
        <span><strong>Updated:</strong> {new Date(note.updatedAt).toLocaleString()}</span>
        <span><strong>Created:</strong> {new Date(note.createdAt).toLocaleString()}</span>
      </div>
      {note.tags.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {note.tags.map(tag => (
            <span key={tag} className="px-3 py-1 text-sm text-blue-800 dark:text-blue-200 bg-blue-100 dark:bg-blue-900/50 rounded-full">{tag}</span>
          ))}
        </div>
      )}
      {/* 
        The content from Evernote is HTML. We use dangerouslySetInnerHTML to render it.
        This is safe in this context because the user is uploading their own data.
        In a multi-user environment, this would require sanitization to prevent XSS.
      */}
      <div dangerouslySetInnerHTML={{ __html: note.content }} />
    </article>
  );
};

export default NoteDetail;
