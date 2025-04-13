# WhiteMirror Frontend

## Overview

The frontend for WhiteMirror is a modern React application built with Vite that provides an intuitive interface for real-time chat with manipulative communication detection and comprehensive analytics dashboards.

## Technical Stack

-   **Framework**: React with Hooks
-   **Build Tool**: Vite
-   **Styling**: Tailwind CSS with class-variance-authority for component variants
-   **Routing**: React Router v6
-   **HTTP Client**: Axios
-   **WebSockets**: Custom WebSocket implementation for real-time chat

## Architecture

### Key Components

-   **Chat Interface**

    -   `ChatPage.jsx`: Main chat interface container
    -   `ChatArea.jsx`: Message display area
    -   `ChatFooter.jsx`: Input components with command suggestions
    -   `Sidebar.jsx`: Contact list and navigation
    -   `ChatBubble.jsx`: Message bubble components with manipulative message styling

-   **Dashboard**

    -   `Dashboard.jsx`: Analytics interface container
    -   `UserSelector.jsx`: User filtering component
    -   `DashboardTabs.jsx`: Navigation between views
    -   `OverviewPanel.jsx`: Statistical overview
    -   `TimelinePanel.jsx`: Chronological message analysis

-   **StatsBot Integration**
    -   Command processing in `ChatPage.jsx`
    -   Command suggestion UI in `CommandSuggestions.jsx`
    -   Command parameter intelligence with dynamic filtering

### Key Services

-   **API Communication**
    -   `api.js`: Core API client for authentication and messaging
    -   `statistics_api.js`: Specialized client for manipulative communication analytics

## Features

### Real-time Chat

-   WebSocket-based instant messaging
-   Manipulative message highlighting with amber borders
-   Technique and vulnerability indicators
-   Message history with pagination

### Command Interface

The StatsBot provides a command-driven interface with intelligent auto-completion:

| Command          | Description                      | Example                                      |
| ---------------- | -------------------------------- | -------------------------------------------- |
| `/help`          | Display available commands       | `/help`                                      |
| `/all`           | Statistics for all users         | `/all`                                       |
| `/user`          | User-specific statistics         | `/user 249f0de2-390a-4549-a9f2-ddd2916fdfc9` |
| `/technique`     | Filter by manipulation technique | `/technique Persuasion or Seduction`         |
| `/vulnerability` | Filter by targeted vulnerability | `/vulnerability Dependency`                  |

Commands support:

-   Autocomplete of command names
-   Parameter suggestions with filtering
-   Multi-word parameter handling
-   Optional user parameter for filtering

### Analytics Dashboard

-   User-specific and global statistics
-   Technique and vulnerability distribution charts
-   Timeline visualization of manipulative patterns
-   Message inspection with detailed analysis

## Development

### Project Structure

```
frontend/
├── public/              # Static assets
├── src/
│   ├── assets/          # Images and other assets
│   ├── components/      # Reusable UI components
│   │   ├── dashboard/   # Dashboard-specific components
│   │   └── ui/          # Base UI components
│   ├── lib/             # Utilities and API clients
│   ├── pages/           # Top-level page components
│   └── main.jsx         # Application entry point
└── package.json         # Dependencies and scripts
```

### Key Dependencies

-   `react`, `react-dom`: UI library
-   `react-router-dom`: Routing
-   `axios`: HTTP client
-   `tailwindcss`: Utility-first CSS framework
-   `lucide-react`: Icon library
-   `class-variance-authority`: Component variant management

### Environment Variables

| Variable       | Description     | Default                 |
| -------------- | --------------- | ----------------------- |
| `VITE_API_URL` | Backend API URL | `http://localhost:8000` |

### Available Scripts

-   `npm run dev`: Start development server
-   `npm run build`: Build for production
-   `npm run lint`: Run ESLint
-   `npm run preview`: Preview production build

## Best Practices

-   **Component Structure**: Follow atomic design principles
-   **State Management**: Use React hooks for component state
-   **API Interactions**: Abstract API calls into service modules
-   **Error Handling**: Implement consistent error handling patterns
-   **Responsive Design**: Use Tailwind's responsive utilities

## Extending the Interface

### Adding New Commands

1. Add the command definition in `ChatFooter.jsx` within the `allCommands` array
2. Implement the command handler in `processStatsBotCommand` in `ChatPage.jsx`
3. Add API methods in `statistics_api.js` if needed

### Adding New UI Components

1. Create new component with proper typing
2. Use Tailwind for styling with the established color scheme
3. Implement responsive behavior
4. Add proper error handling

## Troubleshooting

### Common Issues

-   **WebSocket Connection Failures**: Verify backend is running and CORS is configured
-   **Command Auto-completion Not Working**: Check command definitions in `ChatFooter.jsx`
-   **Charts Not Rendering**: Ensure data format matches expected structure

## Resources

-   [React Documentation](https://reactjs.org/docs/getting-started.html)
-   [Vite Guide](https://vitejs.dev/guide/)
-   [Tailwind CSS Documentation](https://tailwindcss.com/docs)
