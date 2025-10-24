import { supabase } from '../lib/supabase';

export const exportDatabase = {
  // Get table schemas
  async getTableSchemas() {
    try {
      const { data, error } = await supabase.rpc('get_table_schemas');
      if (error) {
        console.error('Error getting table schemas:', error);
        return null;
      }
      return data;
    } catch (error) {
      console.error('Error getting table schemas:', error);
      return null;
    }
  },

  // Get all data from a table
  async getTableData(tableName) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*');
      
      if (error) {
        console.error(`Error getting data from ${tableName}:`, error);
        return null;
      }
      return data;
    } catch (error) {
      console.error(`Error getting data from ${tableName}:`, error);
      return null;
    }
  },

  // Generate CREATE TABLE statements
  generateCreateTableSQL(tableName, data) {
    if (!data || data.length === 0) {
      return `-- No data found for table: ${tableName}\n`;
    }

    // Get column names from first row
    const columns = Object.keys(data[0]);
    
    // Generate basic CREATE TABLE statement
    let sql = `CREATE TABLE IF NOT EXISTS ${tableName} (\n`;
    sql += `  id SERIAL PRIMARY KEY,\n`;
    
    // Add other columns based on data
    columns.forEach((column, index) => {
      if (column !== 'id') {
        const value = data[0][column];
        let columnType = 'TEXT';
        
        // Determine column type based on sample data
        if (typeof value === 'number') {
          columnType = 'INTEGER';
        } else if (value instanceof Date || (typeof value === 'string' && value.includes('T'))) {
          columnType = 'TIMESTAMP WITH TIME ZONE';
        } else if (typeof value === 'boolean') {
          columnType = 'BOOLEAN';
        }
        
        sql += `  ${column} ${columnType}`;
        if (index < columns.length - 1) sql += ',';
        sql += '\n';
      }
    });
    
    sql += ');\n\n';
    return sql;
  },

  // Generate INSERT statements
  generateInsertSQL(tableName, data) {
    if (!data || data.length === 0) {
      return `-- No data to insert for table: ${tableName}\n`;
    }

    const columns = Object.keys(data[0]);
    let sql = `-- Insert data into ${tableName}\n`;
    
    data.forEach((row, index) => {
      const values = columns.map(column => {
        const value = row[column];
        if (value === null) return 'NULL';
        if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
        if (typeof value === 'boolean') return value;
        if (value instanceof Date) return `'${value.toISOString()}'`;
        return value;
      });
      
      sql += `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values.join(', ')});\n`;
    });
    
    sql += '\n';
    return sql;
  },

  // Export complete database
  async exportCompleteDatabase() {
    console.log('🚀 Starting database export...');
    
    const tables = ['users', 'posts', 'categories'];
    let fullSQL = '-- Complete Database Export\n';
    fullSQL += '-- Generated on: ' + new Date().toISOString() + '\n\n';
    
    // Add Supabase setup
    fullSQL += `-- Enable necessary extensions\n`;
    fullSQL += `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";\n\n`;
    
    // Add RLS setup
    fullSQL += `-- Enable Row Level Security\n`;
    fullSQL += `ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;\n`;
    fullSQL += `ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;\n`;
    fullSQL += `ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;\n\n`;
    
    // Add RLS policies
    fullSQL += `-- RLS Policies\n`;
    fullSQL += `CREATE POLICY "users_select_own" ON public.users FOR SELECT USING (auth.uid() = id);\n`;
    fullSQL += `CREATE POLICY "users_update_own" ON public.users FOR UPDATE USING (auth.uid() = id);\n`;
    fullSQL += `CREATE POLICY "users_insert_from_trigger" ON public.users FOR INSERT WITH CHECK (true);\n\n`;
    
    fullSQL += `CREATE POLICY "posts_select_all" ON public.posts FOR SELECT USING (true);\n`;
    fullSQL += `CREATE POLICY "categories_select_all" ON public.categories FOR SELECT USING (true);\n\n`;
    
    // Add the sync function
    fullSQL += `-- Sync function for auth.users to public.users\n`;
    fullSQL += `CREATE OR REPLACE FUNCTION sync_auth_user_to_public_users()\n`;
    fullSQL += `RETURNS TRIGGER AS $$\n`;
    fullSQL += `BEGIN\n`;
    fullSQL += `  INSERT INTO public.users (id, email, username, name, created_at, updated_at)\n`;
    fullSQL += `  VALUES (\n`;
    fullSQL += `    NEW.id,\n`;
    fullSQL += `    NEW.email,\n`;
    fullSQL += `    NULLIF(NEW.raw_user_meta_data ->> 'username', '')::text,\n`;
    fullSQL += `    NULLIF(NEW.raw_user_meta_data ->> 'name', '')::text,\n`;
    fullSQL += `    NEW.created_at,\n`;
    fullSQL += `    NOW()\n`;
    fullSQL += `  )\n`;
    fullSQL += `  ON CONFLICT (id) DO UPDATE\n`;
    fullSQL += `  SET\n`;
    fullSQL += `    email = EXCLUDED.email,\n`;
    fullSQL += `    username = COALESCE(NULLIF(EXCLUDED.username, ''), public.users.username),\n`;
    fullSQL += `    name = COALESCE(NULLIF(EXCLUDED.name, ''), public.users.name),\n`;
    fullSQL += `    updated_at = NOW();\n\n`;
    fullSQL += `  RETURN NEW;\n`;
    fullSQL += `END;\n`;
    fullSQL += `$$ LANGUAGE plpgsql;\n\n`;
    
    // Add trigger
    fullSQL += `-- Create trigger\n`;
    fullSQL += `DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;\n`;
    fullSQL += `CREATE TRIGGER on_auth_user_created\n`;
    fullSQL += `  AFTER INSERT OR UPDATE ON auth.users\n`;
    fullSQL += `  FOR EACH ROW EXECUTE FUNCTION sync_auth_user_to_public_users();\n\n`;
    
    // Export each table
    for (const tableName of tables) {
      console.log(`📊 Exporting table: ${tableName}`);
      
      const data = await this.getTableData(tableName);
      if (data) {
        fullSQL += this.generateCreateTableSQL(tableName, data);
        fullSQL += this.generateInsertSQL(tableName, data);
      }
    }
    
    console.log('✅ Database export completed');
    return fullSQL;
  }
};
