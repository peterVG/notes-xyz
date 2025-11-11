
import { NoteWithTags } from '../types';

// This is a global because of how the sql.js CDN script works.
declare const initSqlJs: (config: { locateFile: (file: string) => string }) => Promise<any>;

export type Database = any;
export type SearchBy = 'title' | 'author' | 'tag' | 'content';

// --- IndexedDB Persistence has been removed as per user request for file-based storage ---

// --- Database Initialization ---
const createNewDb = (SQL: any): Database => {
  const db = new SQL.Database();
  const schema = `
    CREATE TABLE uploaded_files (
      hash TEXT PRIMARY KEY,
      filename TEXT,
      uploaded_at DATETIME
    );
    CREATE TABLE notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      content TEXT,
      author TEXT,
      created_at DATETIME,
      updated_at DATETIME
    );
    CREATE TABLE tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE
    );
    CREATE TABLE note_tags (
      note_id INTEGER,
      tag_id INTEGER,
      PRIMARY KEY (note_id, tag_id),
      FOREIGN KEY(note_id) REFERENCES notes(id) ON DELETE CASCADE,
      FOREIGN KEY(tag_id) REFERENCES tags(id) ON DELETE CASCADE
    );
  `;
  db.run(schema);
  return db;
};

export const initDb = async (): Promise<Database> => {
  const SQL = await initSqlJs({
    locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/${file}`
  });
  return createNewDb(SQL);
};

export const loadDbFromBuffer = async (buffer: ArrayBuffer): Promise<Database> => {
  const SQL = await initSqlJs({
    locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/${file}`
  });
  return new SQL.Database(new Uint8Array(buffer));
};

export const createFreshDb = async (): Promise<Database> => {
    // This function now just creates a new, empty DB in memory.
    return initDb();
}

// --- Database Operations ---
export const isFileUploaded = (db: Database, hash: string): boolean => {
  const stmt = db.prepare("SELECT 1 FROM uploaded_files WHERE hash = :hash");
  stmt.bind({ ':hash': hash });
  const result = stmt.step();
  stmt.free();
  return result;
};

export const addUploadedFile = (db: Database, hash: string, filename: string): void => {
  db.run("INSERT INTO uploaded_files VALUES (?, ?, ?)", [hash, filename, new Date().toISOString()]);
};

export const insertNotes = (db: Database, notes: Omit<NoteWithTags, 'id'>[]): number => {
  let count = 0;
  const insertNoteStmt = db.prepare("INSERT INTO notes (title, content, author, created_at, updated_at) VALUES (?, ?, ?, ?, ?)");
  const insertTagStmt = db.prepare("INSERT OR IGNORE INTO tags (name) VALUES (?)");
  const getTagIdStmt = db.prepare("SELECT id FROM tags WHERE name = ?");
  const insertNoteTagStmt = db.prepare("INSERT INTO note_tags (note_id, tag_id) VALUES (?, ?)");

  for (const note of notes) {
    insertNoteStmt.run([note.title, note.content, note.author, note.createdAt, note.updatedAt]);
    const noteIdRes = db.exec("SELECT last_insert_rowid()");
    const noteId = noteIdRes[0].values[0][0] as number;
    
    for (const tagName of note.tags) {
      insertTagStmt.run([tagName]);
      getTagIdStmt.bind([tagName]);
      if (getTagIdStmt.step()) {
        const tagId = getTagIdStmt.get()[0] as number;
        insertNoteTagStmt.run([noteId, tagId]);
      }
      getTagIdStmt.reset();
    }
    count++;
  }

  insertNoteStmt.free();
  insertTagStmt.free();
  getTagIdStmt.free();
  insertNoteTagStmt.free();
  return count;
};

const mapResultsToNotes = (results: any[]): NoteWithTags[] => {
  if (!results || results.length === 0) return [];
  const { columns, values } = results[0];
  return values.map(row => {
    const note: any = {};
    columns.forEach((col, i) => {
      note[col] = row[i];
    });
    return {
      id: note.id,
      title: note.title,
      content: note.content,
      author: note.author,
      createdAt: note.created_at,
      updatedAt: note.updated_at,
      tags: note.tags ? (note.tags as string).split(',') : [],
    };
  });
};

export const searchNotes = (db: Database, query: string, by: SearchBy): NoteWithTags[] => {
  const baseQuery = `
    SELECT
      n.id, n.title, n.content, n.author, n.created_at, n.updated_at,
      (SELECT GROUP_CONCAT(t.name) FROM tags t JOIN note_tags nt ON t.id = nt.tag_id WHERE nt.note_id = n.id) as tags
    FROM notes n
  `;
  const likeQuery = `%${query}%`;
  let results;

  if (by === 'tag') {
    const stmt = db.prepare(`
      ${baseQuery}
      WHERE n.id IN (
        SELECT nt.note_id FROM note_tags nt JOIN tags t ON nt.tag_id = t.id WHERE t.name LIKE :query
      ) ORDER BY n.updated_at DESC
    `);
    stmt.bind({ ':query': likeQuery });
    const tagResults = [];
    while (stmt.step()) {
        tagResults.push(stmt.getAsObject());
    }
    stmt.free();
     return tagResults.map((row: any) => ({
      id: row.id,
      title: row.title,
      content: row.content,
      author: row.author,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      tags: (row.tags as string | null)?.split(',').filter(Boolean) || [],
    }));

  } else {
    const sql = `${baseQuery} WHERE n.${by} LIKE :query ORDER BY n.updated_at DESC`;
    results = db.exec(sql, { ':query': likeQuery });
  }

  return mapResultsToNotes(results);
};


export const getAllNotes = (db: Database): NoteWithTags[] => {
    const sql = `
        SELECT
          n.id, n.title, n.content, n.author, n.created_at, n.updated_at,
          (SELECT GROUP_CONCAT(t.name) FROM tags t JOIN note_tags nt ON t.id = nt.tag_id WHERE nt.note_id = n.id) as tags
        FROM notes n
        ORDER BY n.updated_at DESC
    `;
    const results = db.exec(sql);
    return mapResultsToNotes(results);
};

export const getNoteById = (db: Database, id: number): NoteWithTags | null => {
    const sql = `
        SELECT
          n.*,
          (SELECT GROUP_CONCAT(t.name) FROM tags t JOIN note_tags nt ON t.id = nt.tag_id WHERE nt.note_id = n.id) as tags
        FROM notes n
        WHERE n.id = :id
    `;
    const results = db.exec(sql, { ':id': id });
    const mapped = mapResultsToNotes(results);
    return mapped.length > 0 ? mapped[0] : null;
};
