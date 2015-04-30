run:
	python -m SimpleHTTPServer 9001

test: FORCE
	node_modules/.bin/wct --local chrome,firefox

update:
	npm install

FORCE: