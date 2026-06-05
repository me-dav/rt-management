<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\House;
use App\Models\HouseHistory;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;

class HouseController extends Controller
{
    public function index()
    {
        $houses = House::with(['currentResident'])->orderBy('house_number')->get();

        return response()->json($houses->map(function ($house) {
            return [
                'id' => $house->id,
                'house_number' => $house->house_number,
                'status' => $house->status,
                'house_image' => $house->house_image ? asset('storage/' . $house->house_image) : null,
                'current_resident' => $house->currentResident ? [
                    'id' => $house->currentResident->id,
                    'name' => $house->currentResident->name,
                    'phone' => $house->currentResident->phone,
                    'resident_status' => $house->currentResident->resident_status,
                    'is_married' => $house->currentResident->is_married,
                ] : null,
            ];
        }));
    }

    public function store(Request $request)
    {
        $request->validate([
            'house_number' => 'required|string|max:10|unique:houses,house_number',
            'status' => 'nullable|in:occupied,vacant',
            'resident_id' => 'nullable|exists:users,id',
            'house_image' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
        ]);

        $imagePath = null;
        if ($request->hasFile('house_image')) {
            $imagePath = $request->file('house_image')->store('houses', 'public');
        }

        $house = House::create([
            'house_number' => $request->house_number,
            'status' => $request->status ?? 'vacant',
            'house_image' => $imagePath,
        ]);

        if ($request->resident_id && $request->status === 'occupied') {
            $resident = User::find($request->resident_id);
            if ($resident) {
                $house->update(['current_resident_id' => $resident->id, 'status' => 'occupied']);
                $resident->update(['house_id' => $house->id]);

                HouseHistory::create([
                    'house_id' => $house->id,
                    'resident_id' => $resident->id,
                    'start_date' => Carbon::now(),
                    'status' => 'active',
                ]);
            }
        }

        return response()->json([
            'message' => 'Rumah berhasil ditambahkan',
            'data' => $house->load('currentResident'),
        ], 201);
    }

    public function show($id)
    {
        $house = House::with(['currentResident'])->findOrFail($id);

        return response()->json([
            'id' => $house->id,
            'house_number' => $house->house_number,
            'status' => $house->status,
            'house_image' => $house->house_image ? asset('storage/' . $house->house_image) : null,
            'current_resident' => $house->currentResident,
        ]);
    }

    public function update(Request $request, $id)
    {
        $house = House::findOrFail($id);

        $request->validate([
            'house_number' => 'required|string|max:10|unique:houses,house_number,' . $id,
            'status' => 'nullable|in:occupied,vacant',
            'resident_id' => 'nullable|exists:users,id',
            'house_image' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
        ]);

        $imagePath = $house->house_image;
        if ($request->hasFile('house_image')) {
            if ($imagePath) Storage::disk('public')->delete($imagePath);
            $imagePath = $request->file('house_image')->store('houses', 'public');
        }

        $newStatus = $request->status ?? 'vacant';
        $newResidentId = $request->resident_id;
        $oldResidentId = $house->current_resident_id;

        // If resident changed
        if ($oldResidentId != $newResidentId) {
            if ($oldResidentId) {
                $oldResident = User::find($oldResidentId);
                if ($oldResident) $oldResident->update(['house_id' => null]);
                HouseHistory::where('house_id', $id)
                    ->where('resident_id', $oldResidentId)
                    ->where('status', 'active')
                    ->update(['end_date' => Carbon::now(), 'status' => 'inactive']);
            }

            if ($newResidentId) {
                $newResident = User::find($newResidentId);
                if ($newResident) $newResident->update(['house_id' => $house->id]);
                HouseHistory::create([
                    'house_id' => $house->id,
                    'resident_id' => $newResidentId,
                    'start_date' => Carbon::now(),
                    'status' => 'active',
                ]);
            }
        }

        $house->update([
            'house_number' => $request->house_number,
            'status' => $newResidentId ? 'occupied' : $newStatus,
            'current_resident_id' => $newResidentId,
            'house_image' => $imagePath,
        ]);

        return response()->json([
            'message' => 'Data rumah berhasil diperbarui',
            'data' => $house->fresh()->load('currentResident'),
        ]);
    }

    public function destroy($id)
    {
        $house = House::findOrFail($id);

        if ($house->house_image) {
            Storage::disk('public')->delete($house->house_image);
        }

        $house->delete();

        return response()->json(['message' => 'Rumah berhasil dihapus']);
    }

    public function history($id)
    {
        $house = House::findOrFail($id);
        $history = HouseHistory::with('resident')
            ->where('house_id', $id)
            ->orderByDesc('start_date')
            ->get();

        return response()->json([
            'house_number' => $house->house_number,
            'history' => $history->map(function ($h) {
                return [
                    'id' => $h->id,
                    'resident' => [
                        'id' => $h->resident->id,
                        'name' => $h->resident->name,
                        'phone' => $h->resident->phone,
                        'resident_status' => $h->resident->resident_status,
                    ],
                    'start_date' => $h->start_date,
                    'end_date' => $h->end_date,
                    'status' => $h->status,
                ];
            }),
        ]);
    }
}