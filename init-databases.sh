#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "postgres" --dbname "postgres" <<-EOSQL
    SELECT 'CREATE DATABASE user_db' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'user_db')\gexec
    SELECT 'CREATE DATABASE game_db' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'game_db')\gexec
    SELECT 'CREATE DATABASE match_db' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'match_db')\gexec
    SELECT 'CREATE DATABASE tournament_db' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'tournament_db')\gexec
    SELECT 'CREATE DATABASE statistics_db' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'statistics_db')\gexec
EOSQL