export DATABASE_URL="postgres://$(whoami)@localhost:5432/$(whoami)"
cd apps
echo $DATABASE_URL
php -d variables_order=EGPCS -S localhost:8800 
