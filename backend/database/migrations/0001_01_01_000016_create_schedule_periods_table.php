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
        Schema::create('schedule_periods', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_class_id')->constrained('school_classes')->cascadeOnDelete();
            $table->foreignId('subject_id')->constrained('subjects')->cascadeOnDelete();
            $table->foreignId('teacher_id')->constrained('teachers')->cascadeOnDelete();
            $table->foreignId('academic_year_id')->nullable()->constrained('academic_years')->nullOnDelete();
            $table->enum('day_of_week', ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه'])->default('شنبه');
            $table->unsignedTinyInteger('period_number'); // 1 to 4
            $table->time('start_time');
            $table->time('end_time');
            $table->unsignedInteger('room_number')->nullable();
            $table->timestamps();

            $table->unique(['school_class_id', 'day_of_week', 'period_number'], 'uniq_class_slot');
            $table->unique(['teacher_id', 'day_of_week', 'period_number'], 'uniq_teacher_slot');
            $table->index(['school_class_id', 'day_of_week']);
            $table->index(['teacher_id', 'day_of_week']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('schedule_periods');
    }
};
