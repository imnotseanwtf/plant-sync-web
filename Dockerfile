FROM php:8.2-fpm

RUN useradd -m -g www-data smartsprout

COPY --from=mlocati/php-extension-installer /usr/bin/install-php-extensions /usr/local/bin/
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

COPY . /var/www/html
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
COPY php/php.ini /usr/local/etc/php/php.ini
COPY supervisor/supervisor.conf /etc/supervisor/conf.d/supervisor.conf

RUN apt-get update && apt-get install -y \
    bash \
    curl \
    git \
    nodejs \
    npm \
    postgresql-client \
    supervisor \
    unzip \
    zip \
    && rm -rf /var/lib/apt/lists/* \
    && install-php-extensions bcmath exif gd intl mbstring pdo_pgsql pgsql zip opcache \
    && chmod +x /usr/local/bin/entrypoint.sh \
    && chown -R smartsprout:www-data /var/www/html \
    && chmod -R 775 /var/www/html

EXPOSE 9000

ENTRYPOINT ["entrypoint.sh"]
