<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Message;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MessageController extends Controller
{
    /**
     * List messages for the authenticated user
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'data' => []]);
        }

        $query = Message::with(['sender', 'receiver', 'schoolClass']);

        if ($user->role === 'admin') {
            // Admin sees all school communications
        } elseif ($user->role === 'teacher') {
            $teacherId = $user->teacherProfile ? $user->teacherProfile->id : null;
            $query->where(function ($q) use ($user) {
                $q->where('sender_id', $user->id)
                  ->orWhere('receiver_id', $user->id)
                  ->orWhereNull('receiver_id');
            });
        } elseif ($user->role === 'student') {
            $classId = $user->studentProfile ? $user->studentProfile->class_id : null;
            $query->where(function ($q) use ($user, $classId) {
                $q->where('receiver_id', $user->id)
                  ->orWhere('school_class_id', $classId)
                  ->orWhere(function ($sub) {
                      $sub->whereNull('receiver_id')->whereNull('school_class_id');
                  });
            });
        }

        $messages = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $messages->map(function ($m) {
                return [
                    'id' => (string) $m->id,
                    'senderId' => (string) $m->sender_id,
                    'senderName' => $m->sender ? ($m->sender->role === 'admin' ? 'مدیریت مجتمع آموزشی' : $m->sender->national_id) : 'سامانه دانا',
                    'senderRole' => $m->sender ? $m->sender->role : 'admin',
                    'receiverId' => $m->receiver_id ? (string) $m->receiver_id : null,
                    'classId' => $m->school_class_id ? (string) $m->school_class_id : null,
                    'title' => $m->title,
                    'content' => $m->content,
                    'category' => $m->category,
                    'isRead' => (bool) $m->is_read,
                    'createdAt' => $m->created_at ? $m->created_at->format('Y-m-d H:i') : date('Y-m-d H:i'),
                ];
            }),
        ]);
    }

    /**
     * Send a new message or announcement
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'receiver_id' => 'nullable|exists:users,id',
            'school_class_id' => 'nullable|exists:school_classes,id',
            'title' => 'required|string|max:200',
            'content' => 'required|string',
            'category' => 'nullable|string|in:general,homework,grade,announcement',
        ]);

        $validated['sender_id'] = $user ? $user->id : 1;
        $validated['is_read'] = false;

        $msg = Message::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'پیام با موفقیت ارسال شد.',
            'data' => $msg,
        ], 201);
    }

    /**
     * Mark message as read
     */
    public function markAsRead(int $id): JsonResponse
    {
        $message = Message::findOrFail($id);
        $message->update([
            'is_read' => true,
            'read_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'پیام خوانده شد.',
        ]);
    }
}
