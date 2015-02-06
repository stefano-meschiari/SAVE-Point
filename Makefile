
all: css colors 

css:
	lessc assets/less/orbits.less >apps/orbits/css/app.css
	lessc assets/less/dashboard.less >apps/dashboard/css/app.css

colors:
	sed -n -e 's/@//' -e 's/:/ =/' -e 's/[#]/"#/' -e 's/;/";/p' assets/less/colors.less >apps/share/js/colors.js

watch: 
	./node_modules/.bin/wach -o assets/less/*,apps/orbits/*.yaml,apps/dashboard/*.yaml,apps/orbits/js/*.js make 

devserver:
	sleep 2 && open http://localhost:8800 &
	cd apps; /opt/local/bin/php55 -S localhost:8800 

orbits: apps/orbits/js/*.js
	cd apps/orbits/js; uglifyjs *.js -o app.min.js --source-map app_source_map -c -m

download_db:
	dropdb `whoami`
	heroku pg:pull DATABASE_URL `whoami` --app save-point
