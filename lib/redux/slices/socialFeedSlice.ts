import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit"

// Types
export interface SocialPost {
  id: string
  user: {
    name: string
    avatar: string
    username: string
  }
  content: string
  image?: string
  timestamp: string
  likes: number
  comments: number
  liked: boolean
}

interface SocialFeedState {
  posts: SocialPost[]
  isLoading: boolean
  error: string | null
  isRefreshing: boolean
}

// Mock data
const mockPosts: SocialPost[] = [
  {
    id: "1",
    user: {
      name: "Alex Johnson",
      avatar: "/diverse-group-city.png",
      username: "alexj",
    },
    content:
      "Just completed my 10K run! 🏃‍♂️ Feeling amazing and energized. Who else is hitting their fitness goals today?",
    image: "/urban-dawn-dash.png",
    timestamp: "2 hours ago",
    likes: 24,
    comments: 5,
    liked: false,
  },
  {
    id: "2",
    user: {
      name: "Sarah Miller",
      avatar: "/contemplative-artist.png",
      username: "sarahm",
    },
    content:
      "New personal best on my daily steps! The Movin app is really keeping me accountable. Love the energy rewards system!",
    timestamp: "4 hours ago",
    likes: 18,
    comments: 3,
    liked: true,
  },
  {
    id: "3",
    user: {
      name: "David Chen",
      avatar: "/contemplative-man.png",
      username: "davidc",
    },
    content:
      "Morning yoga session complete ✅ Starting the day with positive energy and mindfulness. Who else practices yoga?",
    image: "/diverse-fitness-group.png",
    timestamp: "6 hours ago",
    likes: 32,
    comments: 7,
    liked: false,
  },
  {
    id: "4",
    user: {
      name: "Emma Wilson",
      avatar: "/serene-woman-gaze.png",
      username: "emmaw",
    },
    content:
      "Just earned my first achievement badge! The gamification in this app is so motivating. What badges have you all earned?",
    timestamp: "1 day ago",
    likes: 45,
    comments: 12,
    liked: false,
  },
  {
    id: "5",
    user: {
      name: "Michael Brown",
      avatar: "/thoughtful-man-profile.png",
      username: "mikeb",
    },
    content:
      "Group run in the park was amazing today! Met so many fellow Movin users. The community aspect of this app is fantastic.",
    image: "/park-stroll.png",
    timestamp: "1 day ago",
    likes: 29,
    comments: 8,
    liked: true,
  },
]

// Async thunks
export const fetchSocialFeed = createAsyncThunk("socialFeed/fetchSocialFeed", async (_, { rejectWithValue }) => {
  try {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))
    return mockPosts
  } catch (error) {
    return rejectWithValue("Failed to fetch social feed. Please try again.")
  }
})

export const refreshSocialFeed = createAsyncThunk("socialFeed/refreshSocialFeed", async (_, { rejectWithValue }) => {
  try {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    return mockPosts
  } catch (error) {
    return rejectWithValue("Failed to refresh social feed. Please try again.")
  }
})

// Initial state
const initialState: SocialFeedState = {
  posts: [],
  isLoading: false,
  error: null,
  isRefreshing: false,
}

// Slice
const socialFeedSlice = createSlice({
  name: "socialFeed",
  initialState,
  reducers: {
    toggleLike: (state, action: PayloadAction<string>) => {
      const post = state.posts.find((post) => post.id === action.payload)
      if (post) {
        post.liked = !post.liked
        post.likes += post.liked ? 1 : -1
      }
    },
    addPost: (state, action: PayloadAction<Omit<SocialPost, "id" | "timestamp" | "likes" | "comments" | "liked">>) => {
      const newPost: SocialPost = {
        id: Date.now().toString(),
        ...action.payload,
        timestamp: "Just now",
        likes: 0,
        comments: 0,
        liked: false,
      }
      state.posts.unshift(newPost)
    },
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSocialFeed.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchSocialFeed.fulfilled, (state, action) => {
        state.isLoading = false
        state.posts = action.payload
      })
      .addCase(fetchSocialFeed.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      .addCase(refreshSocialFeed.pending, (state) => {
        state.isRefreshing = true
        state.error = null
      })
      .addCase(refreshSocialFeed.fulfilled, (state, action) => {
        state.isRefreshing = false
        state.posts = action.payload
      })
      .addCase(refreshSocialFeed.rejected, (state, action) => {
        state.isRefreshing = false
        state.error = action.payload as string
      })
  },
})

export const { toggleLike, addPost, clearError } = socialFeedSlice.actions
export default socialFeedSlice.reducer
