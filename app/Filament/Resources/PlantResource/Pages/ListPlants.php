<?php

namespace App\Filament\Resources\PlantResource\Pages;

use App\Filament\Resources\PlantResource;
use Filament\Actions;
use Filament\Resources\Pages\ListRecords;
use Filament\Tables\Actions\BulkActionGroup;
use Filament\Tables\Actions\DeleteBulkAction;
use Filament\Tables\Actions\EditAction;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

class ListPlants extends ListRecords
{
    protected static string $resource = PlantResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\CreateAction::make(),
        ];
    }

    public function table(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('deviceIdentifier.name')
                    ->searchable()
                    ->sortable(),
                TextColumn::make('name')
                    ->searchable()
                    ->sortable(),
                TextColumn::make('moisture_level_min')
                    ->numeric()
                    ->suffix('%')
                    ->sortable(),
                TextColumn::make('moisture_level_max')
                    ->numeric()
                    ->suffix('%')
                    ->sortable(),
                TextColumn::make('humidity')
                    ->numeric()
                    ->suffix('%')
                    ->sortable(),
                TextColumn::make('temperature')
                    ->numeric()
                    ->suffix('°C')
                    ->sortable(),
                TextColumn::make('light_intensity')
                    ->numeric()
                    ->suffix(' lux')
                    ->sortable(),
            ])
            ->filters([
                //
            ])
            ->actions([
                EditAction::make(),
            ])
            ->bulkActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                ]),
            ]);
    }
}
