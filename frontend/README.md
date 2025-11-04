# WCIT Frontend - Cat Breed Identifier App

A React-based mobile-friendly web application for identifying cat breeds using AI.

## Features

### Page 1: Home/Upload Page
- **WCIT Title**: Prominent branding with app name
- **Inspiration Paragraph**: Explains the purpose and motivation behind the app
- **Image Upload**: 
  - Take a picture using device camera
  - Upload an image from device
  - Preview before identification
- **Results Display**: 
  - Modal popup showing identified breed
  - Confidence percentage
  - Alternative breed possibilities with percentages
  - Fun facts about the identified breed
  - Actions to view collection or identify another cat

### Page 2: Gallery Page
- **Cat Collection**: Grid view of all identified cats
- **Cat Cards**: Each card displays:
  - Cat image thumbnail
  - Breed name
  - Expandable details section with:
    - Confidence level
    - Alternative breed percentages
    - Fun facts
    - Identification date

## Technology Stack

- **React** with TypeScript
- **React Router** for navigation
- **Axios** for API calls
- **CSS3** with responsive design

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The app will open in your browser at `http://localhost:3000`

### Environment Variables

Create a `.env` file in the frontend directory:

```
REACT_APP_API_URL=http://localhost:3001/api
```

For production, update this to your backend API URL.

## Development Notes

### Mock Data

The app currently uses mock data for development. When the backend is ready:

1. Update `REACT_APP_API_URL` in `.env`
2. The API service will automatically connect to the backend
3. Mock data will be disabled once the backend responds successfully

### Device ID

The app automatically generates a device ID on first visit and stores it in localStorage. This is used for session management without requiring user accounts.

## Project Structure

```
frontend/
├── src/
│   ├── pages/
│   │   ├── HomePage.tsx      # Upload and identification page
│   │   ├── HomePage.css      # Home page styles
│   │   ├── GalleryPage.tsx   # Cat collection gallery
│   │   └── GalleryPage.css   # Gallery page styles
│   ├── services/
│   │   └── api.ts            # API service with mock data
│   ├── App.tsx               # Main app component with routing
│   └── index.tsx             # App entry point
├── public/                   # Static assets
└── package.json
```

## Mobile Responsive Design

The app is fully responsive and optimized for:
- Mobile phones (portrait and landscape)
- Tablets
- Desktop browsers

All interactions are touch-friendly with appropriate button sizes and spacing.

## Next Steps

When the backend is ready:
1. Update the API URL in `.env`
2. Test the integration
3. Remove mock data fallbacks if desired

## Available Scripts

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run eject` - Eject from Create React App (irreversible)
