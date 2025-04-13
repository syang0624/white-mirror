# WhiteMirror - Manipulative Communication Analysis

## Overview

WhiteMirror is an advanced chat application designed to detect, analyze, and visualize manipulative communication techniques in conversations. The platform uses machine learning to identify potentially harmful communication patterns and helps users understand the psychological dynamics at play in their digital interactions.

## Repository Structure

```
white-mirror/
├── README.md              # This file
├── backend/
│   ├── alembic.ini        # Alembic configuration for database migrations
│   ├── docker-compose.yml # Docker configuration for postgresql database
│   ├── requirements.txt   # Python dependencies
│   ├── setup.sh           # Bash setup script
│   ├── alembic/           # Database migration files
│   ├── app/
│   │   ├── main.py        # Application entry point
│   │   ├── controllers/   # API endpoints and routes
│   │   ├── dto/           # Data transfer objects
│   │   ├── core/          # Core application functionality (context and websocket)
│   │   ├── db/            # Database models and connections
│   │   ├── service/       # Service logic
│   │   │   └── classification/ # ML model for message analysis for manipulation
│   │   └── utils/         # Utility functions and testing tools
│   │   ├── agent/         # Langgraph Agent Configurations
│   └── data/              # Training data for ML models
├── frontend/
│   ├── package.json       # Frontend dependencies
│   ├── vite.config.js     # Vite configuration
│   ├── public/            # Static assets
│   └── src/
│       ├── main.jsx       # Application entry point
│       ├── components/    # Reusable UI components
│       │   ├── ui/        # Base UI components
│       │   └── dashboard/ # Dashboard-specific components
│       ├── lib/           # Utilities and API clients
│       └── pages/         # Top-level page components
```

## Features

-   **Real-time Chat with Manipulation Detection**

    -   Instant messaging with real-time manipulative content analysis
    -   WebSocket implementation for live updates
    -   Highlighting of detected manipulative messages
    -   Detailed identification of specific manipulation techniques and targeted vulnerabilities

-   **Comprehensive Analytics Dashboard**

    -   User-specific and aggregate statistics on manipulative communication
    -   Visualization of manipulation techniques and vulnerability patterns
    -   Timeline view to track manipulative patterns over time
    -   Detailed message inspection with technique/vulnerability breakdown

-   **StatsBot Integration**

    -   Interactive chatbot for querying manipulation statistics
    -   Command-based interface for data retrieval
    -   Ability to filter messages by technique or vulnerability
    -   User-specific or aggregate data views

-   **Machine Learning Classification**
    -   Sophisticated ML model for detecting manipulative communications
    -   Classification of multiple manipulation techniques including Persuasion/Seduction, Shaming, Rationalization, etc.
    -   Identification of psychological vulnerabilities like Dependency, Naivete, Low Self-esteem

-   **LLM Agent**
    - Integrated Langgraph-based Agent that receives user question and use tool-calling (function-calling) to either query the postgresdb

## Installation

### Prerequisites

-   Node.js 16+ and npm/yarn
-   Python 3.9+
-   PostgreSQL 13+
-   Docker and Docker Compose (optional, for containerized deployment)

### Backend Setup

1. **Navigate to the backend directory**

    ```bash
    cd white-mirror/backend
    ```

2. **Create a virtual environment**

    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows, use: venv\Scripts\activate
    ```

3. **Install dependencies**

    ```bash
    pip install -r requirements.txt
    ```

4. **Set up environment variables**

    - Create a `.env` file in the backend directory:

    ```
    # PostgreSQL settings
    POSTGRES_USER=admin
    POSTGRES_PASS=123456
    POSTGRES_HOST=localhost
    POSTGRES_PORT=5432
    POSTGRES_DB=whitemirror
    ```

5. **Initialize the database**

    ```bash
    # If using Docker
    docker-compose up -d

    # Run database migrations
    alembic upgrade head
    ```

6. **Start the backend server**
    ```bash
    sh setup.sh
    uvicorn app.main:app --reload
    ```

### Frontend Setup

1. **Navigate to the frontend directory**

    ```bash
    cd white-mirror/frontend
    ```

2. **Install dependencies**

    ```bash
    npm install
    ```

3. **Set up environment variables**

    - Create a `.env` file in the frontend directory:

    ```
    VITE_API_URL=http://localhost:8000
    ```

4. **Start the development server**

    ```bash
    npm run dev
    ```

5. **Access the application**
    - Open [http://localhost:5173](http://localhost:5173) in your browser
    - Default login credentials are provided in the first-time setup

## Usage

### Chat Interface

-   Start conversations with contacts in the sidebar
-   Manipulative messages are highlighted with amber borders
-   Hover over highlighted messages to see detected techniques and vulnerabilities

### StatsBot Commands

-   `/help` - View all available commands
-   `/all` - Get statistics for all users
-   `/user [user_id]` - Get statistics for a specific user
-   `/technique [technique_name] [optional: user_name]` - Get messages using a specific technique
-   `/vulnerability [vulnerability_name] [optional: user_name]` - Get messages targeting a specific vulnerability

### Dashboard

-   Access the dashboard by clicking the dashboard button in the sidebar
-   Select specific users or view aggregate data
-   Analyze manipulation patterns and review flagged messages

## Technical Details

### Frontend Architecture

-   React application built with Vite
-   Tailwind CSS for styling
-   WebSockets for real-time communication
-   Command-based interface for StatsBot interaction

### Backend Architecture

-   FastAPI for API endpoints
-   PostgreSQL database with SQLAlchemy ORM
-   Scikit-learn for machine learning classification
-   WebSockets for real-time messaging

### Machine Learning Pipeline

1. **Text Preprocessing**: Messages are cleaned and tokenized
2. **Feature Extraction**: TF-IDF vectorization converts text to numerical features
3. **Classification**: Binary classification for manipulative detection, multi-label for techniques and vulnerabilities
4. **Post-processing**: Results are stored for display and analysis

## Evaluation

The system has been evaluated using:

-   Cross-validation on the training dataset
-   Manual review of classification accuracy
-   User feedback on detection quality

## Future Improvements

-   Additional manipulation techniques detection
-   Enhanced visualization tools for pattern recognition
-   Mobile application support
-   Integration with popular messaging platforms
-   Real-time coaching for healthier communication

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

-   The machine learning model was trained on a dataset of annotated manipulative communications
-   Special thanks to contributors and researchers in digital communication psychology
