<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class ChangePasswordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:4',
        ];
    }

    public function messages(): array
    {
        return [
            'current_password.required' => 'کلمه عبور فعلی الزامی است.',
            'new_password.required' => 'کلمه عبور جدید الزامی است.',
            'new_password.min' => 'کلمه عبور جدید باید حداقل ۴ کاراکتر باشد.',
        ];
    }
}
