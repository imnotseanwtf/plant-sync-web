<?php

namespace App\Filament\Resources\PlantResource\Pages;

use App\Filament\Resources\PlantResource;
use Filament\Actions;
use Filament\Forms\Components\Fieldset;
use Filament\Forms\Components\Grid;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Form;
use Filament\Resources\Pages\CreateRecord;

class CreatePlant extends CreateRecord
{
    protected static string $resource = PlantResource::class;

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
                                            ->relationship('deviceIdentifier', 'name', fn($query) => $query->doesntHave('plant'))
                                            ->preload()
                                            ->required(),
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
