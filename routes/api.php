<?php

use App\Http\Controllers\Api\V1\IriggationControlUnit;
use App\Http\Controllers\Api\V1\StoreSensorValue;
use App\Http\Controllers\GetSensorValue;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::post('/store-sensor-values', StoreSensorValue::class);
Route::get('/irrigation-control/{deviceIdentifierId}',  IriggationControlUnit::class);
