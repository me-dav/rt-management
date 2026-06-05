<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Email atau password salah.'],
            ]);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'role' => $user->role,
                'house_id' => $user->house_id,
                'ktp_photo' => $user->ktp_photo ? asset('storage/' . $user->ktp_photo) : null,
                'resident_status' => $user->resident_status,
                'is_married' => $user->is_married,
                'house' => $user->house ? [
                    'id' => $user->house->id,
                    'house_number' => $user->house->house_number,
                ] : null,
            ],
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Berhasil logout']);
    }

    public function me(Request $request)
    {
        $user = $request->user()->load('house');

        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'role' => $user->role,
            'house_id' => $user->house_id,
            'ktp_photo' => $user->ktp_photo ? asset('storage/' . $user->ktp_photo) : null,
            'resident_status' => $user->resident_status,
            'is_married' => $user->is_married,
            'house' => $user->house ? [
                'id' => $user->house->id,
                'house_number' => $user->house->house_number,
            ] : null,
        ]);
    }
}