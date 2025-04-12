#!/bin/bash
echo "Installing dependencies..."
pip install -r requirements.txt

echo "Starting PostgreSQL container..."
docker compose up -d

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
sleep 5

echo "Running database migrations..."
alembic upgrade head

echo "Setting up database tables..."
python app/utils/setup_db.py

echo "Setup completed successfully!"
echo "To start the application, run: uvicorn app.main:app --reload"
