FROM php:8.2-apache

# 必要なパッケージのインストール
RUN apt-get update && apt-get install -y \
    libzip-dev \
    git \
    unzip \
    curl \
    libonig-dev \
    libjpeg-dev \
    libpng-dev \
    libwebp-dev \
    libfreetype6-dev \
    libmagickwand-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg --with-webp \
    && docker-php-ext-install pdo pdo_mysql zip gd \
    && pecl install imagick \
    && docker-php-ext-enable imagick \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Composerのインストール
RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/bin --filename=composer

# Apacheの設定
COPY ./apache-config.conf /etc/apache2/sites-available/000-default.conf
RUN a2enmod rewrite

# 作業ディレクトリとソースのコピー
WORKDIR /var/www/html/backend
COPY . .
