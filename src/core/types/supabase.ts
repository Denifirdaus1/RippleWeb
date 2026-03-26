export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      todos: {
        Row: {
          category: string | null
          completed_at: string | null
          created_at: string
          description: string | null
          end_time: string | null
          focus_duration_minutes: number | null
          focus_enabled: boolean
          icon_path: string | null
          id: string
          is_completed: boolean
          is_pomodoro_custom: boolean | null
          is_scheduled: boolean
          milestone_id: string | null
          notification_sent: boolean
          parent_todo_id: string | null
          pomodoro_long_break_minutes: number | null
          pomodoro_sessions_count: number | null
          pomodoro_short_break_minutes: number | null
          priority: string
          recurrence_rule: Json | null
          reminder_minutes: number | null
          scheduled_date: string | null
          start_time: string | null
          title: string
          updated_at: string
          user_id: string
          web_link: string | null
        }
        Insert: {
          category?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          end_time?: string | null
          focus_duration_minutes?: number | null
          focus_enabled?: boolean
          icon_path?: string | null
          id?: string
          is_completed?: boolean
          is_pomodoro_custom?: boolean | null
          is_scheduled?: boolean
          milestone_id?: string | null
          notification_sent?: boolean
          parent_todo_id?: string | null
          pomodoro_long_break_minutes?: number | null
          pomodoro_sessions_count?: number | null
          pomodoro_short_break_minutes?: number | null
          priority?: string
          recurrence_rule?: Json | null
          reminder_minutes?: number | null
          scheduled_date?: string | null
          start_time?: string | null
          title: string
          updated_at?: string
          user_id: string
          web_link?: string | null
        }
        Update: {
          category?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          end_time?: string | null
          focus_duration_minutes?: number | null
          focus_enabled?: boolean
          icon_path?: string | null
          id?: string
          is_completed?: boolean
          is_pomodoro_custom?: boolean | null
          is_scheduled?: boolean
          milestone_id?: string | null
          notification_sent?: boolean
          parent_todo_id?: string | null
          pomodoro_long_break_minutes?: number | null
          pomodoro_sessions_count?: number | null
          pomodoro_short_break_minutes?: number | null
          priority?: string
          recurrence_rule?: Json | null
          reminder_minutes?: number | null
          scheduled_date?: string | null
          start_time?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          web_link?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "todos_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "milestones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "todos_parent_todo_id_fkey"
            columns: ["parent_todo_id"]
            isOneToOne: false
            referencedRelation: "todos"
            referencedColumns: ["id"]
          },
        ]
      }
      // ... (tables lain dihilangkan untuk efisiensi, namun struktur utama sudah ada)
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
