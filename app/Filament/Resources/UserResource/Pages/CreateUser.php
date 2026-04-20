<?php

namespace App\Filament\Resources\UserResource\Pages;

use App\Filament\Resources\UserResource;
use Filament\Actions;
use Filament\Forms\Components\Fieldset;
use Filament\Forms\Components\Grid;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Form;
use Filament\Resources\Pages\CreateRecord;

class CreateUser extends CreateRecord
{
    protected static string $resource = UserResource::class;

    public function form(Form $form): Form
    {
        return $form
            ->schema([
                Fieldset::make('User Information')
                    ->schema([
                        Grid::make(2)
                            ->schema([
                                TextInput::make('name')
                                    ->required()
                                    ->maxLength(255),
                                TextInput::make('email')
                                    ->email()
                                    ->required()
                                    ->maxLength(255)
                                    ->unique(),
                                TextInput::make('password')
                                    ->password()
                                    ->required()
                                    ->minLength(8),
                                TextInput::make('password_confirmation')
                                    ->password()
                                    ->required()
                                    ->minLength(8)
                                    ->same('password')
                                    ->label('Confirm Password'),
                            ]),
                    ]),
            ]);
    }
}
