<?php

namespace App\Filament\Widgets;

use App\Models\Plant;
use App\Models\SensorValue;
use Filament\Widgets\StatsOverviewWidget as BaseWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;

class StatsSensorValue extends BaseWidget
{
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

    protected function getStats(): array
    {
        $deviceIdentifierId = Plant::find($this->plant_id)->device_identifier_id;

        $sensorValues = SensorValue::where('device_identifier_id', $deviceIdentifierId)->latest()->first();

        $irrgatedThisDay = SensorValue::where('device_identifier_id', $deviceIdentifierId)
            ->where('is_irrigating', true)
            ->whereDate('created_at', now())
            ->count();

        return [
            Stat::make('Irrigated', $irrgatedThisDay)
                ->description('Times this day')
                ->color('success'),

            Stat::make('Light Intensity', $sensorValues?->light_intensity ? $sensorValues->light_intensity . ' lux' : 'No Data')
                ->description('Optimal range: 1000-2000 lux')
                ->color($sensorValues?->light_intensity > 2000 ? 'danger' : ($sensorValues?->light_intensity < 1000 ? 'warning' : 'success')),

            Stat::make('Humidity', $sensorValues?->humidity ? $sensorValues->humidity . '%' : 'No Data')
                ->description('Optimal range: 60-80%')
                ->color($sensorValues?->humidity > 80 ? 'danger' : ($sensorValues?->humidity < 60 ? 'warning' : 'success')),
        ];
    }
}
