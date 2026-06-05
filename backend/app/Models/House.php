<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class House extends Model
{
    use HasFactory;

    protected $fillable = [
        'house_number',
        'status',
        'current_resident_id',
        'house_image',
    ];

    public function currentResident()
    {
        return $this->belongsTo(User::class, 'current_resident_id');
    }

    public function residents()
    {
        return $this->hasMany(User::class, 'house_id');
    }

    public function history()
    {
        return $this->hasMany(HouseHistory::class)->orderByDesc('start_date');
    }
}