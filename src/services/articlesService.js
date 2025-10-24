import { supabase } from '../lib/supabase'
import { blogPosts } from '../data/blogPosts'

export const articlesService = {
  // Fetch all articles with pagination
  async getArticles(page = 1, limit = 6, category = null) {
    try {
      // Check if Supabase is properly configured
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY || 
          import.meta.env.VITE_SUPABASE_URL === 'https://placeholder.supabase.co') {
        console.warn('Supabase not configured, using fallback data');
        // Use fallback data from local file
        let filteredPosts = blogPosts;
        if (category && category !== 'Highlight') {
          filteredPosts = blogPosts.filter(post => post.category === category);
        }
        
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedPosts = filteredPosts.slice(startIndex, endIndex);
        const totalPages = Math.ceil(filteredPosts.length / limit);
        
        return {
          posts: paginatedPosts,
          currentPage: page,
          totalPages,
          hasMore: page < totalPages
        }
      }

      // Build query for posts with category join
      let query = supabase
        .from('posts')
        .select(`
          id,
          title,
          description,
          content,
          image,
          likes,
          date,
          created_at,
          updated_at,
          categories!inner(name)
        `)
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1)

      if (category && category !== 'Highlight') {
        query = query.eq('categories.name', category)
      }

      const { data, error } = await query

      if (error) {
        console.error('Database error:', error)
        // If table doesn't exist, fall back to local data
        if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
          console.warn('Database tables not found, using fallback data');
          let filteredPosts = blogPosts;
          if (category && category !== 'Highlight') {
            filteredPosts = blogPosts.filter(post => post.category === category);
          }
          
          const startIndex = (page - 1) * limit;
          const endIndex = startIndex + limit;
          const paginatedPosts = filteredPosts.slice(startIndex, endIndex);
          const totalPages = Math.ceil(filteredPosts.length / limit);
          
          return {
            posts: paginatedPosts,
            currentPage: page,
            totalPages,
            hasMore: page < totalPages
          }
        }
        throw error
      }

      // Transform data to match expected format
      const transformedData = (data || []).map(post => ({
        id: post.id,
        title: post.title,
        description: post.description,
        content: post.content,
        image: post.image,
        category: post.categories?.name || 'General',
        author: 'Thompson P.', // Default author since it's not in the posts table
        date: post.date || post.created_at,
        likes: post.likes || 0
      }))

      // Get total count for pagination
      let countQuery = supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
      
      if (category && category !== 'Highlight') {
        countQuery = countQuery.eq('categories.name', category)
      }

      const { count: totalCount } = await countQuery
      const totalPages = Math.ceil(totalCount / limit)

      return {
        posts: transformedData,
        currentPage: page,
        totalPages,
        hasMore: page < totalPages
      }
    } catch (error) {
      console.error('Error fetching articles:', error)
      // Return empty data instead of throwing to prevent app crash
      return {
        posts: [],
        currentPage: page,
        totalPages: 0,
        hasMore: false
      }
    }
  },

  // Search articles by keyword
  async searchArticles(keyword) {
    try {
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY || 
          import.meta.env.VITE_SUPABASE_URL === 'https://placeholder.supabase.co') {
        console.warn('Supabase not configured, using fallback search');
        // Use fallback search on local data
        const filteredPosts = blogPosts.filter(post => 
          post.title.toLowerCase().includes(keyword.toLowerCase()) ||
          post.description.toLowerCase().includes(keyword.toLowerCase()) ||
          post.content.toLowerCase().includes(keyword.toLowerCase())
        ).slice(0, 10);
        
        return { posts: filteredPosts }
      }

      const { data, error } = await supabase
        .from('posts')
        .select(`
          id,
          title,
          description,
          content,
          image,
          likes,
          date,
          created_at,
          categories!inner(name)
        `)
        .or(`title.ilike.%${keyword}%,description.ilike.%${keyword}%,content.ilike.%${keyword}%`)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) {
        console.error('Database error:', error)
        // If table doesn't exist, fall back to local data
        if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
          console.warn('Database tables not found, using fallback search');
          const filteredPosts = blogPosts.filter(post => 
            post.title.toLowerCase().includes(keyword.toLowerCase()) ||
            post.description.toLowerCase().includes(keyword.toLowerCase()) ||
            post.content.toLowerCase().includes(keyword.toLowerCase())
          ).slice(0, 10);
          
          return { posts: filteredPosts }
        }
        throw error
      }

      // Transform data to match expected format
      const transformedData = (data || []).map(post => ({
        id: post.id,
        title: post.title,
        description: post.description,
        content: post.content,
        image: post.image,
        category: post.categories?.name || 'General',
        author: 'Thompson P.',
        date: post.date || post.created_at,
        likes: post.likes || 0
      }))

      return {
        posts: transformedData
      }
    } catch (error) {
      console.error('Error searching articles:', error)
      return { posts: [] }
    }
  },

  // Get article by ID
  async getArticleById(id) {
    try {
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY || 
          import.meta.env.VITE_SUPABASE_URL === 'https://placeholder.supabase.co') {
        console.warn('Supabase not configured, using fallback data');
        // Use fallback data from local file
        const post = blogPosts.find(post => post.id === parseInt(id));
        return post || null
      }

      const { data, error } = await supabase
        .from('posts')
        .select(`
          id,
          title,
          description,
          content,
          image,
          likes,
          date,
          created_at,
          updated_at,
          categories!inner(name)
        `)
        .eq('id', id)
        .single()

      if (error) {
        console.error('Database error:', error)
        // If table doesn't exist, fall back to local data
        if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
          console.warn('Database tables not found, using fallback data');
          const post = blogPosts.find(post => post.id === parseInt(id));
          return post || null
        }
        throw error
      }

      // Transform data to match expected format
      return {
        id: data.id,
        title: data.title,
        description: data.description,
        content: data.content,
        image: data.image,
        category: data.categories?.name || 'General',
        author: 'Thompson P.',
        date: data.date || data.created_at,
        likes: data.likes || 0
      }
    } catch (error) {
      console.error('Error fetching article by ID:', error)
      return null
    }
  },

  // Get all categories
  async getCategories() {
    try {
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY || 
          import.meta.env.VITE_SUPABASE_URL === 'https://placeholder.supabase.co') {
        console.warn('Supabase not configured, using fallback categories');
        // Extract categories from local data
        const categories = [...new Set(blogPosts.map(post => post.category))];
        return categories.map((name, index) => ({ id: index + 1, name }))
      }

      const { data, error } = await supabase
        .from('categories')
        .select('id, name')

      if (error) {
        console.error('Database error:', error)
        // If table doesn't exist, fall back to local data
        if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
          console.warn('Database tables not found, using fallback categories');
          const categories = [...new Set(blogPosts.map(post => post.category))];
          return categories.map((name, index) => ({ id: index + 1, name }))
        }
        throw error
      }

      // Return categories as objects with id and name
      return data.map(category => ({ 
        id: category.id, 
        name: category.name 
      }))
    } catch (error) {
      console.error('Error fetching categories:', error)
      return [
        { id: 1, name: 'General' }, 
        { id: 2, name: 'Cat' }, 
        { id: 3, name: 'Inspiration' }
      ]
    }
  },

  // Create new article (for admin)
  async createArticle(articleData) {
    try {
      const { data, error } = await supabase
        .from('posts')
        .insert([articleData])
        .select()
        .single()

      if (error) {
        throw error
      }

      return data
    } catch (error) {
      console.error('Error creating article:', error)
      throw error
    }
  },

  // Update article (for admin)
  async updateArticle(id, articleData) {
    try {
      const { data, error } = await supabase
        .from('posts')
        .update(articleData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        throw error
      }

      return data
    } catch (error) {
      console.error('Error updating article:', error)
      throw error
    }
  },

  // Delete article (for admin)
  async deleteArticle(id) {
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', id)

      if (error) {
        throw error
      }

      return true
    } catch (error) {
      console.error('Error deleting article:', error)
      throw error
    }
  }
}
