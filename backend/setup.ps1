Write-Output "Installing dependencies..."
pip install -r requirements.txt

Write-Output "Starting PostgreSQL container..."
docker compose up -d

# Wait for PostgreSQL to be ready
Write-Output "Waiting for PostgreSQL to be ready..."
Start-Sleep -Seconds 5

Write-Output "Running database migrations..."
alembic upgrade head

Write-Output "Setting up database tables..."
python app/utils/setup_db.py

Write-Output "Setup completed successfully!"
Write-Output "To start the application, run: uvicorn app.main:app --reload"