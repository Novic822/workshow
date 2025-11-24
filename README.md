# TravelMates

A beautiful web application for visualizing travel connections on an interactive world map. Track the places you've visited and the amazing people you've met along the way.

## Features

- **Interactive World Map**: Visualize all your travel destinations and connections on a beautiful map
- **Place Management**: Add and track places you've visited with photos and descriptions
- **People Connections**: Document the people you've met, where you met them, and their home countries
- **Travel Statistics**: See your total places visited, people met, and countries covered
- **Secure Authentication**: Email/password authentication with Supabase
- **Location Search**: Built-in location search using OpenStreetMap Nominatim

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Supabase account and project

### Database Setup

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy the contents of `setup-database.sql`
4. Execute the SQL to create all necessary tables and security policies

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server (handled automatically)

## How to Use

1. **Sign Up/Sign In**: Create an account or sign in with your credentials
2. **Add a Place**: Click "Add Place" to add a location you've visited
   - Use the search feature to find locations easily
   - Add photos and descriptions to capture your memories
3. **Add People**: Click "Add Person" to add someone you've met
   - Select where you met them from your saved places
   - Search for their home country to pin them on the map
   - Add photos and notes about your connection
4. **Explore Your Map**: View all your connections on the interactive world map
   - Click on pins to see details about places and people
   - See your travel statistics at the top of the dashboard

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **Map**: Leaflet & React-Leaflet
- **Backend**: Supabase (PostgreSQL + Auth)
- **Build Tool**: Vite
- **Icons**: Lucide React

## Security

All data is protected with Row Level Security (RLS) policies. Users can only access their own data, ensuring complete privacy and security.
