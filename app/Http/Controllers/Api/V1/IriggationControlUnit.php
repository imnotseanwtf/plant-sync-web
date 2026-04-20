<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\DeviceIdentifier;
use App\Models\Plant;
use App\Models\SensorValue;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class IriggationControlUnit extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke($deviceIdentifierId): JsonResponse
    {
        $deviceExists = DeviceIdentifier::where('id', $deviceIdentifierId)->exists();
        
        if (!$deviceExists) {
            return response()->json(['message' => 'Device not found'], Response::HTTP_NOT_FOUND);
        }

        $plant = Plant::where('device_identifier_id', $deviceIdentifierId)->first();

        $sensorValue = SensorValue::where('device_identifier_id', $deviceIdentifierId)->latest()->first();

        return response()->json($plant->moisture_level_min >= $sensorValue->moisture_level, Response::HTTP_OK);
    }
}
