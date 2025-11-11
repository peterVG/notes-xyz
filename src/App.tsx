import React, { useState, useEffect, useCallback, useRef } from 'react';
import { NoteWithTags } from './types';
import { 
  Database, 
  initDb, 
  isFileUploaded, 
  addUploadedFile, 
  insertNotes, 
  getAllNotes, 
  searchNotes, 
  getNoteById, 
  SearchBy,
  saveDbToStorage,
  createFreshDb
} from './services/databaseService';
import { calculateFileHash } from './services/cryptoService';
import { parseEnex } from './services/enexParser';
import NoteList from './components/NoteList';
import NoteDetail from './components/NoteDetail';
import SearchBar from './components/SearchBar';
import StatusBar from './components/StatusBar';

const App: React.FC = () => {
  const [db, setDb] = useState<Database | null>(null);
  const [notes, setNotes] = useState<NoteWithTags[]>([]);
  const [selectedNote, setSelectedNote] = useState<NoteWithTags | null>(null);
  const [status, setStatus] = useState('Initializing database...');
  const [isLoading, setIsLoading] = useState(true);
  
  const fileUploadRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    initDb()
      .then(database => {
        setDb(database);
        const allNotes = getAllNotes(database);
        setNotes(allNotes);
        if (allNotes.length > 0) {
          setStatus(`Database loaded from storage. ${allNotes.length} notes available.`);
        } else {
          setStatus(`Database ready. Upload an ENEX file to begin.`);
        }
      })
      .catch(err => {
        console.error(err);
        setStatus('Error initializing database.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const refreshNotes = useCallback(() => {
    if (db) {
      const allNotes = getAllNotes(db);
      setNotes(allNotes);
    }
  }, [db]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0 || !db) return;

    const file = event.target.files[0];
    setIsLoading(true);
    setStatus(`Processing ${file.name}...`);

    try {
      const content = await file.text();
      const hash = await calculateFileHash(content);

      if (isFileUploaded(db, hash)) {
        setStatus(`File ${file.name} has already been uploaded.`);
        setIsLoading(false);
        return;
      }

      setStatus(`Parsing notes from ${file.name}...`);
      const parsedNotes = parseEnex(content);
      
      setStatus(`Importing ${parsedNotes.length} notes...`);
      const insertedCount = insertNotes(db, parsedNotes);
      addUploadedFile(db, hash, file.name);

      await saveDbToStorage(db);

      refreshNotes();
      setStatus(`Successfully imported and saved ${insertedCount} notes from ${file.name}.`);
    } catch (error) {
      console.error(error);
      setStatus(`Error processing file: ${(error as Error).message}`);
    } finally {
      setIsLoading(false);
       if(event.target) event.target.value = ''; // Reset file input
    }
  };
  
  const handleSelectNote = useCallback((id: number) => {
    if (db) {
      const note = getNoteById(db, id);
      setSelectedNote(note);
    }
  }, [db]);

  const handleSearch = useCallback((query: string, by: SearchBy) => {
    if (db) {
      if(query.trim() === '') {
        refreshNotes();
        setStatus(`Search cleared. Displaying all notes.`);
        return;
      }
      setStatus(`Searching for "${query}" by ${by}...`);
      const results = searchNotes(db, query, by);
      setNotes(results);
      setStatus(`${results.length} notes found for "${query}".`);
      setSelectedNote(null);
    }
  }, [db, refreshNotes]);

  const handleDeleteDb = async () => {
    if (!db) return;
    const confirmation = window.confirm('Are you sure you want to delete all data? This action is permanent and cannot be undone.');
    if (confirmation) {
        setIsLoading(true);
        setStatus('Deleting database...');
        try {
            const newDb = await createFreshDb();
            setDb(newDb);
            setNotes([]);
            setSelectedNote(null);
            setStatus('Database has been cleared. Ready for new uploads.');
        } catch (error) {
            console.error(error);
            setStatus(`Error deleting database: ${(error as Error).message}`);
        } finally {
            setIsLoading(false);
        }
    }
  };

  return (
    <div className="flex flex-col h-screen font-sans text-slate-800 dark:text-slate-200">
      <header className="flex-shrink-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4 flex items-center justify-between shadow-sm">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">ENEX Viewer</h1>
        <div className="flex items-center gap-2">
            <button onClick={() => fileUploadRef.current?.click()} className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-slate-400" disabled={isLoading || !db}>Upload ENEX</button>
            <button onClick={handleDeleteDb} className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-md hover:bg-red-700 disabled:bg-slate-400" disabled={isLoading || !db || notes.length === 0}>Delete DB</button>
            <input type="file" accept=".enex" ref={fileUploadRef} onChange={handleFileChange} className="hidden" />
        </div>
      </header>
      
      <main className="flex-grow flex flex-col md:flex-row overflow-hidden">
        <aside className="w-full md:w-1/3 lg:w-1/4 flex flex-col border-r border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
          <SearchBar onSearch={handleSearch} disabled={isLoading || !db} />
          <div className="flex-grow overflow-y-auto">
            <NoteList notes={notes} onSelectNote={handleSelectNote} selectedNoteId={selectedNote?.id || null} />
          </div>
        </aside>

        <section className="w-full md:w-2/3 lg:w-3/4 flex-grow overflow-y-auto p-4 md:p-6 bg-white dark:bg-slate-900">
          <NoteDetail note={selectedNote} />
        </section>
      </main>
      
      <StatusBar status={status} isLoading={isLoading} />
    </div>
  );
};

export default App;
