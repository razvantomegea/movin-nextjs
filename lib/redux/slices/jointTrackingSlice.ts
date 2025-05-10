import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit"

export interface NearbyUser {
  id: string
  username: string
  avatar: string
  location: {
    lat: number
    lng: number
  }
  status: "available" | "invited" | "joined" | "busy"
}

interface JointTrackingState {
  isJointTracking: boolean
  nearbyUsers: NearbyUser[]
  invitedUsers: string[] // IDs of users who have been invited
  joinedUsers: string[] // IDs of users who have accepted and joined
  isSearching: boolean
  error: string | null
}

const initialState: JointTrackingState = {
  isJointTracking: false,
  nearbyUsers: [],
  invitedUsers: [],
  joinedUsers: [],
  isSearching: false,
  error: null,
}

// Mock data for nearby users - in a real app, this would come from a backend
const mockNearbyUsers: NearbyUser[] = [
  {
    id: "user1",
    username: "Sarah",
    avatar: "/contemplative-artist.png",
    location: { lat: 37.7749, lng: -122.4194 },
    status: "available",
  },
  {
    id: "user2",
    username: "Mike",
    avatar: "/contemplative-man.png",
    location: { lat: 37.7748, lng: -122.4193 },
    status: "available",
  },
  {
    id: "user3",
    username: "Emma",
    avatar: "/serene-woman-gaze.png",
    location: { lat: 37.7747, lng: -122.4195 },
    status: "available",
  },
  {
    id: "user4",
    username: "John",
    avatar: "/thoughtful-man-profile.png",
    location: { lat: 37.775, lng: -122.4196 },
    status: "busy",
  },
]

// Async thunk to find nearby users
export const findNearbyUsers = createAsyncThunk(
  "jointTracking/findNearbyUsers",
  async (userLocation: { lat: number; lng: number }, { rejectWithValue }) => {
    try {
      // In a real app, this would be an API call to find users within 10m
      // For now, we'll simulate a delay and return mock data
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Filter users within approximately 10m (very rough calculation)
      // In a real app, you'd use proper geospatial queries
      const nearbyUsers = mockNearbyUsers.filter((user) => {
        const latDiff = Math.abs(user.location.lat - userLocation.lat)
        const lngDiff = Math.abs(user.location.lng - userLocation.lng)
        // This is a very simplified distance check
        return latDiff < 0.0001 && lngDiff < 0.0001 && user.status === "available"
      })

      return nearbyUsers
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Failed to find nearby users")
    }
  },
)

// Async thunk to invite a user
export const inviteUser = createAsyncThunk("jointTracking/inviteUser", async (userId: string, { rejectWithValue }) => {
  try {
    // In a real app, this would be an API call to invite the user
    await new Promise((resolve) => setTimeout(resolve, 800))
    return userId
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : "Failed to invite user")
  }
})

// Async thunk to accept an invitation (simulating another user accepting)
export const acceptInvitation = createAsyncThunk(
  "jointTracking/acceptInvitation",
  async (userId: string, { rejectWithValue }) => {
    try {
      // In a real app, this would be an API call or websocket event
      await new Promise((resolve) => setTimeout(resolve, 800))
      return userId
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Failed to accept invitation")
    }
  },
)

const jointTrackingSlice = createSlice({
  name: "jointTracking",
  initialState,
  reducers: {
    setJointTracking: (state, action: PayloadAction<boolean>) => {
      state.isJointTracking = action.payload
      if (!action.payload) {
        // Reset state when disabling joint tracking
        state.invitedUsers = []
        state.joinedUsers = []
      }
    },
    resetJointTracking: (state) => {
      state.isJointTracking = false
      state.nearbyUsers = []
      state.invitedUsers = []
      state.joinedUsers = []
      state.isSearching = false
      state.error = null
    },
    // Simulate a user accepting our invitation
    simulateAcceptInvitation: (state, action: PayloadAction<string>) => {
      const userId = action.payload
      if (state.invitedUsers.includes(userId) && !state.joinedUsers.includes(userId)) {
        state.joinedUsers.push(userId)
        // Update the user's status in nearbyUsers
        const userIndex = state.nearbyUsers.findIndex((user) => user.id === userId)
        if (userIndex !== -1) {
          state.nearbyUsers[userIndex].status = "joined"
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Find nearby users
      .addCase(findNearbyUsers.pending, (state) => {
        state.isSearching = true
        state.error = null
      })
      .addCase(findNearbyUsers.fulfilled, (state, action) => {
        state.isSearching = false
        state.nearbyUsers = action.payload
      })
      .addCase(findNearbyUsers.rejected, (state, action) => {
        state.isSearching = false
        state.error = action.payload as string
      })
      // Invite user
      .addCase(inviteUser.fulfilled, (state, action) => {
        const userId = action.payload
        if (!state.invitedUsers.includes(userId)) {
          state.invitedUsers.push(userId)
          // Update the user's status in nearbyUsers
          const userIndex = state.nearbyUsers.findIndex((user) => user.id === userId)
          if (userIndex !== -1) {
            state.nearbyUsers[userIndex].status = "invited"
          }
        }
      })
      // Accept invitation
      .addCase(acceptInvitation.fulfilled, (state, action) => {
        const userId = action.payload
        if (!state.joinedUsers.includes(userId)) {
          state.joinedUsers.push(userId)
          // Update the user's status in nearbyUsers
          const userIndex = state.nearbyUsers.findIndex((user) => user.id === userId)
          if (userIndex !== -1) {
            state.nearbyUsers[userIndex].status = "joined"
          }
        }
      })
  },
})

export const { setJointTracking, resetJointTracking, simulateAcceptInvitation } = jointTrackingSlice.actions
export default jointTrackingSlice.reducer
