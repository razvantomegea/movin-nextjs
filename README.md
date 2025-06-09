# Movin App

A fitness tracking app with rewards, built with Next.js.

## Features

- Track steps, workouts, and fitness goals
- Import activities from screenshots using AI
- Route tracking with GPS
- Earn rewards for completing activities
- Dark/Light theme support
- Interactive animations and celebrations

## Getting Started

### Prerequisites

- Node.js 16+ and npm

### Installation

1. Clone the repository
   \`\`\`bash
   git clone https://github.com/yourusername/movin-app.git
   cd movin-app
   \`\`\`

2. Install dependencies
   \`\`\`bash
   npm install
   \`\`\`

3. Set up environment variables
   Create a `.env.local` file in the root directory and add the following variables:

\`\`\`bash

# AdSense Configuration (optional - for ads on free tier)

NEXT_PUBLIC_ADSENSE_CLIENT_ID=ca-pub-xxxxxxxxxxxxxxxx
NEXT_PUBLIC_ADSENSE_SLOT_ID=xxxxxxxxxx

# Other required environment variables

NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_REOWN_PROJECT_ID=your_reown_project_id
NEXT_PUBLIC_INFURA_ID=your_infura_id
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
NEXT_PUBLIC_JWT_SECRET=your_jwt_secret_key
NEXT_PUBLIC_GOOGLE_AI_API_KEY=your_google_ai_api_key
\`\`\`

**AdSense Setup:**

- The AdSense banners will only show for free (non-premium) users
- To get your AdSense credentials:
  1. Go to [Google AdSense](https://www.google.com/adsense/)
  2. Create an account and add your site
  3. Get your Publisher ID (NEXT_PUBLIC_ADSENSE_CLIENT_ID)
  4. Create an ad unit and get the Slot ID (NEXT_PUBLIC_ADSENSE_SLOT_ID)
- If these variables are not set, no ads will be displayed

**Screenshot Import Setup:**

The app includes an AI-powered screenshot import feature that allows users to import activities from fitness app screenshots:

- To enable this feature, you need a Google AI API key:
  1. Go to [Google AI Studio](https://aistudio.google.com/)
  2. Create an API key for the Gemini API
  3. Add it to your `.env.local` file as `NEXT_PUBLIC_GOOGLE_AI_API_KEY`
- The feature uses Google's Gemini 1.5 Flash model to analyze screenshots
- Supports screenshots from fitness apps and smartwatches
- Automatically extracts: activity type, duration, distance, calories, steps, heart rate
- Validates that the activity is from today and timing is consistent
- Premium feature only

### Development

\`\`\`bash
npm run dev
\`\`\`

### Building for Production

\`\`\`bash
npm run build
npm start
\`\`\`

## Project Structure

- `/app` - Next.js app router pages
- `/components` - React components
- `/public` - Static assets

## Tech Stack

- Next.js 14
- React 18
- Tailwind CSS
- Framer Motion
- Radix UI components

## License

This project is licensed under the MIT License.
