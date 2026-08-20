.PHONY: dev build run clean tidy

dev:
	go run ./cmd/server

build:
	go build -o bin/server ./cmd/server

run: build
	./bin/server

clean:
	rm -rf bin/

tidy:
	go mod tidy

lint:
	go vet ./...
