<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\House;
use App\Models\HouseHistory;
use Carbon\Carbon;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Create 20 houses first
        $houseNumbers = [
            'A-01','A-02','A-03','A-04','A-05',
            'B-01','B-02','B-03','B-04','B-05',
            'C-01','C-02','C-03','C-04','C-05',
            'D-01','D-02','D-03','D-04','D-05',
        ];

        $houses = [];
        foreach ($houseNumbers as $num) {
            $houses[] = House::create([
                'house_number' => $num,
                'status' => 'vacant',
            ]);
        }

        // Create admin
        User::create([
            'name' => 'Admin RT',
            'email' => 'admin@rt.com',
            'phone' => '081234567890',
            'password' => Hash::make('password'),
            'role' => 'admin',
            'is_married' => true,
        ]);

        // Create 15 resident users and assign to houses
        $residents = [
            ['name' => 'Budi Santoso', 'email' => 'budi@rt.com', 'phone' => '081111111111', 'is_married' => true, 'resident_status' => 'permanent'],
            ['name' => 'Siti Rahayu', 'email' => 'siti@rt.com', 'phone' => '081222222222', 'is_married' => true, 'resident_status' => 'permanent'],
            ['name' => 'Ahmad Hidayat', 'email' => 'ahmad@rt.com', 'phone' => '081333333333', 'is_married' => false, 'resident_status' => 'contract'],
            ['name' => 'Dewi Lestari', 'email' => 'dewi@rt.com', 'phone' => '081444444444', 'is_married' => true, 'resident_status' => 'permanent'],
            ['name' => 'Rudi Hermawan', 'email' => 'rudi@rt.com', 'phone' => '081555555555', 'is_married' => false, 'resident_status' => 'contract'],
            ['name' => 'Rina Susanti', 'email' => 'rina@rt.com', 'phone' => '081666666666', 'is_married' => true, 'resident_status' => 'permanent'],
            ['name' => 'Hendra Wijaya', 'email' => 'hendra@rt.com', 'phone' => '081777777777', 'is_married' => true, 'resident_status' => 'permanent'],
            ['name' => 'Mega Putri', 'email' => 'mega@rt.com', 'phone' => '081888888888', 'is_married' => false, 'resident_status' => 'contract'],
            ['name' => 'Joko Prasetyo', 'email' => 'joko@rt.com', 'phone' => '081999999999', 'is_married' => true, 'resident_status' => 'permanent'],
            ['name' => 'Yuli Handayani', 'email' => 'yuli@rt.com', 'phone' => '082111111111', 'is_married' => true, 'resident_status' => 'permanent'],
            ['name' => 'Anton Setiawan', 'email' => 'anton@rt.com', 'phone' => '082222222222', 'is_married' => false, 'resident_status' => 'contract'],
            ['name' => 'Nila Kusuma', 'email' => 'nila@rt.com', 'phone' => '082333333333', 'is_married' => true, 'resident_status' => 'permanent'],
            ['name' => 'Bayu Nugroho', 'email' => 'bayu@rt.com', 'phone' => '082444444444', 'is_married' => false, 'resident_status' => 'contract'],
            ['name' => 'Fitri Anggraini', 'email' => 'fitri@rt.com', 'phone' => '082555555555', 'is_married' => true, 'resident_status' => 'permanent'],
            ['name' => 'Dimas Saputra', 'email' => 'dimas@rt.com', 'phone' => '082666666666', 'is_married' => false, 'resident_status' => 'permanent'],
        ];

        foreach ($residents as $i => $residentData) {
            $house = $houses[$i];

            $resident = User::create([
                'name' => $residentData['name'],
                'email' => $residentData['email'],
                'phone' => $residentData['phone'],
                'password' => Hash::make('password'),
                'role' => 'resident',
                'house_id' => $house->id,
                'is_married' => $residentData['is_married'],
                'resident_status' => $residentData['resident_status'],
            ]);

            // Update house
            $house->update([
                'status' => 'occupied',
                'current_resident_id' => $resident->id,
            ]);

            // Create history
            HouseHistory::create([
                'house_id' => $house->id,
                'resident_id' => $resident->id,
                'start_date' => Carbon::now()->subMonths(rand(3, 24)),
                'end_date' => null,
                'status' => 'active',
            ]);
        }
    }
}