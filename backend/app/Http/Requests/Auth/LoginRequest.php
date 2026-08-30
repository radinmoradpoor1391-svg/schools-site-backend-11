<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class LoginRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'username' => 'required|string|max:100',
            'password' => 'required|string|min:1',
            'role' => 'nullable|string|in:admin,teacher,student',
        ];
    }

    public function messages(): array
    {
        return [
            'username.required' => 'نام کاربری یا کد ملی الزامی است.',
            'password.required' => 'رمز عبور الزامی است.',
        ];
    }
}
