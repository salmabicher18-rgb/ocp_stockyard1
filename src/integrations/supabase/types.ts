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
      action_history: {
        Row: {
          action: string
          created_at: string
          details: string | null
          element: string
          id: number
          user_id: string | null
          user_name: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: string | null
          element: string
          id?: number
          user_id?: string | null
          user_name: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: string | null
          element?: string
          id?: number
          user_id?: string | null
          user_name?: string
        }
        Relationships: []
      }
      Couches: {
        Row: {
          BPL: number | null
          Cd: number | null
          CO2: number | null
          date: string | null
          H2O: number | null
          id: number
          MgO: number | null
          SiO2: number | null
          source: string | null
          tas_brut_id: number | null
          tas_lave_id: number | null
          tonnage: number | null
          type: string | null
        }
        Insert: {
          BPL?: number | null
          Cd?: number | null
          CO2?: number | null
          date?: string | null
          H2O?: number | null
          id?: never
          MgO?: number | null
          SiO2?: number | null
          source?: string | null
          tas_brut_id?: number | null
          tas_lave_id?: number | null
          tonnage?: number | null
          type?: string | null
        }
        Update: {
          BPL?: number | null
          Cd?: number | null
          CO2?: number | null
          date?: string | null
          H2O?: number | null
          id?: never
          MgO?: number | null
          SiO2?: number | null
          source?: string | null
          tas_brut_id?: number | null
          tas_lave_id?: number | null
          tonnage?: number | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "Couches_tas_brut_id_fkey"
            columns: ["tas_brut_id"]
            isOneToOne: false
            referencedRelation: "TasBrut"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Couches_tas_lave_id_fkey"
            columns: ["tas_lave_id"]
            isOneToOne: false
            referencedRelation: "TasLave"
            referencedColumns: ["id"]
          },
        ]
      }
      Fractions: {
        Row: {
          BPL: number | null
          Cd: number | null
          CO2: number | null
          couche_id: number
          id: number
          MgO: number | null
          poids: number | null
          SiO2: number | null
          tamis: string
        }
        Insert: {
          BPL?: number | null
          Cd?: number | null
          CO2?: number | null
          couche_id: number
          id?: never
          MgO?: number | null
          poids?: number | null
          SiO2?: number | null
          tamis: string
        }
        Update: {
          BPL?: number | null
          Cd?: number | null
          CO2?: number | null
          couche_id?: number
          id?: never
          MgO?: number | null
          poids?: number | null
          SiO2?: number | null
          tamis?: string
        }
        Relationships: [
          {
            foreignKeyName: "Fractions_couche_id_fkey"
            columns: ["couche_id"]
            isOneToOne: false
            referencedRelation: "Couches"
            referencedColumns: ["id"]
          },
        ]
      }
      ImportHistory: {
        Row: {
          created_at: string
          errors: string[] | null
          file_name: string
          id: number
          layer_count: number | null
          machine_count: number | null
          raw_count: number | null
          washed_count: number | null
        }
        Insert: {
          created_at?: string
          errors?: string[] | null
          file_name: string
          id?: never
          layer_count?: number | null
          machine_count?: number | null
          raw_count?: number | null
          washed_count?: number | null
        }
        Update: {
          created_at?: string
          errors?: string[] | null
          file_name?: string
          id?: never
          layer_count?: number | null
          machine_count?: number | null
          raw_count?: number | null
          washed_count?: number | null
        }
        Relationships: []
      }
      Machines: {
        Row: {
          date_ajout: string | null
          id: number
          ligne: string | null
          nom_machine: string
          position_m: number | null
          statut: string | null
          tas_associe: string | null
          type: string | null
        }
        Insert: {
          date_ajout?: string | null
          id?: never
          ligne?: string | null
          nom_machine: string
          position_m?: number | null
          statut?: string | null
          tas_associe?: string | null
          type?: string | null
        }
        Update: {
          date_ajout?: string | null
          id?: never
          ligne?: string | null
          nom_machine?: string
          position_m?: number | null
          statut?: string | null
          tas_associe?: string | null
          type?: string | null
        }
        Relationships: []
      }
      MatricesCible: {
        Row: {
          BPL_max: number | null
          BPL_min: number | null
          Cd_max: number | null
          Cd_min: number | null
          CO2_max: number | null
          CO2_min: number | null
          date_creation: string | null
          id: number
          MgO_max: number | null
          MgO_min: number | null
          nom_matrice: string
          SiO2_max: number | null
          SiO2_min: number | null
          type: string | null
        }
        Insert: {
          BPL_max?: number | null
          BPL_min?: number | null
          Cd_max?: number | null
          Cd_min?: number | null
          CO2_max?: number | null
          CO2_min?: number | null
          date_creation?: string | null
          id?: never
          MgO_max?: number | null
          MgO_min?: number | null
          nom_matrice: string
          SiO2_max?: number | null
          SiO2_min?: number | null
          type?: string | null
        }
        Update: {
          BPL_max?: number | null
          BPL_min?: number | null
          Cd_max?: number | null
          Cd_min?: number | null
          CO2_max?: number | null
          CO2_min?: number | null
          date_creation?: string | null
          id?: never
          MgO_max?: number | null
          MgO_min?: number | null
          nom_matrice?: string
          SiO2_max?: number | null
          SiO2_min?: number | null
          type?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          is_active: boolean
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name: string
          id: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Relationships: []
      }
      TasBrut: {
        Row: {
          conformite: string | null
          date_creation: string | null
          debut_m: number | null
          fin_m: number | null
          id: number
          in_stockyard: boolean
          mode_stockage: string | null
          nom_tas: string
          statut: string | null
          tonnage_thc: number | null
        }
        Insert: {
          conformite?: string | null
          date_creation?: string | null
          debut_m?: number | null
          fin_m?: number | null
          id?: never
          in_stockyard?: boolean
          mode_stockage?: string | null
          nom_tas: string
          statut?: string | null
          tonnage_thc?: number | null
        }
        Update: {
          conformite?: string | null
          date_creation?: string | null
          debut_m?: number | null
          fin_m?: number | null
          id?: never
          in_stockyard?: boolean
          mode_stockage?: string | null
          nom_tas?: string
          statut?: string | null
          tonnage_thc?: number | null
        }
        Relationships: []
      }
      TasLave: {
        Row: {
          conformite: string | null
          date_creation: string | null
          debut_m: number | null
          fin_m: number | null
          id: number
          in_stockyard: boolean
          nom_tas: string
          source_id: number | null
          source_name: string | null
          statut: string | null
          tonnage_tsm: number | null
        }
        Insert: {
          conformite?: string | null
          date_creation?: string | null
          debut_m?: number | null
          fin_m?: number | null
          id?: never
          in_stockyard?: boolean
          nom_tas: string
          source_id?: number | null
          source_name?: string | null
          statut?: string | null
          tonnage_tsm?: number | null
        }
        Update: {
          conformite?: string | null
          date_creation?: string | null
          debut_m?: number | null
          fin_m?: number | null
          id?: never
          in_stockyard?: boolean
          nom_tas?: string
          source_id?: number | null
          source_name?: string | null
          statut?: string | null
          tonnage_tsm?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "TasLave_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "TasBrut"
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
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "manager" | "operateur" | "auditeur"
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
      app_role: ["manager", "operateur", "auditeur"],
    },
  },
} as const
