<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('resident_id')->constrained('users')->onDelete('cascade');
            $table->enum('payment_type', ['security', 'cleanliness', 'both']);
            $table->enum('period_type', ['1_month', '3_months', '6_months', '1_year']);
            $table->decimal('security_amount', 10, 2)->default(100000);
            $table->decimal('cleanliness_amount', 10, 2)->default(15000);
            $table->decimal('total_amount', 10, 2);
            $table->date('payment_date');
            $table->date('period_start');
            $table->date('period_end');
            $table->string('proof_image');
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->unsignedBigInteger('reviewed_by')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->timestamps();

            $table->foreign('reviewed_by')->references('id')->on('users')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};