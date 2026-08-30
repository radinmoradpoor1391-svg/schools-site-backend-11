<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('grades', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('students')->onDelete('cascade');
            $table->foreignId('teacher_id')->nullable()->constrained('teachers')->onDelete('set null');
            $table->foreignId('subject_id')->constrained('subjects')->onDelete('cascade');
            $table->foreignId('class_id')->constrained('school_classes')->onDelete('cascade');
            $table->foreignId('academic_year_id')->nullable()->constrained('academic_years')->onDelete('set null');
            $table->decimal('score', 4, 2); // 0.00 to 20.00
            $table->decimal('max_score', 4, 2)->default(20.00);
            $table->string('grade_type')->default('daily'); // daily, quiz, homework, activity, midterm, final, other
            $table->string('date')->nullable(); // Jalali date e.g. 1404/08/15
            $table->string('month')->nullable(); // مهر, آبان, ...
            $table->string('semester')->default('semester1'); // semester1, semester2
            $table->text('description')->nullable();
            $table->timestamps();

            $table->index(['student_id', 'subject_id', 'month']);
            $table->index(['class_id', 'subject_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('grades');
    }
};
