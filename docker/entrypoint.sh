#!/bin/bash
set -e

cd /var/www/html

find . -type f -not -path "./vendor/*" -not -path "./node_modules/*" -exec chmod 664 {} \;
find . -type d -not -path "./vendor/*" -not -path "./node_modules/*" -exec chmod 775 {} \;

if [ ! -f .env ]; then
    cp .env.example .env
fi

composer install --no-interaction

if [ -f package-lock.json ]; then
    npm ci
else
    npm install -y
fi

npm run build

chown -R plantsyncweb:www-data storage bootstrap/cache
chgrp -R www-data storage bootstrap/cache
chmod -R ug+rwx storage bootstrap/cache

if ! grep -q "^APP_KEY=base64:" .env; then
    php artisan key:generate --no-interaction
fi

until pg_isready -h "${DB_HOST:-plant-sync-web.database}" -p "${DB_PORT:-5432}" -U "${DB_USERNAME:-plant_sync_web}" >/dev/null 2>&1; do
    sleep 2
done

php artisan config:clear || true
php artisan optimize || true
php artisan migrate --seed --force || true

exec /usr/bin/supervisord -c /etc/supervisor/supervisord.conf
