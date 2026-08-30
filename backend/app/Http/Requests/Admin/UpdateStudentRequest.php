<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateStudentRequest extends FormRequest
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
        if ($this->has('studentCode')) $merge['student_code'] = $this->input('studentCode');
        if ($this->has('fatherName')) $merge['father_name'] = $this->input('fatherName');
        if ($this->has('birthDate')) $merge['birth_date'] = $this->input('birthDate');
        if ($this->has('classId')) $merge['class_id'] = $this->input('classId');
        if ($this->has('gradeLevel')) $merge['grade_level'] = $this->input('gradeLevel');
        if ($this->has('fieldOfStudy')) $merge['field_of_study'] = $this->input('fieldOfStudy');
        if ($this->has('parentPhone')) $merge['parent_phone'] = $this->input('parentPhone');
        if ($this->has('disciplineScore')) $merge['discipline_score'] = $this->input('disciplineScore');
        if ($this->has('isActive')) $merge['is_active'] = $this->boolean('isActive');

        if (!empty($merge)) {
            $this->merge($merge);
        }
    }

    public function rules(): array
    {
        $studentId = $this->route('student') ? $this->route('student')->id : null;
        $userId = $this->route('student') ? $this->route('student')->user_id : null;

        return [
            'first_name' => 'sometimes|required|string|max:100',
            'last_name' => 'sometimes|required|string|max:100',
            'national_id' => 'sometimes|required|string|size:10|unique:students,national_id,' . $studentId . '|unique:users,national_id,' . $userId,
            'student_code' => 'nullable|string|max:50|unique:students,student_code,' . $studentId,
            'father_name' => 'nullable|string|max:100',
            'birth_date' => 'nullable|string',
            'class_id' => 'nullable|exists:school_classes,id',
            'grade_level' => 'nullable|string|max:50',
            'field_of_study' => 'nullable|string|max:50',
            'parent_phone' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:500',
            'discipline_score' => 'nullable|numeric|between:0,20',
            'is_active' => 'nullable|boolean',
        ];
    }
}
