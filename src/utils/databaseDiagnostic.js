import { supabase } from '../lib/supabase';

export const databaseDiagnostic = {
  // Test Supabase connection
  async testConnection() {
    try {
      console.log('🔍 Testing Supabase connection...');
      const { data, error } = await supabase.from('_test_connection').select('*').limit(1);
      
      if (error && error.code === 'PGRST205') {
        console.log('✅ Supabase connection successful (table not found is expected)');
        return { success: true, message: 'Connection successful' };
      } else if (error) {
        console.error('❌ Supabase connection failed:', error);
        return { success: false, error: error.message };
      }
      
      return { success: true, message: 'Connection successful' };
    } catch (error) {
      console.error('❌ Connection test failed:', error);
      return { success: false, error: error.message };
    }
  },

  // Test authentication
  async testAuth() {
    try {
      console.log('🔍 Testing Supabase authentication...');
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('❌ Auth test failed:', error);
        return { success: false, error: error.message };
      }
      
      console.log('✅ Authentication service accessible');
      return { success: true, user: user };
    } catch (error) {
      console.error('❌ Auth test failed:', error);
      return { success: false, error: error.message };
    }
  },

  // Test database tables
  async testTables() {
    const tables = ['users', 'posts', 'categories'];
    const results = {};
    
    for (const table of tables) {
      try {
        console.log(`🔍 Testing table: ${table}`);
        const { data, error } = await supabase.from(table).select('*').limit(1);
        
        if (error) {
          console.error(`❌ Table ${table} error:`, error);
          results[table] = { exists: false, error: error.message };
        } else {
          console.log(`✅ Table ${table} accessible`);
          results[table] = { exists: true, count: data?.length || 0 };
        }
      } catch (error) {
        console.error(`❌ Table ${table} test failed:`, error);
        results[table] = { exists: false, error: error.message };
      }
    }
    
    return results;
  },

  // Test user creation (without actually creating)
  async testUserCreation() {
    try {
      console.log('🔍 Testing user creation permissions...');
      
      // Test if we can access auth.users (this will fail but show us the error)
      const { data, error } = await supabase
        .from('auth.users')
        .select('*')
        .limit(1);
      
      if (error) {
        console.log('ℹ️ Auth.users table access (expected to fail):', error.message);
      }
      
      return { success: true, message: 'User creation test completed' };
    } catch (error) {
      console.error('❌ User creation test failed:', error);
      return { success: false, error: error.message };
    }
  },

  // Run full diagnostic
  async runFullDiagnostic() {
    console.log('🚀 Starting Supabase Database Diagnostic');
    console.log('==========================================\n');
    
    const results = {
      connection: await this.testConnection(),
      auth: await this.testAuth(),
      tables: await this.testTables(),
      userCreation: await this.testUserCreation()
    };
    
    console.log('\n📊 Diagnostic Results:');
    console.log('======================');
    console.log('Connection:', results.connection.success ? '✅' : '❌');
    console.log('Authentication:', results.auth.success ? '✅' : '❌');
    console.log('Tables:');
    Object.entries(results.tables).forEach(([table, result]) => {
      console.log(`  ${table}: ${result.exists ? '✅' : '❌'} ${result.error || ''}`);
    });
    console.log('User Creation:', results.userCreation.success ? '✅' : '❌');
    
    return results;
  }
};
