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
          author_id,
          categories!inner(name),
          users!author_id(name, profile_pic)
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
        author: post.users?.name || 'Unknown Author',
        authorImage: post.users?.profile_pic || null,
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
          author_id,
          categories!inner(name),
          users!author_id(name, profile_pic)
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
        author: post.users?.name || 'Unknown Author',
        authorImage: post.users?.profile_pic || null,
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
          author_id,
          categories!inner(name),
          users!author_id(name, profile_pic)
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
        author: data.users?.name || 'Unknown Author',
        authorImage: data.users?.profile_pic || null,
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
  },

  // Like or unlike a post
  async toggleLike(postId, userId) {
    try {
      if (!userId) {
        throw new Error('User must be logged in to like posts')
      }

      // Check if user has already liked this post
      const { data: existingLike } = await supabase
        .from('post_likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .single()

      if (existingLike) {
        // Unlike the post
        const { error } = await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', userId)

        if (error) throw error

        // Decrement likes count
        const { error: updateError } = await supabase.rpc('decrement_likes', { post_id: postId })
        if (updateError) {
          console.warn('Failed to decrement likes count:', updateError)
        }

        return { liked: false }
      } else {
        // Like the post
        const { error } = await supabase
          .from('post_likes')
          .insert([{ post_id: postId, user_id: userId }])

        if (error) throw error

        // Increment likes count
        const { error: updateError } = await supabase.rpc('increment_likes', { post_id: postId })
        if (updateError) {
          console.warn('Failed to increment likes count:', updateError)
        }

        return { liked: true }
      }
    } catch (error) {
      console.error('Error toggling like:', error)
      throw error
    }
  },

  // Check if user has liked a post
  async hasUserLiked(postId, userId) {
    try {
      if (!userId) return false

      const { data } = await supabase
        .from('post_likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .single()

      return !!data
    } catch (error) {
      return false
    }
  },

  // Get comments for a post
  async getComments(postId) {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          id,
          comment_text,
          created_at,
          users!inner(name, profile_pic)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching comments:', error)
        return []
      }

      // Transform data to match expected format
      return data.map(comment => {
        const profilePic = comment.users?.profile_pic;
        console.log('Comment user profile_pic:', profilePic);
        
        return {
          id: comment.id,
          name: comment.users?.name || 'Anonymous',
          comment: comment.comment_text,
          profile_pic: profilePic || null,
          created_at: comment.created_at
        };
      })
    } catch (error) {
      console.error('Error fetching comments:', error)
      return []
    }
  },

  // Add a comment to a post
  async addComment(postId, userId, commentText) {
    try {
      if (!userId) {
        throw new Error('User must be logged in to comment')
      }

      const { data, error } = await supabase
        .from('comments')
        .insert([
          {
            post_id: postId,
            user_id: userId,
            comment_text: commentText
          }
        ])
        .select(`
          id,
          comment_text,
          created_at,
          users!inner(name, profile_pic)
        `)
        .single()

      if (error) throw error

      console.log('Added comment - user profile_pic:', data.users?.profile_pic);

      // Return the comment in the expected format
      return {
        id: data.id,
        name: data.users?.name || 'Anonymous',
        comment: data.comment_text,
        profile_pic: data.users?.profile_pic || null,
        created_at: data.created_at
      }
    } catch (error) {
      console.error('Error adding comment:', error)
      throw error
    }
  }
}
