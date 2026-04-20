<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SensorValue extends Model
{
    /** @use HasFactory<\Database\Factories\SensorValueFactory> */
    use HasFactory;

    protected $fillable = [
        'device_identifier_id',
        'moisture_level',
        'humidity',
        'temperature',
        'light_intensity',
        'is_irrigating'
    ];

    public function deviceIdentifier(): BelongsTo
    {
        return $this->belongsTo(DeviceIdentifier::class);
    }
}
