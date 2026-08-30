<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('attendance_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('students')->onDelete('cascade');
            $table->foreignId('class_id')->constrained('school_classes')->onDelete('cascade');
            $table->foreignId('recorded_by_teacher_id')->nullable()->constrained('teachers')->onDelete('set null');
            $table->string('date'); // Jalali date e.g. 1404/08/15
            $table->enum('status', ['present', 'absent', 'excused', 'late'])->default('present');
            $table->text('note')->nullable();
            $table->timestamps();

            $table->unique(['student_id', 'class_id', 'date'], 'unique_student_class_date_attendance');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attendance_records');
    }
};
