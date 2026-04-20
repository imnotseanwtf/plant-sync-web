<?php

namespace App\Filament\Resources;

use App\Filament\Resources\DeviceIdentifierResource\Pages;
use App\Filament\Resources\DeviceIdentifierResource\RelationManagers;
use App\Models\DeviceIdentifier;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\SoftDeletingScope;

class DeviceIdentifierResource extends Resource
{
    protected static ?string $model = DeviceIdentifier::class;

    protected static ?string $navigationIcon = 'heroicon-o-device-tablet';
    
    protected static?string $navigationGroup = 'Plant Management';

    public static function getRelations(): array
    {
        return [
            //
        ];
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListDeviceIdentifiers::route('/'),
            'create' => Pages\CreateDeviceIdentifier::route('/create'),
            'edit' => Pages\EditDeviceIdentifier::route('/{record}/edit'),
        ];
    }
}
