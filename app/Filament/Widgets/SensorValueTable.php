<?php

namespace App\Filament\Widgets;

use App\Models\DeviceIdentifier;
use App\Models\Plant;
use App\Models\SensorValue;
use Filament\Tables;
use Filament\Tables\Table;
use Filament\Widgets\TableWidget as BaseWidget;

class SensorValueTable extends BaseWidget
{
    protected static ?int $sort = 10;

    protected int | string | array $columnSpan = 'full';

    /**
     * Define the property to store the plant_id
     */
    public ?int $plant_id = null;

    /**
     * Define the property to store the visibility flag
     */
    public static ?bool $can_view = false;

    /**
     * Set polling interval to auto-refresh data (in seconds)
     */
    protected static ?string $pollingInterval = '5s';

    /**
     * Prevent this widget from showing on the dashboard
     */
    protected static bool $isLazy = true;

    /**
     * Specify that this widget should only be used on resource pages
     */
    public static function canView(): bool
    {
        return static::$can_view;
    }

    public function table(Table $table): Table
    {
        $deviceIdentifierId = Plant::find($this->plant_id)->device_identifier_id;

        return $table
            ->query(
                SensorValue::query()
                    ->where('device_identifier_id', $deviceIdentifierId)
                    ->limit(30)
            )
            ->defaultSort('created_at', 'desc')
            ->columns([
                Tables\Columns\TextColumn::make('moisture_level')
                    ->label('Moisture Level')
                    ->suffix('%')
                    ->sortable(),
                Tables\Columns\TextColumn::make('humidity')
                    ->label('Humidity')
                    ->suffix('%')
                    ->sortable(),
                Tables\Columns\TextColumn::make('temperature')
                    ->label('Temperature')
                    ->suffix('°C')
                    ->sortable(),
                Tables\Columns\TextColumn::make('light_intensity')
                    ->label('Light Intensity')
                    ->suffix(' lux')
                    ->sortable(),
                Tables\Columns\IconColumn::make('is_irrigating')
                    ->label('Irrigation Status')
                    ->boolean()
                    ->sortable(),
                Tables\Columns\TextColumn::make('created_at')
                    ->label('Timestamp')
                    ->dateTime()
                    ->sortable(),
            ]);
    }
}
