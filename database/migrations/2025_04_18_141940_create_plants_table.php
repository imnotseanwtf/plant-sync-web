<?php

use App\Models\DeviceIdentifier;
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
        Schema::create('plants', function (Blueprint $table) {
            $table->id();
            $table->foreignIdFor(DeviceIdentifier::class)->unique()->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->double('moisture_level_min');
            $table->double('moisture_level_max');
            $table->double('humidity');
            $table->double('temperature');
            $table->double('light_intensity');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('plants');
    }
};
