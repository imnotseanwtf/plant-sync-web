<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\SensorValue\StoreSensorValueRequest;
use App\Models\DeviceIdentifier;
use App\Models\SensorValue;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

class StoreSensorValue extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(StoreSensorValueRequest $request): JsonResponse
    {
        $deviceExists = DeviceIdentifier::where('id', $request->device_identifier_id)->exists();
        
        if (!$deviceExists) {
            return response()->json(['message' => 'Device not found'], Response::HTTP_NOT_FOUND);
        }

        $sensorValue = SensorValue::create($request->validated());

        return response()->json($sensorValue->id, Response::HTTP_CREATED);
    }
}
