#!/bin/bash

# Script per avviare contemporaneamente frontend e backend in modalità sviluppo

# Colori per output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}Avvio dell'applicazione ShopMe in modalità sviluppo...${NC}"

# Funzione per eseguire il frontend
run_frontend() {
    echo -e "${BLUE}Avvio del frontend...${NC}"
    cd frontend && npm run dev
}

# Funzione per eseguire il backend
run_backend() {
    echo -e "${BLUE}Avvio del backend...${NC}"
    cd backend && npm run dev
}

# Avvia frontend e backend in parallelo
run_frontend & run_backend &

# Aspetta che tutti i processi in background terminino
wait 