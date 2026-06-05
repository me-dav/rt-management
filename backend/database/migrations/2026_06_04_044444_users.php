<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('phone', 20)->nullable();
            $table->string('password');
            $table->enum('role', ['admin', 'resident'])->default('resident');
            $table->unsignedBigInteger('house_id')->nullable();
            $table->string('ktp_photo')->nullable();
            $table->enum('resident_status', ['permanent', 'contract'])->nullable();
            $table->boolean('is_married')->default(false);
            $table->rememberToken();
            $table->timestamps();

            $table->foreign('house_id')->references('id')->on('houses')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};