<?php

use App\Http\Controllers\GetSensorValue;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});
