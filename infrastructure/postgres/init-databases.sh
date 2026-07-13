#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "postgres" --dbname "postgres" <<-EOSQL
    CREATE DATABASE user_db;
    CREATE DATABASE game_db;
    CREATE DATABASE match_db;
    CREATE DATABASE tournament_db;
    CREATE DATABASE statistics_db;
EOSQL