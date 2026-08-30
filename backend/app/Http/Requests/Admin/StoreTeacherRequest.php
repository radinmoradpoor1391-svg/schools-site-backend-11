<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class StoreTeacherRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() && $this->user()->isAdmin();
    }

    protected function prepareForValidation(): void
    {
        $rawNatId = trim((string) ($this->input('national_id') ?: $this->input('nationalId') ?: ''));
        $rawUsername = trim((string) ($this->input('username') ?: ''));
        $username = $rawUsername !== '' ? $rawUsername : $rawNatId;
        $password = trim((string) ($this->input('password') ?: ''));

        $this->merge([
            'first_name' => trim((string) ($this->input('first_name') ?: $this->input('firstName') ?: '')),
            'last_name' => trim((string) ($this->input('last_name') ?: $this->input('lastName') ?: '')),
            'national_id' => $rawNatId,
            'username' => $username,
            'password' => $password !== '' ? $password : ($rawNatId ?: '123456'),
            'personnel_code' => trim((string) ($this->input('personnel_code') ?: $this->input('personnelCode') ?: '')),
            'specialty' => trim((string) ($this->input('specialty') ?: $this->input('specialization') ?: 'عمومی')),
            'degree' => trim((string) ($this->input('degree') ?: 'کارشناسی')),
            'phone' => trim((string) ($this->input('phone') ?: '۰۹۱۲۰۰۰۰۰۰۰')),
            'assigned_class_ids' => $this->input('assigned_class_ids', $this->input('assignedClassIds', $this->input('classIds', []))),
            'assigned_subject_ids' => $this->input('assigned_subject_ids', $this->input('assignedSubjectIds', $this->input('subjectIds', []))),
        ]);
    }

    public function rules(): array
    {
        return [
            'first_name' => 'required|string|max:100',
            'last_name' => 'required|string|max:100',
            'national_id' => 'required|string|size:10|unique:teachers,national_id|unique:users,national_id',
            'username' => 'nullable|string|min:3|max:50|unique:users,username',
            'personnel_code' => 'nullable|string|max:50|unique:teachers,personnel_code',
            'specialty' => 'nullable|string|max:100',
            'degree' => 'nullable|string|max:100',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:100',
            'bio' => 'nullable|string|max:1000',
            'assigned_class_ids' => 'nullable|array',
            'assigned_class_ids.*' => 'exists:school_classes,id',
            'assigned_subject_ids' => 'nullable|array',
            'assigned_subject_ids.*' => 'exists:subjects,id',
            'password' => 'nullable|string|min:3',
        ];
    }
}
