<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Announcement extends Model
{
    use HasFactory;

    protected $fillable = [
        'author_id',
        'author_name',
        'author_role',
        'title',
        'content',
        'target',
        'target_class_id',
        'priority',
        'expiry_date',
        'attachment_name',
        'attachment_url',
        'read_by_user_ids',
    ];

    protected $casts = [
        'read_by_user_ids' => 'array',
    ];

    public function author()
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    public function targetClass()
    {
        return $this->belongsTo(SchoolClass::class, 'target_class_id');
    }
}
