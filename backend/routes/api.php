<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ResidentController;
use App\Http\Controllers\Api\HouseController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\ExpenseController;
use App\Http\Controllers\Api\ReportController;

Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    Route::apiResource('residents', ResidentController::class);

    Route::get('houses/{id}/history', [HouseController::class, 'history']);
    Route::apiResource('houses', HouseController::class);

    Route::get('payments/history', [PaymentController::class, 'history']);
    Route::get('payments/my', [PaymentController::class, 'myPayments']);
    Route::post('payments', [PaymentController::class, 'store']);
    Route::get('payments', [PaymentController::class, 'index']);
    Route::get('payments/{id}', [PaymentController::class, 'show']);
    Route::put('payments/{id}/approve', [PaymentController::class, 'approve']);
    Route::put('payments/{id}/reject', [PaymentController::class, 'reject']);

    Route::apiResource('expenses', ExpenseController::class);

    Route::get('reports/summary', [ReportController::class, 'summary']);
    Route::get('reports/monthly/{month}/{year}', [ReportController::class, 'monthly']);
    Route::get('reports/yearly', [ReportController::class, 'yearly']);
});