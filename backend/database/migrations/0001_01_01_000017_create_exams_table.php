<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('exams', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_class_id')->constrained('school_classes')->cascadeOnDelete();
            $table->foreignId('subject_id')->constrained('subjects')->cascadeOnDelete();
            $table->foreignId('teacher_id')->constrained('teachers')->cascadeOnDelete();
            $table->string('title');
            $table->string('exam_type')->default('continuous'); // continuous, midterm, final_term1, final_term2
            $table->date('exam_date');
            $table->time('start_time');
            $table->unsignedSmallInteger('duration_minutes')->default(60);
            $table->decimal('max_score', 4, 2)->default(20.00);
            $table->unsignedInteger('room_number')->nullable();
            $table->text('description')->nullable();
            $table->timestamps();

            $table->index(['school_class_id', 'exam_date']);
            $table->index(['teacher_id', 'exam_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('exams');
    }
};
