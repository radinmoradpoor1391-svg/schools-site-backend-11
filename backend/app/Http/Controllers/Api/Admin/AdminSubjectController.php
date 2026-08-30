<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Subject;
use App\Services\AuditLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminSubjectController extends Controller
{
    private function formatSubject(Subject $s): array
    {
        return [
            'id' => (string) $s->id,
            'title' => $s->title,
            'code' => $s->code,
            'coefficient' => (int) $s->coefficient,
            'gradeLevel' => $s->grade_level ?? '',
            'description' => $s->description ?? '',
        ];
    }

    public function index(): JsonResponse
    {
        $subjects = Subject::orderBy('title')->get()->map(function ($s) {
            return $this->formatSubject($s);
        });

        return response()->json([
            'success' => true,
            'data' => $subjects,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $gradeLevel = $request->input('gradeLevel', $request->input('grade_level'));

        $validated = $request->validate([
            'title' => 'required|string|max:100',
            'code' => 'required|string|max:50|unique:subjects,code',
            'coefficient' => 'required|integer|min:1|max:10',
            'description' => 'nullable|string|max:500',
        ]);

        $subject = Subject::create([
            'title' => $validated['title'],
            'code' => $validated['code'],
            'coefficient' => $validated['coefficient'],
            'grade_level' => $gradeLevel,
            'description' => $validated['description'] ?? '',
        ]);

        AuditLogService::log('ایجاد درس جدید', 'subject', (string)$subject->id, "ثبت درس {$subject->title} با ضریب {$subject->coefficient}");

        return response()->json([
            'success' => true,
            'message' => 'درس با موفقیت تعریف شد.',
            'data' => $this->formatSubject($subject),
        ], 201);
    }

    public function show(Subject $subject): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $this->formatSubject($subject),
        ]);
    }

    public function update(Request $request, Subject $subject): JsonResponse
    {
        $data = [];
        if ($request->has('title')) $data['title'] = $request->input('title');
        if ($request->has('code')) $data['code'] = $request->input('code');
        if ($request->has('coefficient')) $data['coefficient'] = $request->input('coefficient');
        if ($request->has('gradeLevel') || $request->has('grade_level')) {
            $data['grade_level'] = $request->input('gradeLevel', $request->input('grade_level'));
        }
        if ($request->has('description')) $data['description'] = $request->input('description');

        $subject->update($data);

        AuditLogService::log('ویرایش درس', 'subject', (string)$subject->id, "به‌روزرسانی درس {$subject->title}");

        return response()->json([
            'success' => true,
            'message' => 'درس با موفقیت به‌روزرسانی شد.',
            'data' => $this->formatSubject($subject),
        ]);
    }

    public function destroy(Subject $subject): JsonResponse
    {
        $title = $subject->title;
        $subject->delete();

        AuditLogService::log('حذف درس', 'subject', (string)$subject->id, "حذف درس {$title}");

        return response()->json([
            'success' => true,
            'message' => 'درس با موفقیت حذف گردید.',
        ]);
    }
}
