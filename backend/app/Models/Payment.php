<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    use HasFactory;

    protected $fillable = [
        'resident_id',
        'payment_type',
        'period_type',
        'security_amount',
        'cleanliness_amount',
        'total_amount',
        'payment_date',
        'period_start',
        'period_end',
        'proof_image',
        'status',
        'reviewed_by',
        'reviewed_at',
        'rejection_reason',
    ];

    protected $casts = [
        'payment_date' => 'date',
        'period_start' => 'date',
        'period_end' => 'date',
        'reviewed_at' => 'datetime',
    ];

    public function resident()
    {
        return $this->belongsTo(User::class, 'resident_id');
    }

    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
}