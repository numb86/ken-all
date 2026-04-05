build:
	npm run build

e2e-test: build
	rm -f ken-all-*.tgz
	npm pack
	cd test/e2e && npm ci
	cd test/e2e && npx playwright install --with-deps chromium
	cd test/e2e && npm install --no-save "file:../../$$(cd ../.. && ls ken-all-*.tgz | tail -1)"
	cd test/e2e && npm test

e2e-serve: build
	rm -f ken-all-*.tgz
	npm pack
	cd test/e2e && npm ci
	cd test/e2e && npx playwright install --with-deps chromium
	cd test/e2e && npm install --no-save "file:../../$$(cd ../.. && ls ken-all-*.tgz | tail -1)"
	cd test/e2e && npx vite --port 3000 --open

generate-csv:
	cd generateCsv && cargo run --release
