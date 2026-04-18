#!/bin/bash
set -e

# Wait for postgres to be ready
until PGPASSWORD=$POSTGRES_PASSWORD psql -h localhost -U $POSTGRES_USER -d postgres -c "\q"; do
  >&2 echo "Postgres is unavailable - sleeping"
  sleep 1
done

>&2 echo "Postgres is up - executing database init"

# Create the smartdiet user and database
PGPASSWORD=$POSTGRES_PASSWORD psql -h localhost -U postgres -d postgres <<-EOSQL
CREATE USER smartdiet WITH ENCRYPTED PASSWORD 'smartdiet123';
CREATE DATABASE smartdiet OWNER smartdiet;
GRANT ALL PRIVILEGES ON DATABASE smartdiet TO smartdiet;
EOSQL

>&2 echo "Database initialization complete"
