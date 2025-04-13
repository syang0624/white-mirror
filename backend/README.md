# WhiteMirror Backend

## Overview

The WhiteMirror backend is a Python-based API server built with FastAPI that provides real-time chat functionality with integrated machine learning for manipulative communication detection. It analyzes messages for manipulative techniques and psychological vulnerabilities using a custom-trained classifier.

## Technical Stack

-   **Framework**: FastAPI
-   **Database**: PostgreSQL
-   **ORM**: SQLAlchemy
-   **Migration Tool**: Alembic
-   **WebSockets**: Starlette (via FastAPI)
-   **Machine Learning**: Scikit-learn
-   **Data Processing**: Pandas, Numpy
-   **Containerization**: Docker & Docker Compose

## Architecture

### Key Components

-   **API Controllers**

    -   `auth.py`: Authentication and user management
    -   `chat.py`: Message handling and retrieval
    -   `statistics.py`: Analytics and reporting
    -   `tables.py`: Data table endpoints

-   **Core Services**

    -   `classification/classifier.py`: ML model for manipulative message detection
    -   `chat_service.py`: Business logic for chat functionality
    -   `statistics.py`: Analytics computation

-   **Database Layer**

    -   `models.py`: SQLAlchemy ORM models
    -   `postgres.py`: Database connection management

-   **WebSockets**
    -   `websocket.py`: Real-time connection handling
    -   `context.py`: Application context management

### Data Flow

1. Client connects via REST API or WebSocket
2. Authentication middleware validates the request
3. For chat messages:
    - Message is received via WebSocket
    - Classifier analyzes the message content
    - Classification results are attached to the message
    - Message is stored in the database
    - Message is forwarded to recipient(s)
4. For analytics:
    - Statistics are computed from stored messages
    - Technique and vulnerability distributions are calculated
    - Results are formatted and returned to the client

## Features

### Real-time Messaging

-   WebSocket-based chat implementation
-   Message persistence in PostgreSQL
-   Delivery receipts and status tracking

### Message Classification

-   Binary classification (manipulative/non-manipulative)
-   Multi-label technique classification (11 techniques)
-   Multi-label vulnerability classification (5 vulnerabilities)
-   Confidence scoring

### Analytics API

-   Per-user statistics on manipulative communication
-   Aggregate statistics across all contacts
-   Technique and vulnerability distribution analysis
-   Message retrieval filtered by technique or vulnerability

## Development

### Project Structure

```
backend/
├── alembic/             # Database migrations
├── app/
│   ├── controllers/     # API endpoints
│   ├── core/            # Core application functionality
│   ├── db/              # Database models and connections
│   ├── dto/             # Data transfer objects
│   ├── service/         # Business logic services
│   │   └── classification/  # ML model and training
│   └── utils/           # Utility functions
├── data/                # Training data for ML model
└── requirements.txt     # Python dependencies
```

### Database Schema

#### Key Tables

-   **users**: User accounts and profiles

    -   `user_id`: UUID primary key
    -   `user_name`: Display name
    -   `email`: User email
    -   `password_hash`: Securely hashed password

-   **messages**: Chat messages with classification
    -   `message_id`: UUID primary key
    -   `sender_id`: Foreign key to users
    -   `receiver_id`: Foreign key to users
    -   `content`: Message text
    -   `timestamp`: Creation time
    -   `is_manipulative`: Boolean classification result
    -   `techniques`: Array of detected techniques
    -   `vulnerabilities`: Array of detected vulnerabilities

### Machine Learning Model

The classifier is a multi-stage pipeline:

1. **Text Preprocessing**:

    - Tokenization
    - Lowercasing
    - Stop word removal (optional)

2. **Feature Extraction**:

    - TF-IDF vectorization
    - N-gram range: 1-3

3. **Classification Pipeline**:

    - Binary classifier for initial manipulative detection
    - Multi-label technique classifier
    - Multi-label vulnerability classifier

4. **Training Process**:
    - Dataset: Annotated manipulative messages with technique/vulnerability labeling
    - Cross-validation for parameter tuning
    - Model persistence with joblib

### API Endpoints

#### Authentication

-   `POST /auth/register`: Create new user account
-   `POST /auth/login`: Authenticate user
-   `GET /auth/users`: Get all users

#### Chat

-   `GET /chat/messages`: Retrieve message history
-   `WebSocket /chat/ws/{user_id}`: Real-time chat connection

#### Statistics

-   `POST /statistics/all_statistics`: Get statistics for all communication partners
-   `POST /statistics/single_statistics`: Get statistics for specific user
-   `POST /statistics/messages_by_technique`: Get messages using specific technique
-   `POST /statistics/messages_by_vulnerability`: Get messages targeting specific vulnerability

## Environment Variables

| Variable        | Description       | Default     |
| --------------- | ----------------- | ----------- |
| `POSTGRES_USER` | Database username | `admin`     |
| `POSTGRES_PASS` | Database password | `123456`    |
| `POSTGRES_HOST` | Database hostname | `localhost` |
| `POSTGRES_PORT` | Database port     | `5432`      |
| `POSTGRES_DB`   | Database name     | `postgres`  |

## Deployment

### With Docker

```bash
# Build and start all services
docker-compose up -d

# Run migrations
docker-compose exec api alembic upgrade head
```

### Manual Deployment

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
alembic upgrade head

# Start server
sh setup.sh
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## Development Workflow

1. **Database Changes**:

    ```bash
    # Create migration after model changes
    alembic revision --autogenerate -m "Description of change"

    # Apply migrations
    alembic upgrade head
    ```

2. **ML Model Training**:

    ```bash
    # From the service/classification directory
    python classifier.py
    ```

3. **Testing Endpoints**:
    - Interactive API docs at `/docs` when server is running
    - Test scripts available in `/app/utils/`

## Testing

-   Unit tests using pytest
-   Test utilities in the `app/utils/` directory:
    -   `test_api.py`: API endpoint testing
    -   `test_classifier.py`: ML model verification
    -   `test_socket_classification.py`: WebSocket and classification testing

## Performance Considerations

-   **Database Indexing**:

    -   Indexed message sender and receiver for fast querying
    -   Consider partitioning for large message volumes

-   **Classification Optimization**:

    -   Model is loaded once at startup
    -   Vectorization and prediction are optimized for speed

-   **WebSocket Connections**:
    -   Connection manager handles scaling of concurrent connections
    -   Consider adding Redis for multi-instance deployments

## Resources

-   [FastAPI Documentation](https://fastapi.tiangolo.com/)
-   [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)
-   [Scikit-learn Documentation](https://scikit-learn.org/stable/documentation.html)
-   [Alembic Documentation](https://alembic.sqlalchemy.org/en/latest/)
