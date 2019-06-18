bin := node_modules/.bin/

now = `date -u +"%Y-%m-%dT%H:%M:%SZ"`
log = echo "$(now) $(1)"

# By default, make will run in silent mode
ifndef VERBOSE
.SILENT:
endif

# In layman's terms: node_modules directory depends on the state of package.json
# Make will compare their timestamps and only if package.json is newer, it will run this target.
node_modules: package.json
	$(call log,"Installing dependencies ...")
	npm install
	$(call log,"Dependencies installed.")

install: node_modules

infra:
	$(call log,"Starting services ...")
	docker-compose up -d
	$(call log,"Services started.")

infra-stop:
	$(call log,"Stopping services ...")
	docker-compose stop
	$(call log,"Services stopped.")

infra-restart: infra-stop infra

lint:
	$(call log,"Running ESLint ...")
	$(bin)eslint --max-warnings=0 --ext .js ./src ./tests
	$(call log,"ESLint run completed.")

test: install
	$(call log,"Running tests ...")
	NODE_ENV=test $(bin)mocha --opts ./tests/mocha.opts ./tests
	$(call log,"Tests completed.")

subtest: install
	$(call log,"Running subset of tests...")
	NODE_ENV=test NEW_RELIC_ENABLED=false NEW_RELIC_NO_CONFIG_FILE=true $(bin)mocha --opts ./tests/mocha.opts --grep $(FILTER) ./tests
	$(call log,"Tests completed.")

test-ci:
	$(MAKE) lint
	$(MAKE) coverage

coverage: install
	$(call log,"Generating coverage ...")
	NODE_ENV=test $(bin)nyc $(bin)mocha --opts ./tests/mocha.opts ./tests
	$(call log,"Coverage report generated.")

security-test:
	$(call log,"Running security test ...")
	$(bin)snyk test
	$(call log,"Security test completed.")

clean:
	$(call log,"Cleaning ...")
	rm -rf ./.nyc_output
	rm -rf ./coverage
	$(call log,"Clean done.")

migrate:
	$(call log,"Migrating database ...")
	$(bin)sequelize db:migrate
	$(call log,"Migrations completed.")

seed:
	$(call log,"Seeding database ...")
	$(bin)sequelize db:seed:all
	$(call log,"Seeding completed.")

watch:
	$(call log,"Watching code. Happy codding!")
	$(bin)nodemon --watch ./src --exec "node ./src/app.js | $(bin)bunyan"
	$(call log,"Seeding completed.")

script-update-tokens:
	$(call log,"Executing the DB token update script")
	node ./src/scripts/add-endpoint-arns-to-tokens.js | $(bin)bunyan
	$(call log,"Script finished")

.PHONY: compile
	lint
	test
	clean
	infra
	stop-infra
	restart-infra
