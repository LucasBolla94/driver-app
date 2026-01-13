// Google Maps Configuration
// IMPORTANT: Never commit API keys to git!
// Always use environment variables

export const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';

if (!GOOGLE_MAPS_API_KEY) {
  console.warn('⚠️ GOOGLE_MAPS_API_KEY not found! Please add it to your .env file');
  console.warn('Create a .env file in the root directory with:');
  console.warn('EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here');
}

// NOTE: For production, ALWAYS use environment variables
// Create a .env file in the root directory:
// EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_actual_api_key_here
