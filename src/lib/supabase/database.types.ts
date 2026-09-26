
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "public": {
          Tables: {
            "categorias": {
                  Row: {
                    "activa": boolean,"color": string,"creado_en": string,"id": number,"nombre": string,"owner_id": string,"precio_referencia": number | null
                  }
                  Insert: {
                    "activa"?: boolean,"color": string,"creado_en"?: string,"id"?: never,"nombre": string,"owner_id"?: string,"precio_referencia"?: number | null
                  }
                  Update: {
                    "activa"?: boolean,"color"?: string,"creado_en"?: string,"id"?: never,"nombre"?: string,"owner_id"?: string,"precio_referencia"?: number | null
                  }
                  Relationships: [
                    
                  ]
                },"clientes": {
                  Row: {
                    "creado_en": string,"id": number,"nombre": string,"notas": string | null,"owner_id": string,"telefono": string | null
                  }
                  Insert: {
                    "creado_en"?: string,"id"?: never,"nombre": string,"notas"?: string | null,"owner_id"?: string,"telefono"?: string | null
                  }
                  Update: {
                    "creado_en"?: string,"id"?: never,"nombre"?: string,"notas"?: string | null,"owner_id"?: string,"telefono"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"combo_categorias": {
                  Row: {
                    "categoria_id": number,"combo_id": number,"owner_id": string
                  }
                  Insert: {
                    "categoria_id": number,"combo_id": number,"owner_id"?: string
                  }
                  Update: {
                    "categoria_id"?: number,"combo_id"?: number,"owner_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "combo_categorias_categoria_id_fkey"
      columns: ["categoria_id"]
isOneToOne: false
      referencedRelation: "categorias"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "combo_categorias_combo_id_fkey"
      columns: ["combo_id"]
isOneToOne: false
      referencedRelation: "combos"
      referencedColumns: ["id"]
    }
                  ]
                },"combos": {
                  Row: {
                    "activo": boolean,"creado_en": string,"id": number,"nombre": string,"owner_id": string,"precio_referencia": number
                  }
                  Insert: {
                    "activo"?: boolean,"creado_en"?: string,"id"?: never,"nombre": string,"owner_id"?: string,"precio_referencia": number
                  }
                  Update: {
                    "activo"?: boolean,"creado_en"?: string,"id"?: never,"nombre"?: string,"owner_id"?: string,"precio_referencia"?: number
                  }
                  Relationships: [
                    
                  ]
                },"turno_item_categorias": {
                  Row: {
                    "categoria_id": number,"item_id": number,"owner_id": string
                  }
                  Insert: {
                    "categoria_id": number,"item_id": number,"owner_id"?: string
                  }
                  Update: {
                    "categoria_id"?: number,"item_id"?: number,"owner_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "turno_item_categorias_categoria_id_fkey"
      columns: ["categoria_id"]
isOneToOne: false
      referencedRelation: "categorias"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "turno_item_categorias_item_id_fkey"
      columns: ["item_id"]
isOneToOne: false
      referencedRelation: "turno_items"
      referencedColumns: ["id"]
    }
                  ]
                },"turno_items": {
                  Row: {
                    "categoria_id": number | null,"combo_id": number | null,"id": number,"nota_ajuste": string | null,"owner_id": string,"precio_cobrado": number,"tipo": string,"turno_id": number
                  }
                  Insert: {
                    "categoria_id"?: number | null,"combo_id"?: number | null,"id"?: never,"nota_ajuste"?: string | null,"owner_id"?: string,"precio_cobrado": number,"tipo": string,"turno_id": number
                  }
                  Update: {
                    "categoria_id"?: number | null,"combo_id"?: number | null,"id"?: never,"nota_ajuste"?: string | null,"owner_id"?: string,"precio_cobrado"?: number,"tipo"?: string,"turno_id"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "turno_items_categoria_id_fkey"
      columns: ["categoria_id"]
isOneToOne: false
      referencedRelation: "categorias"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "turno_items_combo_id_fkey"
      columns: ["combo_id"]
isOneToOne: false
      referencedRelation: "combos"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "turno_items_turno_id_fkey"
      columns: ["turno_id"]
isOneToOne: false
      referencedRelation: "turnos"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "turno_items_turno_id_fkey"
      columns: ["turno_id"]
isOneToOne: false
      referencedRelation: "v_turnos_total"
      referencedColumns: ["id"]
    }
                  ]
                },"turnos": {
                  Row: {
                    "creado_en": string,"estado": string,"id": number,"inicio": string,"medio_pago": string | null,"notas": string | null,"owner_id": string,"vehiculo_id": number
                  }
                  Insert: {
                    "creado_en"?: string,"estado"?: string,"id"?: never,"inicio": string,"medio_pago"?: string | null,"notas"?: string | null,"owner_id"?: string,"vehiculo_id": number
                  }
                  Update: {
                    "creado_en"?: string,"estado"?: string,"id"?: never,"inicio"?: string,"medio_pago"?: string | null,"notas"?: string | null,"owner_id"?: string,"vehiculo_id"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "turnos_vehiculo_id_fkey"
      columns: ["vehiculo_id"]
isOneToOne: false
      referencedRelation: "vehiculos"
      referencedColumns: ["id"]
    }
                  ]
                },"vehiculos": {
                  Row: {
                    "cliente_id": number,"creado_en": string,"id": number,"marca_modelo": string,"matricula": string,"owner_id": string,"tamano": string
                  }
                  Insert: {
                    "cliente_id": number,"creado_en"?: string,"id"?: never,"marca_modelo"?: string,"matricula": string,"owner_id"?: string,"tamano"?: string
                  }
                  Update: {
                    "cliente_id"?: number,"creado_en"?: string,"id"?: never,"marca_modelo"?: string,"matricula"?: string,"owner_id"?: string,"tamano"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "vehiculos_cliente_id_fkey"
      columns: ["cliente_id"]
isOneToOne: false
      referencedRelation: "clientes"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "vehiculos_cliente_id_fkey"
      columns: ["cliente_id"]
isOneToOne: false
      referencedRelation: "v_clientes_resumen"
      referencedColumns: ["cliente_id"]
    }
                  ]
                }
          }
          Views: {
            "v_clientes_resumen": {
                  Row: {
                    "cliente_id": number | null,"facturado": number | null,"ultima_visita": string | null,"visitas": number | null
                  }
                  Relationships: [
                    
                  ]
                },"v_servicios_realizados": {
                  Row: {
                    "categoria_id": number | null,"combo_id": number | null,"fecha": string | null,"item_id": number | null,"origen": string | null,"turno_id": number | null
                  }
                  Relationships: [
                    
                  ]
                },"v_turnos_total": {
                  Row: {
                    "cantidad_items": number | null,"estado": string | null,"fecha": string | null,"id": number | null,"inicio": string | null,"medio_pago": string | null,"notas": string | null,"total": number | null,"vehiculo_id": number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "turnos_vehiculo_id_fkey"
      columns: ["vehiculo_id"]
isOneToOne: false
      referencedRelation: "vehiculos"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Functions: {
            "crear_cliente":
{ Args: { "p_marca_modelo": string,"p_matricula": string,"p_nombre": string,"p_notas": string,"p_tamano": string,"p_telefono": string }; Returns: number
                           },
"guardar_combo":
{ Args: { "p_activo": boolean,"p_categorias": (number)[],"p_id": number,"p_nombre": string,"p_precio": number }; Returns: number
                           },
"guardar_turno":
{ Args: { "p_id": number,"p_inicio": string,"p_items": Json,"p_medio_pago": string,"p_notas": string,"p_vehiculo_id": number }; Returns: number
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "public": {
          Enums: {
            
          }
        }
} as const

