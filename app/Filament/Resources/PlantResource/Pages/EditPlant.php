<?php

namespace App\Filament\Resources\PlantResource\Pages;

use App\Filament\Resources\PlantResource;
use App\Filament\Widgets\SensorValueTable;
use App\Filament\Widgets\SoilMoistureChart;
use App\Filament\Widgets\StatsSensorValue;
use App\Filament\Widgets\TemperatureChart;
use Filament\Actions;
use Filament\Forms\Components\Fieldset;
use Filament\Forms\Components\Grid;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Form;
use Filament\Resources\Pages\EditRecord;

class EditPlant extends EditRecord
{
    protected static string $resource = PlantResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\DeleteAction::make(),
        ];
    }

    public function getHeaderWidgets(): array
    {
        SoilMoistureChart::$can_view = true;
        TemperatureChart::$can_view = true;
        StatsSensorValue::$can_view = true;

        return [
            StatsSensorValue::make([
                'plant_id' => $this->record->id,
            ]),
            SoilMoistureChart::make([
                'plant_id' => $this->record->id,
            ]),
            TemperatureChart::make([
                'plant_id' => $this->record->id,
            ]),
        ];
    }

    public function getFooterWidgets(): array
    {
        SensorValueTable::$can_view = true;

        return [
            SensorValueTable::make([
                'plant_id' => $this->record->id,
            ]),
        ];
    }

    public function form(Form $form): Form
    {
        return $form
            ->schema([
                Fieldset::make('Plant Details')
                    ->schema([
                        Grid::make()
                            ->schema([
                                Grid::make()
                                    ->schema([
                                        Select::make('device_identifier_id')
                                            ->relationship('deviceIdentifier', 'name')
                                            ->preload()
                                            ->required()
                                            ->disabled(),
                                    ])->columns(1),

                                    TextInput::make('name')
                                    ->required()
                                    ->maxLength(255),
                                TextInput::make('moisture_level_min')
                                    ->required()
                                    ->suffix('%')
                                    ->numeric(),
                                TextInput::make('moisture_level_max')
                                    ->required()
                                    ->suffix('%')
                                    ->numeric(),
                                TextInput::make('humidity')
                                    ->required()
                                    ->suffix('%')
                                    ->numeric(),
                                TextInput::make('temperature')
                                    ->required()
                                    ->suffix('°C')
                                    ->numeric(),
                                TextInput::make('light_intensity')
                                    ->required()
                                    ->suffix('lux')
                                    ->numeric(),
                            ]),
                    ])
            ]);
    }
}
