<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasOne;

class DeviceIdentifier extends Model
{
    /** @use HasFactory<\Database\Factories\DeviceIdentifierFactory> */
    use HasFactory, HasUuids;

    protected $fillable = [
        'name',
    ];

    public function plant(): HasOne
    {
        return $this->hasOne(Plant::class);
    }
}
