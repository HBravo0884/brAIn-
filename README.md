# Program Manager Hub

A comprehensive web-based hub for managing program management workflows, built with React, Vite, and Tailwind CSS.

## Features

- **Template Management**: Create and manage reusable templates for grant applications, progress reports, budget summaries, and more
- **Grant Management**: Track grant applications, awards, aims, and milestones
- **Budget Tracking**: Monitor financial allocations and spending with categorized budgets
- **Workflow Visualizations**: Kanban boards, Gantt charts, progress dashboards, and flowcharts
- **Document Management**: Track, organize, and export documents in various formats
- **Local Storage**: All data persists locally in the browser

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository or navigate to the project directory:
```bash
cd program-manager-hub
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

## Usage

### Dashboard
The main landing page provides an overview of:
- Active grants
- Budget status
- Recent documents
- Quick actions

### Templates
Create reusable templates for:
- Grant applications
- Progress reports
- Budget summaries
- Payment requests
- Meeting reports
- Budget justifications
- Notifications

### Grants
Manage grant applications and awards:
- Track status (pending, active, completed, rejected)
- Define aims and milestones
- Link budgets and documents
- Monitor progress

### Budget
Track financial allocations:
- Total budget overview
- Category breakdown
- Spending progress
- Budget alerts

### Workflows
Visualize work with:
- Kanban boards for task management
- Gantt charts for timeline planning
- Progress dashboards with charts
- Flowcharts for process mapping

### Documents
Organize and manage:
- Document library with categories
- Link documents to grants and budgets
- Export capabilities
- Version tracking

## Tech Stack

- **Frontend**: React 19 + Vite 5
- **Styling**: Tailwind CSS 3
- **Routing**: React Router v6
- **State Management**: React Context API
- **Storage**: localStorage
- **Charts**: Recharts
- **Icons**: Lucide React
- **Date Handling**: date-fns

## Development

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

### Lint
```bash
npm run lint
```

## Project Structure

```
program-manager-hub/
├── src/
│   ├── components/
│   │   ├── common/          # Reusable UI components
│   │   ├── templates/       # Template management
│   │   ├── workflows/       # Workflow visualizations
│   │   ├── budget/          # Budget tracking
│   │   ├── grants/          # Grant management
│   │   └── documents/       # Document management
│   ├── pages/               # Main page components
│   ├── context/             # React Context providers
│   ├── utils/               # Utility functions
│   ├── App.jsx              # Main app component
│   └── main.jsx             # Entry point
├── public/                  # Static assets
└── package.json
```

## Data Persistence

All data is stored in the browser's localStorage. To export or backup your data:
1. Use the browser's developer tools
2. Navigate to Application > Local Storage
3. Export the data for backup

## Future Enhancements

- Cloud sync with Firebase
- Multi-user collaboration
- Email integration
- Calendar integration
- Advanced analytics
- Mobile app

## License

MIT

## Author

Built with Claude Code
