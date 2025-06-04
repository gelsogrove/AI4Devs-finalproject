#!/bin/bash

# Define zip file paths
BACKEND_ZIP="./backend.zip"
FRONTEND_ZIP="./frontend.zip"

# Remove old zip files
if [ -f "$BACKEND_ZIP" ]; then
    rm "$BACKEND_ZIP"
    echo "Removed $BACKEND_ZIP"
fi

if [ -f "$FRONTEND_ZIP" ]; then
    rm "$FRONTEND_ZIP"
    echo "Removed $FRONTEND_ZIP"
fi

# Create new zip files for backend and frontend
if [ -d "backend" ]; then
    zip -r "$BACKEND_ZIP" backend/
    echo "Created $BACKEND_ZIP"
else
    echo "Backend directory not found, did not create $BACKEND_ZIP"
fi

if [ -d "frontend" ]; then
    zip -r "$FRONTEND_ZIP" frontend/
    echo "Created $FRONTEND_ZIP"
else
    echo "Frontend directory not found, did not create $FRONTEND_ZIP"
fi 