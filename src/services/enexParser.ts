
import { NoteWithTags } from '../types';

export const parseEnex = (xmlContent: string): Omit<NoteWithTags, 'id'>[] => {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlContent, 'application/xml');
  const noteElements = Array.from(xmlDoc.getElementsByTagName('note'));

  const notes: Omit<NoteWithTags, 'id'>[] = noteElements.map(noteElement => {
    const title = noteElement.querySelector('title')?.textContent || 'Untitled';
    const content = noteElement.querySelector('content')?.textContent || '';
    const author = noteElement.querySelector('author')?.textContent || 'Unknown';
    const createdAt = noteElement.querySelector('created')?.textContent || new Date().toISOString();
    const updatedAt = noteElement.querySelector('updated')?.textContent || new Date().toISOString();
    
    const tagElements = Array.from(noteElement.getElementsByTagName('tag'));
    const tags = tagElements.map(tag => tag.textContent || '').filter(Boolean);

    return {
      title,
      content,
      author,
      createdAt,
      updatedAt,
      tags,
    };
  });

  return notes;
};
