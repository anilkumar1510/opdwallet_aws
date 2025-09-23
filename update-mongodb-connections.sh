#!/bin/bash

echo "🔄 Updating MongoDB connection strings to use Docker MongoDB..."
echo "=================================================="

# Old connection string (local MongoDB without auth)
OLD_URI="mongodb://localhost:27017/opd_wallet"

# New connection string (Docker MongoDB with auth)
NEW_URI="mongodb://admin:admin123@localhost:27017/opd_wallet?authSource=admin"

# Counter for files updated
count=0

# Find and update all JavaScript files in api directory
echo "📁 Updating files in /api directory..."
for file in /Users/turbo/Projects/opdwallet/api/*.js; do
    if [ -f "$file" ]; then
        if grep -q "$OLD_URI" "$file"; then
            echo "  ✏️  Updating: $(basename $file)"
            sed -i '' "s|$OLD_URI|$NEW_URI|g" "$file"
            ((count++))
        fi
    fi
done

# Update root directory scripts
echo "📁 Updating files in root directory..."
for file in /Users/turbo/Projects/opdwallet/*.js; do
    if [ -f "$file" ]; then
        if grep -q "$OLD_URI" "$file"; then
            echo "  ✏️  Updating: $(basename $file)"
            sed -i '' "s|$OLD_URI|$NEW_URI|g" "$file"
            ((count++))
        fi
    fi
done

echo ""
echo "✅ Updated $count files"
echo ""
echo "📝 New MongoDB connection string:"
echo "   $NEW_URI"
echo ""
echo "🔑 Credentials:"
echo "   Username: admin"
echo "   Password: admin123"
echo "   Database: opd_wallet"
echo ""
echo "✨ Done!"