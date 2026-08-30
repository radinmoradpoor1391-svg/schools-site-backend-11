<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'name' => config('app.name', 'Dana School Management System API'),
        'version' => '1.0.0',
        'status' => 'online',
        'laravel_version' => app()->version(),
        'docs_url' => '/api/health',
    ]);
});
