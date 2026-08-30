<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateTeacherRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() && $this->user()->isAdmin();
    }

    protected function prepareForValidation(): void
    {
        $merge = [];
        if ($this->has('firstName')) $merge['first_name'] = $this->input('firstName');
        if ($this->has('lastName')) $merge['last_name'] = $this->input('lastName');
        if ($this->has('nationalId')) $merge['national_id'] = $this->input('nationalId');
        if ($this->has('personnelCode')) $merge['personnel_code'] = $this->input('personnelCode');
        if ($this->has('specialty') || $this->has('specialization')) $merge['specialty'] = $this->input('specialty', $this->input('specialization'));
        if ($this->has('assignedClassIds') || $this->has('classIds')) $merge['assigned_class_ids'] = $this->input('assignedClassIds', $this->input('classIds'));
        if ($this->has('assignedSubjectIds') || $this->has('subjectIds')) $merge['assigned_subject_ids'] = $this->input('assignedSubjectIds', $this->input('subjectIds'));
        if ($this->has('isActive')) $merge['is_active'] = $this->boolean('isActive');
        if ($this->has('username') && filled($this->input('username'))) $merge['username'] = trim($this->input('username'));
        if ($this->has('password') && filled($this->input('password'))) $merge['password'] = trim($this->input('password'));

        if (!empty($merge)) {
            $this->merge($merge);
        }
    }

    public function rules(): array
    {
        $teacherId = $this->route('teacher') ? $this->route('teacher')->id : null;
        $userId = $this->route('teacher') ? $this->route('teacher')->user_id : null;

        return [
            'first_name' => 'sometimes|required|string|max:100',
            'last_name' => 'sometimes|required|string|max:100',
            'national_id' => 'sometimes|required|string|size:10|unique:teachers,national_id,' . $teacherId . '|unique:users,national_id,' . $userId,
            'username' => 'sometimes|nullable|string|min:3|max:50|unique:users,username,' . $userId,
            'password' => 'nullable|string|min:3',
            'personnel_code' => 'nullable|string|max:50|unique:teachers,personnel_code,' . $teacherId,
            'specialty' => 'nullable|string|max:100',
            'degree' => 'nullable|string|max:100',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:100',
            'bio' => 'nullable|string|max:1000',
            'assigned_class_ids' => 'nullable|array',
            'assigned_class_ids.*' => 'exists:school_classes,id',
            'assigned_subject_ids' => 'nullable|array',
            'assigned_subject_ids.*' => 'exists:subjects,id',
            'is_active' => 'nullable|boolean',
        ];
    }
}
