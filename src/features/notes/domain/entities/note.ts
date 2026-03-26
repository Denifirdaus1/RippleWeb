export enum NotePriority {
  low = 'low',
  medium = 'medium',
  high = 'high'
}

export enum NoteWorkStatus {
  notStarted = 'notStarted',
  inProgress = 'inProgress',
  done = 'done'
}

export interface Note {
  id: string;
  userId: string;
  title: string;
  content: Record<string, any>; // Delta JSON
  milestoneId?: string;
  noteDate?: string;          // YYYY-MM-DD
  tags: string[];
  priority?: NotePriority;
  status?: NoteWorkStatus;
  description?: string;
  isFavorite: boolean;
  enabledProperties: string[]; // Default ['date']
  createdAt: string;
  updatedAt: string;
}

