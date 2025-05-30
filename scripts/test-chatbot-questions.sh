#!/bin/bash

# Test Chatbot Questions Integration Script
# Tests all the "Try Asking" questions to verify all action functions work correctly

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧪 Chatbot Questions Integration Test${NC}"
echo -e "${BLUE}======================================${NC}"
echo ""

# Check if backend is running
echo -e "${YELLOW}📡 Checking backend status...${NC}"
if ! curl -s http://localhost:8080/api/health > /dev/null; then
    echo -e "${RED}❌ Backend is not running on port 8080${NC}"
    echo -e "${YELLOW}💡 Please start the backend first with: npm run dev${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Backend is running${NC}"
echo ""

# Check database status
echo -e "${YELLOW}🗄️ Checking database status...${NC}"
cd backend

# Quick database check
if npx prisma db execute --stdin <<< "SELECT COUNT(*) FROM \"Product\";" > /dev/null 2>&1; then
    PRODUCT_COUNT=$(npx prisma db execute --stdin <<< "SELECT COUNT(*) FROM \"Product\";" 2>/dev/null | tail -1 | tr -d ' ')
    FAQ_COUNT=$(npx prisma db execute --stdin <<< "SELECT COUNT(*) FROM \"FAQ\";" 2>/dev/null | tail -1 | tr -d ' ')
    DOCUMENT_COUNT=$(npx prisma db execute --stdin <<< "SELECT COUNT(*) FROM \"Document\";" 2>/dev/null | tail -1 | tr -d ' ')
    
    echo -e "${GREEN}✅ Database connected${NC}"
    echo -e "   📦 Products: ${PRODUCT_COUNT}"
    echo -e "   ❓ FAQs: ${FAQ_COUNT}"
    echo -e "   📄 Documents: ${DOCUMENT_COUNT}"
else
    echo -e "${RED}❌ Database connection failed${NC}"
    echo -e "${YELLOW}💡 Please check your database configuration${NC}"
    exit 1
fi

echo ""

# Run the integration test
echo -e "${YELLOW}🚀 Running Chatbot Questions Integration Test...${NC}"
echo -e "${BLUE}Testing these questions:${NC}"
echo -e "   1. 💬 Where is your warehouse?"
echo -e "   2. 🍷 Do you have wine less than 20 Euro?"
echo -e "   3. 📦 How long does shipping take?"
echo -e "   4. 💳 What payment methods do you accept?"
echo -e "   5. 📄 Does exist an international delivery document?"
echo ""

# Run the test with detailed output
if npm test -- --testPathPattern=chatbot-questions.integration.test.ts --verbose --detectOpenHandles; then
    echo ""
    echo -e "${GREEN}🎉 All chatbot questions tests passed!${NC}"
    echo -e "${GREEN}✅ All action functions are working correctly${NC}"
    echo ""
    echo -e "${BLUE}📊 Test Summary:${NC}"
    echo -e "   ✅ getCompanyInfo function - Warehouse location"
    echo -e "   ✅ getProducts function - Wine price filtering"
    echo -e "   ✅ getFAQs function - Shipping information"
    echo -e "   ✅ getFAQs function - Payment methods"
    echo -e "   ✅ getDocuments function - International delivery docs"
    echo ""
    echo -e "${GREEN}🚀 Your chatbot is ready for production!${NC}"
else
    echo ""
    echo -e "${RED}❌ Some tests failed${NC}"
    echo -e "${YELLOW}💡 Check the output above for details${NC}"
    echo -e "${YELLOW}💡 Make sure all services are running and database is seeded${NC}"
    exit 1
fi

cd .. 