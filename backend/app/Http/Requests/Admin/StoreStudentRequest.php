<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class StoreStudentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() && $this->user()->isAdmin();
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'first_name' => $this->input('first_name', $this->input('firstName')),
            'last_name' => $this->input('last_name', $this->input('lastName')),
            'national_id' => $this->input('national_id', $this->input('nationalId')),
            'username' => $this->input('username', $this->input('national_id', $this->input('nationalId'))),
            'student_code' => $this->input('student_code', $this->input('studentCode')),
            'father_name' => $this->input('father_name', $this->input('fatherName', 'ـ')),
            'birth_date' => $this->input('birth_date', $this->input('birthDate', '۱۳۸۸/۰۵/۱۵')),
            'class_id' => $this->input('class_id', $this->input('classId')),
            'grade_level' => $this->input('grade_level', $this->input('gradeLevel')),
            'field_of_study' => $this->input('field_of_study', $this->input('fieldOfStudy', 'عمومی')),
            'parent_phone' => $this->input('parent_phone', $this->input('parentPhone')),
            'address' => $this->input('address', $this->input('address', 'ـ')),
            'discipline_score' => $this->input('discipline_score', $this->input('disciplineScore', 20.00)),
            'password' => $this->input('password', $this->input('password', $this->input('national_id', $this->input('nationalId')))),
        ]);
    }

    public function rules(): array
    {
        return [
            'first_name' => 'required|string|max:100',
            'last_name' => 'required|string|max:100',
            'national_id' => 'required|string|size:10|unique:students,national_id|unique:users,national_id',
            'username' => 'nullable|string|min:3|max:50|unique:users,username',
            'student_code' => 'nullable|string|max:50|unique:students,student_code',
            'father_name' => 'nullable|string|max:100',
            'birth_date' => 'nullable|string',
            'class_id' => 'nullable|exists:school_classes,id',
            'grade_level' => 'nullable|string|max:50',
            'field_of_study' => 'nullable|string|max:50',
            'parent_phone' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:500',
            'discipline_score' => 'nullable|numeric|between:0,20',
            'password' => 'nullable|string|min:3',
        ];
    }

    public function messages(): array
    {
        return [
            'first_name.required' => 'نام دانش‌آموز الزامی است.',
            'last_name.required' => 'نام خانوادگی دانش‌آموز الزامی است.',
            'national_id.required' => 'کد ملی ۱۰ رقمی الزامی است.',
            'national_id.size' => 'کد ملی باید دقیقاً ۱۰ رقم باشد.',
            'national_id.unique' => 'این کد ملی قبلاً در سامانه ثبت شده است.',
            'username.unique' => 'نام کاربری انتخابی قبلاً برای کاربر دیگری ثبت شده است.',
            'student_code.unique' => 'کد دانش‌آموزی تکراری است.',
        ];
    }
}
