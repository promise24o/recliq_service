#!/bin/bash

echo "🌱 Starting seed for 20 users with KYC data..."

# Use the Node.js path from user's system
NODE_PATH="/Users/LilBlaze/.nvm/versions/node/v24.13.1/bin/node"
TS_NODE_PATH="/Users/LilBlaze/.nvm/versions/node/v24.13.1/lib/node_modules/ts-node/dist/bin/ts-node"

# Check if Node.js is installed
if ! command -v $NODE_PATH &> /dev/null; then
    echo "❌ Node.js is not installed at $NODE_PATH. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Run the KYC seed script
echo "📝 Running KYC seed script..."
npm run seed:users-kyc

echo "✅ KYC seed script completed!"

echo "🌱 Starting transaction seeding for user 6956cd1d842c6afdc694d3fe..."

# Run the transaction seed script
echo "📝 Running transaction seed script..."
$NODE_PATH $TS_NODE_PATH -r tsconfig-paths/register src/scripts/seed-transactions.ts

echo "✅ Transaction seeding completed!"
echo "🎯 You can now test the user ledger API:"
echo "   GET /finance/users/6956cd1d842c6afdc694d3fe/ledger"
echo "   GET /finance/users/6956cd1d842c6afdc694d3fe/ledger/summary"
