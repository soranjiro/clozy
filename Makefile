# frontend

.PHONY: frontend-dev
frontend-dev:
	cd ./frontend && yarn dev


# backend

.PHONY: backend-dev
backend-dev:
	cd ./backend && yarn dev

## wrangler

.PHONY: db-migrate
db-migrate:
	cd ./backend &&	\
	wrangler d1 execute clozy --local --file=./db/migration.sql

.PHONY: db-seed
db-seed:
	cd ./backend &&	\
	wrangler d1 execute clozy --local --file=./db/seed.sql

.PHONY: show-tables
show-tables:
	cd ./backend &&	\
	wrangler d1 execute clozy --command="select name from sqlite_master where type='table'"

.PHONY: show-table
show-table:
	cd ./backend &&	\
	wrangler d1 execute clozy --command="select * from $(table)"
