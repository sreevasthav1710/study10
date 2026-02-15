export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      assignment_completions: {
        Row: {
          assignment_id: string
          completed: boolean
          completed_at: string | null
          id: string
          student_id: string
        }
        Insert: {
          assignment_id: string
          completed?: boolean
          completed_at?: string | null
          id?: string
          student_id: string
        }
        Update: {
          assignment_id?: string
          completed?: boolean
          completed_at?: string | null
          id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignment_completions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      assignments: {
        Row: {
          chapter_node_id: string
          created_at: string
          created_by: string
          due_date: string | null
          id: string
          link: string
          title: string
        }
        Insert: {
          chapter_node_id: string
          created_at?: string
          created_by: string
          due_date?: string | null
          id?: string
          link: string
          title: string
        }
        Update: {
          chapter_node_id?: string
          created_at?: string
          created_by?: string
          due_date?: string | null
          id?: string
          link?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignments_chapter_node_id_fkey"
            columns: ["chapter_node_id"]
            isOneToOne: false
            referencedRelation: "study_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      doubt_replies: {
        Row: {
          created_at: string
          doubt_id: string
          id: string
          message: string
          user_id: string
        }
        Insert: {
          created_at?: string
          doubt_id: string
          id?: string
          message: string
          user_id: string
        }
        Update: {
          created_at?: string
          doubt_id?: string
          id?: string
          message?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "doubt_replies_doubt_id_fkey"
            columns: ["doubt_id"]
            isOneToOne: false
            referencedRelation: "doubts"
            referencedColumns: ["id"]
          },
        ]
      }
      doubts: {
        Row: {
          chapter_node_id: string
          created_at: string
          id: string
          message: string
          status: Database["public"]["Enums"]["doubt_status"]
          student_id: string
        }
        Insert: {
          chapter_node_id: string
          created_at?: string
          id?: string
          message?: string
          status?: Database["public"]["Enums"]["doubt_status"]
          student_id: string
        }
        Update: {
          chapter_node_id?: string
          created_at?: string
          id?: string
          message?: string
          status?: Database["public"]["Enums"]["doubt_status"]
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "doubts_chapter_node_id_fkey"
            columns: ["chapter_node_id"]
            isOneToOne: false
            referencedRelation: "study_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      node_progress: {
        Row: {
          completed: boolean
          completed_at: string | null
          id: string
          node_id: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          id?: string
          node_id: string
          user_id: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          id?: string
          node_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "node_progress_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "study_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          user_id: string
          username: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_id: string
          username: string
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      resources: {
        Row: {
          chapter_node_id: string
          created_at: string
          created_by: string
          id: string
          name: string
          resource_type: string
          sort_order: number | null
          url: string
        }
        Insert: {
          chapter_node_id: string
          created_at?: string
          created_by: string
          id?: string
          name: string
          resource_type: string
          sort_order?: number | null
          url: string
        }
        Update: {
          chapter_node_id?: string
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          resource_type?: string
          sort_order?: number | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "resources_chapter_node_id_fkey"
            columns: ["chapter_node_id"]
            isOneToOne: false
            referencedRelation: "study_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      study_nodes: {
        Row: {
          created_at: string
          id: string
          name: string
          node_level: number
          parent_id: string | null
          sort_order: number | null
          subject_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          node_level?: number
          parent_id?: string | null
          sort_order?: number | null
          subject_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          node_level?: number
          parent_id?: string | null
          sort_order?: number | null
          subject_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_nodes_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "study_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_nodes_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          color: string | null
          created_at: string
          created_by: string
          icon: string | null
          id: string
          name: string
          sort_order: number | null
        }
        Insert: {
          color?: string | null
          created_at?: string
          created_by: string
          icon?: string | null
          id?: string
          name: string
          sort_order?: number | null
        }
        Update: {
          color?: string | null
          created_at?: string
          created_by?: string
          icon?: string | null
          id?: string
          name?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      test_questions: {
        Row: {
          correct_option: string
          id: string
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          question_text: string
          sort_order: number | null
          test_id: string
        }
        Insert: {
          correct_option: string
          id?: string
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          question_text: string
          sort_order?: number | null
          test_id: string
        }
        Update: {
          correct_option?: string
          id?: string
          option_a?: string
          option_b?: string
          option_c?: string
          option_d?: string
          question_text?: string
          sort_order?: number | null
          test_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_questions_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
        ]
      }
      test_submissions: {
        Row: {
          answers: Json
          id: string
          score: number | null
          started_at: string
          student_id: string
          submitted_at: string | null
          test_id: string
          total: number | null
        }
        Insert: {
          answers?: Json
          id?: string
          score?: number | null
          started_at?: string
          student_id: string
          submitted_at?: string | null
          test_id: string
          total?: number | null
        }
        Update: {
          answers?: Json
          id?: string
          score?: number | null
          started_at?: string
          student_id?: string
          submitted_at?: string | null
          test_id?: string
          total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "test_submissions_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
        ]
      }
      tests: {
        Row: {
          chapter_node_id: string
          created_at: string
          created_by: string
          deadline: string | null
          id: string
          timer_minutes: number
          title: string
        }
        Insert: {
          chapter_node_id: string
          created_at?: string
          created_by: string
          deadline?: string | null
          id?: string
          timer_minutes?: number
          title: string
        }
        Update: {
          chapter_node_id?: string
          created_at?: string
          created_by?: string
          deadline?: string | null
          id?: string
          timer_minutes?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "tests_chapter_node_id_fkey"
            columns: ["chapter_node_id"]
            isOneToOne: false
            referencedRelation: "study_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "student"
      doubt_status: "pending" | "replied" | "resolved"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "student"],
      doubt_status: ["pending", "replied", "resolved"],
    },
  },
} as const
