<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Plant extends Model
{
    /** @use HasFactory<\Database\Factories\PlantFactory> */
    use HasFactory;

    protected $fillable = [
        'device_identifier_id',
        'name',
        'humidity',
        'temperature',
        'light_intensity',
        'moisture_level_min',
        'moisture_level_max',
    ];

    public function deviceIdentifier(): BelongsTo
    {
        return $this->belongsTo(DeviceIdentifier::class);
    }
}
