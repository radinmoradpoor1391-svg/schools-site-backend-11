<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('announcements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('author_id')->nullable()->constrained('users')->onDelete('set null');
            $table->string('author_name')->default('مدیریت آموزشگاه');
            $table->string('author_role')->default('admin');
            $table->string('title');
            $table->text('content');
            $table->enum('target', ['all', 'students', 'teachers', 'class', 'admin'])->default('all');
            $table->foreignId('target_class_id')->nullable()->constrained('school_classes')->onDelete('set null');
            $table->enum('priority', ['low', 'normal', 'high', 'urgent'])->default('normal');
            $table->string('expiry_date')->nullable();
            $table->string('attachment_name')->nullable();
            $table->string('attachment_url')->nullable();
            $table->json('read_by_user_ids')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('announcements');
    }
};
