<?php

namespace App\Filament\Widgets;

use App\Models\Plant;
use App\Models\SensorValue;
use Leandrocfe\FilamentApexCharts\Widgets\ApexChartWidget;

class SoilMoistureChart extends ApexChartWidget
{
    /**
     * Chart Id
     *
     * @var string
     */
    protected static ?string $chartId = 'soilMoistureChart';

    /**
     * Widget Title
     *
     * @var string|null
     */
    protected static ?string $heading = 'Soil Moisture';

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

    /**
     * Chart options (series, labels, types, size, animations...)
     * https://apexcharts.com/docs/options
     *
     * @return array
     */
    protected function getOptions(): array
    {
        $deviceIdentifierId = Plant::find($this->plant_id)->device_identifier_id;

        $sensorValues = SensorValue::where('device_identifier_id', $deviceIdentifierId)
            ->select('moisture_level', 'created_at')
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get()
            ->reverse();

        $moistureLevels = $sensorValues->pluck('moisture_level')->toArray();
        $dates = $sensorValues->pluck('created_at')->map(function ($date) {
            return $date->format('M d H:i');
        })->toArray();

        return [
            'chart' => [
                'type' => 'area',
                'height' => 300,
                'animations' => [
                    'enabled' => true,
                ],
            ],
            'series' => [
                [
                    'name' => 'Soil Moisture',
                    'data' => $moistureLevels,
                ],
            ],
            'xaxis' => [
                'categories' => $dates,
                'labels' => [
                    'style' => [
                        'fontFamily' => 'inherit',
                    ],
                ],
            ],
            'yaxis' => [
                'min' => 0,
                'max' => 100,
                'labels' => [
                    'style' => [
                        'fontFamily' => 'inherit',
                    ],
                ],
                'title' => [
                    'text' => 'Moisture Level (%)',
                ],
            ],
            'stroke' => [
                'curve' => 'straight',
            ],
            'dataLabels' => [
                'enabled' => false,
            ],
            'tooltip' => [
                'enabled' => true,
                'x' => [
                    'format' => 'dd MMM HH:mm',
                ],
            ],
        ];
    }
}
