<?php

declare(strict_types=1);

function loadEnv(): void
{
    static $loaded = false;
    if (!$loaded) {
        $isDev = getenv('APP_ENV') === 'development';
        $envDir = $isDev
            ? __DIR__ . '/..'
            : dirname(dirname($_SERVER['DOCUMENT_ROOT'])) . '/scheduler_test';
        $envFile = $isDev ? '.env.development' : '.env';
        $dotenv = Dotenv\Dotenv::createImmutable($envDir, '/' . $envFile);
        $dotenv->load();
        $loaded = true;
    }
}
