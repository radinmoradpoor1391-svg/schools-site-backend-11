<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('students', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained('users')->onDelete('cascade');
            $table->string('student_code')->unique()->nullable();
            $table->string('national_id', 10)->unique()->index();
            $table->string('first_name');
            $table->string('last_name');
            $table->string('father_name')->nullable();
            $table->string('birth_date')->nullable();
            $table->foreignId('current_class_id')->nullable()->constrained('school_classes')->onDelete('set null');
            $table->string('grade_level')->nullable();
            $table->string('field_of_study')->nullable();
            $table->string('parent_phone')->nullable();
            $table->text('address')->nullable();
            $table->string('avatar_url')->nullable();
            $table->decimal('discipline_score', 4, 2)->default(20.00);
            $table->boolean('is_active')->default(true);
            $table->boolean('first_login')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('students');
    }
};
