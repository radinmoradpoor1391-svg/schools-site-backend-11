<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use App\Services\AuditLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminAnnouncementController extends Controller
{
    private function formatAnnouncement(Announcement $an): array
    {
        return [
            'id' => (string) $an->id,
            'title' => $an->title,
            'content' => $an->content,
            'authorName' => $an->author_name ?? 'مدیریت آموزشگاه',
            'authorRole' => $an->author_role ?? 'admin',
            'target' => $an->target ?? $an->target_role ?? 'all',
            'targetClassId' => $an->target_class_id ? (string) $an->target_class_id : null,
            'priority' => $an->priority ?? 'normal',
            'expiryDate' => $an->expiry_date,
            'createdAt' => (string) $an->created_at,
            'attachmentName' => $an->attachment_name,
            'attachmentUrl' => $an->attachment_url,
            'readByUserIds' => $an->read_by_user_ids ?? [],
        ];
    }

    public function index(): JsonResponse
    {
        $announcements = Announcement::latest()->get()->map(function ($an) {
            return $this->formatAnnouncement($an);
        });

        return response()->json([
            'success' => true,
            'data' => $announcements,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $target = $request->input('target', $request->input('targetRole', 'all'));
        $targetClassId = $request->input('targetClassId', $request->input('target_class_id'));
        $expiryDate = $request->input('expiryDate', $request->input('expiry_date'));
        $attachmentName = $request->input('attachmentName', $request->input('attachment_name'));
        $attachmentUrl = $request->input('attachmentUrl', $request->input('attachment_url'));
        $priority = $request->input('priority', 'normal');

        $validated = $request->validate([
            'title' => 'required|string|max:200',
            'content' => 'required|string',
        ]);

        $user = $request->user();
        $authorName = $user ? ($user->first_name . ' ' . $user->last_name) : 'مدیریت آموزشگاه';

        $announcement = Announcement::create([
            'title' => $validated['title'],
            'content' => $validated['content'],
            'target' => $target,
            'target_role' => $target,
            'target_class_id' => $targetClassId,
            'priority' => $priority,
            'expiry_date' => $expiryDate,
            'attachment_name' => $attachmentName,
            'attachment_url' => $attachmentUrl,
            'author_id' => $user?->id,
            'author_name' => $authorName,
            'author_role' => 'admin',
            'read_by_user_ids' => [],
        ]);

        AuditLogService::log('انتشار اطلاعیه', 'announcement', (string)$announcement->id, "انتشار اطلاعیه جدید: {$announcement->title}");

        return response()->json([
            'success' => true,
            'message' => 'اطلاعیه با موفقیت در سامانه منتشر شد.',
            'data' => $this->formatAnnouncement($announcement),
        ], 201);
    }

    public function update(Request $request, Announcement $announcement): JsonResponse
    {
        $data = [];
        if ($request->has('title')) $data['title'] = $request->input('title');
        if ($request->has('content')) $data['content'] = $request->input('content');
        if ($request->has('target') || $request->has('targetRole')) {
            $t = $request->input('target', $request->input('targetRole'));
            $data['target'] = $t;
            $data['target_role'] = $t;
        }
        if ($request->has('targetClassId') || $request->has('target_class_id')) {
            $data['target_class_id'] = $request->input('targetClassId', $request->input('target_class_id'));
        }
        if ($request->has('priority')) $data['priority'] = $request->input('priority');
        if ($request->has('expiryDate') || $request->has('expiry_date')) {
            $data['expiry_date'] = $request->input('expiryDate', $request->input('expiry_date'));
        }
        if ($request->has('attachmentName') || $request->has('attachment_name')) {
            $data['attachment_name'] = $request->input('attachmentName', $request->input('attachment_name'));
        }
        if ($request->has('attachmentUrl') || $request->has('attachment_url')) {
            $data['attachment_url'] = $request->input('attachmentUrl', $request->input('attachment_url'));
        }

        $announcement->update($data);

        AuditLogService::log('ویرایش اطلاعیه', 'announcement', (string)$announcement->id, "ویرایش اطلاعیه: {$announcement->title}");

        return response()->json([
            'success' => true,
            'message' => 'اطلاعیه با موفقیت به‌روزرسانی شد.',
            'data' => $this->formatAnnouncement($announcement),
        ]);
    }

    public function destroy(Announcement $announcement): JsonResponse
    {
        $title = $announcement->title;
        $announcement->delete();

        AuditLogService::log('حذف اطلاعیه', 'announcement', (string)$announcement->id, "حذف اطلاعیه: {$title}");

        return response()->json([
            'success' => true,
            'message' => 'اطلاعیه با موفقیت حذف گردید.',
        ]);
    }
}
