
all: css colors yaml

css:
	lessc apps/share/less/main.less >apps/share/css/main.css

colors:
	sed -n -e 's/@//' -e 's/:/ =/' -e 's/[#]/"#/' -e 's/;/";/p' apps/share/less/colors.less >apps/share/js/colors.js

watch: 
	./node_modules/.bin/wach -o apps/share/less/*,apps/gravity/*.yaml,apps/users/*.yaml make 

devserver:
	sleep 2 && open http://localhost:8800 &
	cd apps; /opt/local/bin/php55 -S localhost:8800 

download_db:
	dropdb `whoami`
	heroku pg:pull DATABASE_URL `whoami`
