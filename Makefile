.PHONY: clean check test

LIB = lib
REPORTs = reports

all: node_modules lib

node_modules: package.json
	@npm install
	@touch $@

check:
	@eslint --ext .js,.jsx ./src

test: node_modules check
	@jest

clean:
	@rm -rf $(LIB)
	@rm -rf $(REPORTS)

lib: clean
	@rollup -c
