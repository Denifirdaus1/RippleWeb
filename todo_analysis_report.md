# Todo Feature Analysis Report (Ripple Project)

This report provides a detailed analysis of the **Todo** feature in the Ripple project, intended to guide the development of its web version in **RippleWeb**.

---

## 1. Feature Overview
The Todo feature is a comprehensive task management system with support for:
- **Task CRUD**: Creating, reading, updating, and deleting tasks.
- **Scheduling**: Setting dates, start times, and end times.
- **Prioritization**: High, Medium, and Low levels.
- **Subtasks**: Hierarchical task management.
- **Recurrence**: Support for recurring tasks (daily, weekly, etc.) with automatic "rolling" forward upon completion.
- **Focus Mode**: Integration with Pomodoro/Focus sessions.
- **Real-time Sync**: Uses Supabase for real-time data synchronization.

---

## 2. Architecture Analysis
The project follows **Clean Architecture** principles, ensuring a clear separation of concerns:

### **Domain Layer (Platform Independent)**
- **Entities**: 
  - `Todo`: The core business object containing all task data.
  - `RecurrenceRule`: Logic for recurring task patterns.
- **Repositories (Interfaces)**: Defines the contract for data operations.
- **Usecases**: Specific business logic (e.g., `SaveTodo`, `DeleteTodo`).

### **Data Layer (Supabase Integration)**
- **Models**: `TodoModel` and `RecurrenceRuleModel` handle JSON serialization and timezone-safe date parsing.
- **Repositories (Implementation)**: `TodoRepositoryImpl` uses `supabase_flutter` for persistence and real-time streams.

### **Presentation Layer (BLoC State Management)**
- **BLoC**: `TodosOverviewBloc` manages the UI state, including:
  - Optimistic updates for a snappy feel.
  - Filtering logic (All, Active, Completed).
  - View mode switching (List vs. Schedule).
- **Widgets**: A library of reusable UI components (`TodoItem`, `PriorityTodoCard`, etc.).

---

## 3. Data Structure (Core Entity)
The `Todo` entity includes the following key fields:
- `id`, `userId`, `title`, `description`
- `priority`: Enum (high, medium, low)
- `isCompleted`, `completedAt`
- `isScheduled`, `scheduledDate`, `startTime`, `endTime`
- `recurrenceRule`: Map containing recurrence logic.
- `parentTodoId`: For subtasks.
- `focusDurationMinutes`, `pomodoroSessionsCount`, etc.
- `iconPath`, `category`, `webLink`.

---

## 4. Web Porting Strategy & Recommendations

### **Architecture Reuse**
- **Recommendation**: Reuse the `domain` and `data` layers without modification. Flutter's Supabase client and Clean Architecture layers are 100% compatible with Web.

### **UI/UX Adjustments**
1. **Responsive Layout**:
   - **Current**: Mobile-first vertical stack.
   - **Web**: Use a **Master-Detail** pattern. On wide screens, display the list on the left and task details/editor on the right side.
2. **Navigation**:
   - Use `GoRouter`'s deep linking capabilities to allow users to share links to specific tasks or filtered views.
3. **Input Modals**:
   - **Mobile**: Uses `AddTaskBottomSheet`.
   - **Web**: Replace with a **Side Drawer** or a **Centered Dialog** for better use of horizontal space.
4. **Interactive Elements**:
   - Add **Hover effects** to `TodoItem` and buttons.
   - Implement **Keyboard shortcuts** (e.g., `N` for new task, `Enter` to save).
   - Support **Right-click (Context Menu)** for quick actions like delete or move.
5. **Rich Text Editing**:
   - `flutter_quill` is used for descriptions. Ensure the web implementation handles large text blocks and browser-specific pasting behavior.

---

## 5. Technical Considerations
- **Timezones**: Web users might be in different timezones. Continue using `DateTime.toLocal()` and `toUtc()` as implemented in `TodoModel`.
- **Assets**: Ensure all custom icons (`assets/icons/Todo/`) are correctly declared in the web project's `pubspec.yaml`.
- **Performance**: Use `ListView.builder` for long lists to maintain 60fps scrolling in the browser.

---
*Analysis completed on: March 16, 2026*
