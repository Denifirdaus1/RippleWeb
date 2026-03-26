# Deep Research: Ripple Android Notes Feature Analysis

This report provides a detailed breakdown of the Notes feature from the Ripple Android codebase (`C:\Project\ripple`). This analysis is intended to serve as a reference for implementing or aligning the feature in the Ripple Web project.

## 1. Core Data Structure (`Note` Entity)

The `Note` entity is designed for flexibility, using a "Sandbox" property model where users can enable or disable specific metadata fields.

- **Storage Format**: Uses **Quill Delta (JSON)** for rich text content, enabling complex formatting, embeds, and cross-platform compatibility.
- **Base Fields**:
  - `id`, `userId`: Unique identifiers.
  - `title`: Note title (defaults to "Untitled").
  - `content`: `Map<String, dynamic>` (Delta JSON).
  - `isFavorite`: Boolean flag for pinning notes.
  - `createdAt`, `updatedAt`: Timestamps for synchronization and sorting.
- **Dynamic Properties (Sandbox)**:
  - `enabledProperties`: A list of strings (e.g., `['date', 'tags', 'priority']`) that defines which fields are active for a specific note.
  - `noteDate`: Optional `DateTime` for deadline or reference.
  - `tags`: `List<String>` for categorization.
  - `priority`: Enum (`low`, `medium`, `high`).
  - `status`: Enum (`notStarted`, `inProgress`, `done`).
  - `description`: Plain text summary/snippet.

## 2. Presentation Layer & Pages

### 2.1. `NotesPage` (Main List)
- **Organization**: Displays **Folders** first, followed by **Notes**.
- **Filtering**: Notes already assigned to folders are hidden from the main list.
- **Sorting**: Prioritizes `isFavorite` (true first), then sorts by `createdAt` (newest first).
- **UI Components**:
  - `RipplePageHeader`: Standard header with an "Add Folder" action.
  - `NoteCard`: A custom card showing the title, description snippet, time ago, and icons for active properties (priority/status/tags).

### 2.2. `NoteEditorPage` (Rich Text Editor)
- **Editor Engine**: Powered by `flutter_quill`.
- **State Management**: `NoteEditorCubit` handles real-time updates and business logic.
- **Key Functionalities**:
  - **Auto-Save**: Debounced at 500ms for seamless persistence.
  - **Shared Links**: Automatically detects and creates "Shared Link" embeds when a URL is shared to the app.
  - **Voice-to-Text**: Integrated dictation using `speech_to_text`.
  - **AI Integration**: Connected to `RippleAiRepository` with thread tracking for AI-assisted writing/summarization.
  - **Property Management**: A `NotePropertiesSection` at the top allows users to manage metadata fields dynamically.

## 3. Specialized Widgets

### 3.1. `NoteKeyboardToolbar`
A custom, scrollable toolbar that appears above the system keyboard:
- **AI Magic Button**: Triggers AI processing.
- **Formatting Toggle**: Swaps the keyboard with a specialized formatting panel (`formatting_keyboard_panel.dart`).
- **Media Tools**: Camera/Image upload and Voice/Mic buttons.
- **Contextual Tools**: Mentions (`@`) and Checklist toggles.

### 3.2. `NoteCard`
- **Dynamic Styling**: The card's border color and header text color change based on the note's **Priority**:
  - High: Orange/Amber
  - Medium: Blue
  - Low: Green
- **Metadata Visualization**: Displays small bubble icons for Status and Priority at the bottom right.

### 3.3. `NotePropertiesSection`
- **Sandbox UI**: Only renders fields that are in the `enabledProperties` list.
- **Add Property**: A button at the bottom of the section opens a sheet to enable new fields (Date, Tags, Priority, Status, Description).

## 4. Integration & Logic

- **Embed Builders**:
  - `CustomImageEmbedBuilder`: Handles rich text images.
  - `TodoEmbedBuilder`: Allows linking/embedding `Todo` items within notes.
  - `SharedLinkEmbedBuilder`: Provides a rich preview for URLs.
- **Mention System**: Uses a specialized search to find and link `Todo` items when `@` is typed or the mention button is pressed.
- **Auto-Filling**: New notes automatically default to today's date and enable the 'date' property.

## 5. Implementation Recommendations for Web

1. **Rich Text Library**: Use a web-compatible Quill implementation (e.g., `react-quill` or `quill.js` directly) to ensure Delta JSON compatibility.
2. **Sandbox Pattern**: Implement the property section as a dynamic list of components based on a configuration array.
3. **Theming**: Align the priority color scheme (Orange/Blue/Green) with the web's design system.
4. **Auto-save Strategy**: Maintain the 500ms debounce pattern for a consistent "live" feel.
