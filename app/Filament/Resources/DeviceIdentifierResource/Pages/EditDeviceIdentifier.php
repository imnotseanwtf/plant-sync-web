<?php

namespace App\Filament\Resources\DeviceIdentifierResource\Pages;

use App\Filament\Resources\DeviceIdentifierResource;
use Filament\Actions;
use Filament\Forms\Components\Fieldset;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Form;
use Filament\Resources\Pages\EditRecord;

class EditDeviceIdentifier extends EditRecord
{
    protected static string $resource = DeviceIdentifierResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\DeleteAction::make(),
        ];
    }

    public function form(Form $form): Form
    {
        return $form
            ->schema([
                Fieldset::make('Device Identifier Details')
                    ->schema([
                        TextInput::make('id')
                            ->disabled(),

                        TextInput::make('name')
                            ->required()
                            ->unique(ignoreRecord: true),
                    ])
            ]);
    }
}
