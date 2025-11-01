# CrisisMap – package.json Overview

**Purpose**
------------
Defines the frontend dependencies, project metadata, and build scripts for CrisisMap.

**Responsibilities**
- Specifies all NPM packages required for the CrisisMap frontend:
  - React 18, Axios, and React Router for core logic.
  - Tailwind CSS, PostCSS, and CRACO for styling and build customization.
  - shadcn/ui and lucide-react for reusable UI components.
- Manages build, start, and test commands for local development and deployment.

**Key Scripts**
| Command | Description |
|----------|-------------|
| `npm start` | Launches the CrisisMap development server |
| `npm run build` | Builds the production-ready version of the frontend |
| `npm test` | Runs frontend unit tests |
| `npm run lint` | Checks code formatting and quality |

**Notes**
- This configuration integrates with the backend API built using FastAPI.
- Dependencies are optimized for responsiveness and cross-browser support.
- Works in combination with Tailwind, PostCSS, and CRACO configs.

