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

generate-csv-from-japan-post:
	cd generateCsvFromJapanPost && cargo run --release

# リリース後の動作確認。master ブランチのリリースコミット上で実行すること。そうでないと「レジストリ版と手元ビルドの一致確認」で失敗する。
# VERSION 未指定なら package.json の version を使う（make verify-release VERSION=0.4.2 のように指定も可能）
VERSION ?= $(shell node -p "require('./package.json').version")

verify-release:
	@echo "=== 1/4: レジストリ版と手元ビルドの一致確認 ==="
	npm run build
	rm -rf /tmp/ken-all-verify && mkdir -p /tmp/ken-all-verify
	cd /tmp/ken-all-verify && npm pack ken-all@$(VERSION) --min-release-age=0 && tar -xzf ken-all-$(VERSION).tgz
	diff -r /tmp/ken-all-verify/package/esm esm
	@echo "=== 2/4: E2E をレジストリ版で実行 ==="
	cd test/e2e && npm ci
	cd test/e2e && npx playwright install --with-deps chromium
	cd test/e2e && npm install --no-save ken-all@$(VERSION) --min-release-age=0
	cd test/e2e && npm test
	@echo "=== 3/4: Node からの利用確認 ==="
	cd test/e2e && node -e "import('ken-all').then(m => m.default('1000004')).then(r => { if (r[0][0] !== '東京都') { console.error('unexpected:', r); process.exit(1); } console.log('OK: ' + JSON.stringify(r)); })"
	@echo "=== 4/4: unpkg 配信確認 ==="
	curl -sfI https://unpkg.com/ken-all@$(VERSION)/esm/index.js > /dev/null || (echo "unpkg 未配信（反映に数分かかることがある。後で再実行）" && exit 1)
	@echo "✅ verify-release: すべて合格 ($(VERSION))"
