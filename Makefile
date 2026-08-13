.PHONY: check test-api test-web build-web docker-up docker-down

check: test-api test-web

test-api:
	cd api && go test ./... && go vet ./...

test-web:
	cd web && pnpm check && pnpm test && pnpm build && pnpm lint:md && pnpm test:e2e

build-web:
	cd web && pnpm build

docker-up:
	docker compose up --build

docker-down:
	docker compose down
