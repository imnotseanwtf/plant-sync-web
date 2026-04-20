<?php

namespace App\Filament\Widgets;

use App\Models\Plant;
use App\Models\SensorValue;
use Leandrocfe\FilamentApexCharts\Widgets\ApexChartWidget;

class TemperatureChart extends ApexChartWidget
{
    /**
     * Chart Id
     *
     * @var string
     */
    protected static ?string $chartId = 'temperatureChart';

    /**
     * Widget Title
     *
     * @var string|null
     */
    protected static ?string $heading = 'Temperature';

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
            ->select('temperature', 'created_at')
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get()
            ->reverse();

        $temperatures = $sensorValues->pluck('temperature')->toArray();
        $dates = $sensorValues->pluck('created_at')->map(function ($date) {
            return $date->format('M d H:i');
        })->toArray();

        return [
            'chart' => [
                'type' => 'bar',
                'height' => 300,
            ],
            'series' => [
                [
                    'name' => 'Temperature',
                    'data' => $temperatures,
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
                'labels' => [
                    'style' => [
                        'fontFamily' => 'inherit',
                    ],
                ],
                'title' => [
                    'text' => 'Temperature (°C)',
                ],
            ],
            'colors' => ['#f59e0b'],
            'plotOptions' => [
                'bar' => [
                    'borderRadius' => 3,
                    'horizontal' => false,
                ],
            ],
        ];
    }
}
