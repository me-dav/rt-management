<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'phone',
        'password',
        'role',
        'house_id',
        'ktp_photo',
        'resident_status',
        'is_married',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'is_married' => 'boolean',
    ];

    public function house()
    {
        return $this->belongsTo(House::class);
    }

    public function payments()
    {
        return $this->hasMany(Payment::class, 'resident_id');
    }

    public function houseHistories()
    {
        return $this->hasMany(HouseHistory::class, 'resident_id');
    }
}