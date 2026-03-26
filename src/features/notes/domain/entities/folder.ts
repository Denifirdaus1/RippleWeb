export interface Folder {
  id: string;
  userId: string;
  name: string;
  parentFolderId?: string;
  colorHex?: string;
  iconPath?: string;
  color?: string;
  icon?: string;
  orderIndex?: number;
  isSystem?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FolderNote {
  folderId: string;
  noteId: string;
}
