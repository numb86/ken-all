build:
	yarn build

e2e-test: build
	rm -f ken-all-*.tgz
	npm pack
	cd test/e2e && rm -rf node_modules/ken-all package-lock.json
	cd test/e2e && npm pkg set dependencies.ken-all="file:../../$$(cd ../.. && ls ken-all-*.tgz | tail -1)"
	cd test/e2e && npm test
	cd test/e2e && npm pkg delete dependencies.ken-all

e2e-serve: build
	rm -f ken-all-*.tgz
	npm pack
	cd test/e2e && rm -rf node_modules/ken-all package-lock.json
	cd test/e2e && npm pkg set dependencies.ken-all="file:../../$$(cd ../.. && ls ken-all-*.tgz | tail -1)"
	cd test/e2e && npm i && (trap 'npm pkg delete dependencies.ken-all' EXIT; npx vite --port 3000 --open)

generate-csv:
	cd generateCsv && cargo run --release
