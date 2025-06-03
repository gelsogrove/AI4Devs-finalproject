#!/bin/bash

# Script to move files from prisma/temp to uploads/documents after seeding
# Usage: ./scripts/move-temp-files.sh

echo "🔄 Moving files from prisma/temp to uploads/documents..."

# Navigate to backend directory
cd "$(dirname "$0")/../backend" || exit 1

# Check if temp directory exists
if [ ! -d "prisma/temp" ]; then
    echo "❌ prisma/temp directory not found"
    exit 1
fi

# Check if uploads/documents directory exists, create if not
if [ ! -d "uploads/documents" ]; then
    echo "📁 Creating uploads/documents directory..."
    mkdir -p uploads/documents
fi

# Move all PDF files from temp to uploads/documents
if [ "$(ls -A prisma/temp/*.pdf 2>/dev/null)" ]; then
    echo "📄 Moving PDF files..."
    for file in prisma/temp/*.pdf; do
        if [ -f "$file" ]; then
            filename=$(basename "$file")
            echo "  Moving: $filename"
            cp "$file" "uploads/documents/$filename"
        fi
    done
    echo "✅ PDF files moved successfully"
else
    echo "ℹ️  No PDF files found in prisma/temp"
fi

# Move any other document files (txt, doc, etc.)
if [ "$(ls -A prisma/temp/*.{txt,doc,docx} 2>/dev/null)" ]; then
    echo "📄 Moving other document files..."
    for file in prisma/temp/*.{txt,doc,docx}; do
        if [ -f "$file" ]; then
            filename=$(basename "$file")
            echo "  Moving: $filename"
            cp "$file" "uploads/documents/$filename"
        fi
    done
    echo "✅ Document files moved successfully"
fi

echo "🎉 File movement completed!" 