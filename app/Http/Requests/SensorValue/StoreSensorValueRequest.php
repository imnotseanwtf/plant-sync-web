<?php

namespace App\Http\Requests\SensorValue;

use Illuminate\Foundation\Http\FormRequest;

class StoreSensorValueRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'device_identifier_id' => ['required'],
            'moisture_level' => ['required', 'numeric'],
            'humidity' => ['required', 'numeric'],
            'temperature' => ['required', 'numeric'],
            'light_intensity' => ['required', 'numeric'],
            'is_irrigating' => ['nullable', 'boolean']
        ];
    }
}
