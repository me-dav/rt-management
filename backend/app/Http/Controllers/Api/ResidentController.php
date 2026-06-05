<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\House;
use App\Models\HouseHistory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;

class ResidentController extends Controller
{
    public function index(Request $request)
    {
        $query = User::with('house')
            ->where('role', 'resident');

        if ($request->search) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        if ($request->status && $request->status !== 'all') {
            $query->where('resident_status', $request->status);
        }

        $residents = $query->orderBy('name')->paginate(10);

        return response()->json([
            'data' => $residents->items(),
            'total' => $residents->total(),
            'per_page' => $residents->perPage(),
            'current_page' => $residents->currentPage(),
            'last_page' => $residents->lastPage(),
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'phone' => 'required|string|max:20',
            'resident_status' => 'required|in:permanent,contract',
            'is_married' => 'required|in:0,1,true,false',
            'house_id' => 'nullable|exists:houses,id',
            'ktp_photo' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
        ]);

        $ktpPath = null;
        if ($request->hasFile('ktp_photo')) {
            $ktpPath = $request->file('ktp_photo')->store('ktp', 'public');
        }

        $resident = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'password' => bcrypt('password123'),
            'role' => 'resident',
            'resident_status' => $request->resident_status,
            'is_married' => filter_var($request->is_married, FILTER_VALIDATE_BOOLEAN),
            'house_id' => $request->house_id,
            'ktp_photo' => $ktpPath,
        ]);

        // Assign house if provided
        if ($request->house_id) {
            $house = House::find($request->house_id);
            if ($house) {
                // End previous history
                HouseHistory::where('house_id', $house->id)
                    ->where('status', 'active')
                    ->update(['end_date' => Carbon::now(), 'status' => 'inactive']);

                $house->update([
                    'status' => 'occupied',
                    'current_resident_id' => $resident->id,
                ]);

                HouseHistory::create([
                    'house_id' => $house->id,
                    'resident_id' => $resident->id,
                    'start_date' => Carbon::now(),
                    'status' => 'active',
                ]);
            }
        }

        return response()->json([
            'message' => 'Penghuni berhasil ditambahkan',
            'data' => $resident->load('house'),
        ], 201);
    }

    public function show($id)
    {
        $resident = User::with('house')->where('role', 'resident')->findOrFail($id);

        return response()->json([
            'id' => $resident->id,
            'name' => $resident->name,
            'email' => $resident->email,
            'phone' => $resident->phone,
            'resident_status' => $resident->resident_status,
            'is_married' => $resident->is_married,
            'house_id' => $resident->house_id,
            'ktp_photo' => $resident->ktp_photo ? asset('storage/' . $resident->ktp_photo) : null,
            'house' => $resident->house,
        ]);
    }

    public function update(Request $request, $id)
    {
        $resident = User::where('role', 'resident')->findOrFail($id);

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . $id,
            'phone' => 'required|string|max:20',
            'resident_status' => 'required|in:permanent,contract',
            'is_married' => 'required|in:0,1,true,false',
            'house_id' => 'nullable|exists:houses,id',
            'ktp_photo' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
        ]);

        $ktpPath = $resident->ktp_photo;
        if ($request->hasFile('ktp_photo')) {
            if ($ktpPath) Storage::disk('public')->delete($ktpPath);
            $ktpPath = $request->file('ktp_photo')->store('ktp', 'public');
        }

        // Handle house change
        $oldHouseId = $resident->house_id;
        $newHouseId = $request->house_id;

        if ($oldHouseId != $newHouseId) {
            // Vacate old house
            if ($oldHouseId) {
                $oldHouse = House::find($oldHouseId);
                if ($oldHouse && $oldHouse->current_resident_id == $resident->id) {
                    $oldHouse->update(['status' => 'vacant', 'current_resident_id' => null]);
                    HouseHistory::where('house_id', $oldHouseId)
                        ->where('resident_id', $resident->id)
                        ->where('status', 'active')
                        ->update(['end_date' => Carbon::now(), 'status' => 'inactive']);
                }
            }

            // Assign new house
            if ($newHouseId) {
                $newHouse = House::find($newHouseId);
                if ($newHouse) {
                    HouseHistory::where('house_id', $newHouseId)
                        ->where('status', 'active')
                        ->update(['end_date' => Carbon::now(), 'status' => 'inactive']);

                    $newHouse->update([
                        'status' => 'occupied',
                        'current_resident_id' => $resident->id,
                    ]);

                    HouseHistory::create([
                        'house_id' => $newHouseId,
                        'resident_id' => $resident->id,
                        'start_date' => Carbon::now(),
                        'status' => 'active',
                    ]);
                }
            }
        }

        $resident->update([
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'resident_status' => $request->resident_status,
            'is_married' => filter_var($request->is_married, FILTER_VALIDATE_BOOLEAN),
            'house_id' => $newHouseId,
            'ktp_photo' => $ktpPath,
        ]);

        return response()->json([
            'message' => 'Data penghuni berhasil diperbarui',
            'data' => $resident->fresh()->load('house'),
        ]);
    }

    public function destroy($id)
    {
        $resident = User::where('role', 'resident')->findOrFail($id);

        // Vacate house
        if ($resident->house_id) {
            $house = House::find($resident->house_id);
            if ($house && $house->current_resident_id == $resident->id) {
                $house->update(['status' => 'vacant', 'current_resident_id' => null]);
            }
            HouseHistory::where('resident_id', $resident->id)
                ->where('status', 'active')
                ->update(['end_date' => Carbon::now(), 'status' => 'inactive']);
        }

        if ($resident->ktp_photo) {
            Storage::disk('public')->delete($resident->ktp_photo);
        }

        $resident->delete();

        return response()->json(['message' => 'Penghuni berhasil dihapus']);
    }
}