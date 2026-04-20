<?php

namespace App\Filament\Resources\DeviceIdentifierResource\Pages;

use App\Filament\Resources\DeviceIdentifierResource;
use Filament\Actions;
use Filament\Forms\Components\Fieldset;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Form;
use Filament\Resources\Pages\CreateRecord;

class CreateDeviceIdentifier extends CreateRecord
{
    protected static string $resource = DeviceIdentifierResource::class;

    public function form(Form $form): Form
    {
        return $form
            ->schema([
                Fieldset::make('Device Identifier Details')
                    ->schema([
                        TextInput::make('name')
                            ->required()
                            ->unique(),
                    ]),
            ]);
    }
}
