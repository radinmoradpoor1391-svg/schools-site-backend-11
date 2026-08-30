<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('report_cards', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('students')->onDelete('cascade');
            $table->string('student_name');
            $table->string('student_code')->nullable();
            $table->string('national_id', 10);
            $table->foreignId('class_id')->constrained('school_classes')->onDelete('cascade');
            $table->string('class_name');
            $table->string('grade_level')->nullable();
            $table->string('field_of_study')->nullable();
            $table->foreignId('academic_year_id')->nullable()->constrained('academic_years')->onDelete('set null');
            $table->string('academic_year_name')->nullable();
            $table->enum('type', ['monthly', 'semester1', 'semester2', 'yearly'])->default('monthly');
            $table->string('month_name')->nullable();
            $table->string('term_name')->nullable();
            $table->decimal('gpa', 4, 2);
            $table->unsignedSmallInteger('total_units')->default(0);
            $table->decimal('total_weighted_score', 8, 2)->default(0);
            $table->unsignedSmallInteger('rank_in_class')->default(1);
            $table->unsignedSmallInteger('total_students_in_class')->default(1);
            $table->decimal('discipline_score', 4, 2)->default(20.00);
            $table->unsignedSmallInteger('attendance_present_count')->default(0);
            $table->unsignedSmallInteger('attendance_absent_count')->default(0);
            $table->unsignedSmallInteger('attendance_late_count')->default(0);
            $table->enum('status', ['draft', 'published'])->default('published');
            $table->json('items'); // Array of ReportCardItem
            $table->text('teacher_remarks')->nullable();
            $table->boolean('principal_approval')->default(true);
            $table->string('generated_at')->nullable();
            $table->timestamps();

            $table->index(['student_id', 'type', 'month_name']);
            $table->index(['class_id', 'type', 'month_name']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('report_cards');
    }
};
