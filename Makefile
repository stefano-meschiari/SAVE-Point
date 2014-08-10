all: css colors

css:
	lessc apps/share/less/main.less >apps/share/css/main.css

colors:
	sed -n -e 's/@//' -e 's/:/ =/' -e 's/[#]/"#/' -e 's/;/";/p' apps/share/less/colors.less >apps/share/js/colors.js

watch:
	./node_modules/.bin/wach -o apps/share/less/*, make 
