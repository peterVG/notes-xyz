import { NoteWithTags } from '../types';

/**
 * Converts Evernote's date format (YYYYMMDDTHHMMSSZ) to a standard ISO 8601 string.
 * @param dateString The date string from the ENEX file.
 * @returns A valid ISO 8601 date string.
 */
const formatEvernoteDate = (dateString: string | null | undefined): string => {
  if (!dateString || dateString.length < 16) {
    return new Date().toISOString(); // Fallback for invalid or missing dates
  }
  try {
    const year = dateString.substring(0, 4);
    const month = dateString.substring(4, 6);
    const day = dateString.substring(6, 8);
    const hour = dateString.substring(9, 11);
    const minute = dateString.substring(11, 13);
    const second = dateString.substring(13, 15);
  
    // Convert to standard ISO 8601 format: YYYY-MM-DDTHH:MM:SSZ
    const isoString = `${year}-${month}-${day}T${hour}:${minute}:${second}Z`;

    // Final check to ensure it's a valid date before returning
    if (isNaN(new Date(isoString).getTime())) {
        console.warn(`Could not form a valid date from: ${dateString}`);
        return new Date().toISOString();
    }
    return isoString;
  } catch (e) {
    console.error(`Error parsing date string: ${dateString}`, e);
    return new Date().toISOString();
  }
};

export const parseEnex = (xmlContent: string): Omit<NoteWithTags, 'id'>[] => {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlContent, 'application/xml');
  const noteElements = Array.from(xmlDoc.getElementsByTagName('note'));

  const notes: Omit<NoteWithTags, 'id'>[] = noteElements.map(noteElement => {
    const title = noteElement.querySelector('title')?.textContent || 'Untitled';
    const content = noteElement.querySelector('content')?.textContent || '';
    const author = noteElement.querySelector('author')?.textContent || 'Unknown';
    const createdAt = formatEvernoteDate(noteElement.querySelector('created')?.textContent);
    const updatedAt = formatEvernoteDate(noteElement.querySelector('updated')?.textContent);
    
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
