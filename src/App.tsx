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
  createFreshDb,
  loadDbFromBuffer
} from './services/databaseService';
import { calculateFileHash } from './services/cryptoService';
import { parseEnex } from './services/enexParser';
import NoteList from './components/NoteList';
import NoteDetail from './components/NoteDetail';
import SearchBar from './components/SearchBar';
import StatusBar from './components/StatusBar';
import Modal from './components/Modal';
import SettingsMenu from './components/SettingsMenu';

const App: React.FC = () => {
  const [db, setDb] = useState<Database | null>(null);
  const [notes, setNotes] = useState<NoteWithTags[]>([]);
  const [selectedNote, setSelectedNote] = useState<NoteWithTags | null>(null);
  const [status, setStatus] = useState('Initializing database...');
  const [isLoading, setIsLoading] = useState(true);
  const [modal, setModal] = useState<{ isOpen: boolean; title: string; message: string }>({
    isOpen: false,
    title: '',
    message: '',
  });
  
  const fileUploadRef = useRef<HTMLInputElement>(null);
  const dbImportRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    initDb()
      .then(database => {
        setDb(database);
        setNotes([]); // Start with no notes
        setStatus('Database ready. Upload an ENEX file or import a database to begin.');
      })
      .catch(err => {
        console.error(err);
        setStatus('Error initializing database.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0 || !db) return;

    const file = event.target.files[0];
    setIsLoading(true);
    setStatus(`Processing ${file.name}...`);

    try {
      const content = await file.text();
      const hash = await calculateFileHash(content);

      if (isFileUploaded(db, hash)) {
        setModal({
          isOpen: true,
          title: 'Duplicate File',
          message: `The file "${file.name}" has already been uploaded. Its contents are already in the database.`,
        });
        setIsLoading(false);
        if(event.target) event.target.value = ''; // Reset file input
        return;
      }

      setStatus(`Parsing notes from ${file.name}...`);
      const parsedNotes = parseEnex(content);
      
      setStatus(`Importing ${parsedNotes.length} notes...`);
      const insertedCount = insertNotes(db, parsedNotes);
      addUploadedFile(db, hash, file.name);

      setNotes(getAllNotes(db));
      setStatus(`Successfully imported ${insertedCount} notes. Export database to save changes.`);
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

  const handleSearch = useCallback((query: string) => {
    if (db) {
      if(query.trim() === '') {
        setNotes(getAllNotes(db));
        setStatus(`Search cleared. Displaying all notes.`);
        return;
      }
      setStatus(`Searching for "${query}"...`);
      const results = searchNotes(db, query);
      setNotes(results);
      setStatus(`${results.length} notes found for "${query}".`);
      setSelectedNote(null);
    }
  }, [db]);

  const handleTagClick = useCallback((tagName: string) => {
    if (db) {
      handleSearch(tagName);
    }
  }, [db, handleSearch]);

  const handleExportDb = () => {
    if (!db || notes.length === 0) return;
    setStatus('Exporting database...');
    try {
      const data = db.export();
      const blob = new Blob([data], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'notes_xyz.sqlite';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setStatus('Database exported successfully as notes_xyz.sqlite.');
    } catch (error) {
      console.error(error);
      setStatus(`Error exporting database: ${(error as Error).message}`);
    }
  };

  const handleImportDbChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return;

    const file = event.target.files[0];
    setIsLoading(true);
    setStatus(`Importing database from ${file.name}...`);

    try {
        const buffer = await file.arrayBuffer();
        const newDb = await loadDbFromBuffer(buffer);
        setDb(newDb);
        const allNotes = getAllNotes(newDb);
        setNotes(allNotes);
        setSelectedNote(null);
        setStatus(`Successfully imported ${allNotes.length} notes from ${file.name}.`);
    } catch (error) {
      console.error(error);
      setModal({ isOpen: true, title: 'Import Error', message: `Could not import database. The file may be corrupt or not a valid Notes XYZ database. Error: ${(error as Error).message}`});
      setStatus(`Error importing database.`);
    } finally {
      setIsLoading(false);
      if (event.target) event.target.value = ''; // Reset file input
    }
  };

  const handleDeleteDb = async () => {
    if (!db) return;
    const confirmation = window.confirm('Are you sure you want to clear all data? This will create a new empty database and unsaved changes will be lost.');
    if (confirmation) {
        setIsLoading(true);
        setStatus('Clearing database...');
        try {
            const newDb = await createFreshDb();
            setDb(newDb);
            setNotes([]);
            setSelectedNote(null);
            setStatus('Database has been cleared. Ready for new uploads.');
        } catch (error) {
            console.error(error);
            setStatus(`Error clearing database: ${(error as Error).message}`);
        } finally {
            setIsLoading(false);
        }
    }
  };

  return (
    <div className="flex flex-col h-screen font-sans text-slate-800 dark:text-slate-200">
      <header className="flex-shrink-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4 flex items-center justify-between shadow-sm">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Notes XYZ</h1>
        <div className="flex items-center gap-2">
            <button onClick={() => fileUploadRef.current?.click()} className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-slate-400" disabled={isLoading || !db}>Upload ENEX</button>
            <SettingsMenu
                onImportClick={() => dbImportRef.current?.click()}
                onExportClick={handleExportDb}
                onClearClick={handleDeleteDb}
                isImportDisabled={isLoading || !db}
                isExportDisabled={isLoading || !db || notes.length === 0}
                isClearDisabled={isLoading || !db || notes.length === 0}
            />
            <input type="file" accept=".enex" ref={fileUploadRef} onChange={handleFileChange} className="hidden" />
            <input type="file" accept=".sqlite,.db" ref={dbImportRef} onChange={handleImportDbChange} className="hidden" />
        </div>
      </header>
      
      <main className="flex-grow flex flex-col md:flex-row overflow-hidden">
        <aside className="w-full md:w-1/3 lg:w-1/4 flex flex-col border-r border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
          <SearchBar onSearch={handleSearch} disabled={isLoading || !db} />
          <div className="flex-grow overflow-y-auto">
            <NoteList notes={notes} onSelectNote={handleSelectNote} selectedNoteId={selectedNote?.id || null} onTagClick={handleTagClick} />
          </div>
        </aside>

        <section className="w-full md:w-2/3 lg:w-3/4 flex-grow overflow-y-auto p-4 md:p-6 bg-white dark:bg-slate-900">
          <NoteDetail note={selectedNote} onTagClick={handleTagClick} />
        </section>
      </main>
      
      <Modal
        isOpen={modal.isOpen}
        onClose={() => setModal({ isOpen: false, title: '', message: '' })}
        title={modal.title}
      >
        <p>{modal.message}</p>
      </Modal>

      <StatusBar status={status} isLoading={isLoading} />
    </div>
  );
};

export default App;