
export interface Note {
  id: number;
  title: string;
  content: string;
  author: string;
  createdAt: string;
  updatedAt: string;
}

export interface NoteWithTags extends Note {
  tags: string[];
}
