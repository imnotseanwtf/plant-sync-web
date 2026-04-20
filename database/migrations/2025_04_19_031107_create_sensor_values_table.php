<?php

use App\Models\DeviceIdentifier;
use App\Models\Plant;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('sensor_values', function (Blueprint $table) {
            $table->id();
            $table->foreignIdFor(DeviceIdentifier::class)->constrained()->cascadeOnDelete();
            $table->double('moisture_level');
            $table->double('humidity');
            $table->double('temperature');
            $table->double('light_intensity');
            $table->boolean('is_irrigating')->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sensor_values');
    }
};
