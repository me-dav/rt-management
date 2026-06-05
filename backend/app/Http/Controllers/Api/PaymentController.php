<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Http\Request;
use Carbon\Carbon;

class PaymentController extends Controller
{
    public function index(Request $request)
    {
        $query = Payment::with(['resident.house'])
            ->orderByDesc('created_at');

        if ($request->search) {
            $query->whereHas('resident', function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%');
            });
        }

        if ($request->status && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->month && $request->year) {
            $query->whereMonth('payment_date', $request->month)
                  ->whereYear('payment_date', $request->year);
        }

        $payments = $query->paginate(10);

        return response()->json([
            'data' => $payments->map(function ($p) {
                return $this->formatPayment($p);
            }),
            'total' => $payments->total(),
            'per_page' => $payments->perPage(),
            'current_page' => $payments->currentPage(),
            'last_page' => $payments->lastPage(),
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'payment_type' => 'required|in:security,cleanliness,both',
            'period_type'  => 'required|in:1_month,3_months,6_months,1_year',
            'total_amount' => 'required|numeric|min:15000',
            'payment_date' => 'required|date',
            'period_start' => 'required|date',
            'period_end'   => 'required|date|after:period_start',
            'proof_image'  => 'required|image|mimes:jpeg,png,jpg,webp|max:2048',
        ]);

        $proofPath = $request->file('proof_image')->store('payments', 'public');

        $securityAmount = 0;
        $cleanlinessAmount = 0;
        if ($request->payment_type === 'security' || $request->payment_type === 'both') {
            $securityAmount = 100000;
        }
        if ($request->payment_type === 'cleanliness' || $request->payment_type === 'both') {
            $cleanlinessAmount = 15000;
        }

        $payment = Payment::create([
            'resident_id'        => $request->user()->id,
            'payment_type'       => $request->payment_type,
            'period_type'        => $request->period_type,
            'security_amount'    => $securityAmount,
            'cleanliness_amount' => $cleanlinessAmount,
            'total_amount'       => $request->total_amount,
            'payment_date'       => $request->payment_date,
            'period_start'       => $request->period_start,
            'period_end'         => $request->period_end,
            'proof_image'        => $proofPath,
            'status'             => 'pending',
        ]);

        return response()->json([
            'message' => 'Pembayaran berhasil dikirim, menunggu konfirmasi admin',
            'data'    => $this->formatPayment($payment->load('resident.house')),
        ], 201);
    }

    public function show($id)
    {
        $payment = Payment::with(['resident.house', 'reviewer'])->findOrFail($id);
        return response()->json($this->formatPayment($payment));
    }

    public function approve($id, Request $request)
    {
        $payment = Payment::findOrFail($id);

        if ($payment->status !== 'pending') {
            return response()->json(['message' => 'Pembayaran sudah diproses'], 422);
        }

        $payment->update([
            'status'      => 'approved',
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => Carbon::now(),
        ]);

        return response()->json(['message' => 'Pembayaran berhasil di-ACC', 'data' => $this->formatPayment($payment->fresh())]);
    }

    public function reject($id, Request $request)
    {
        $payment = Payment::findOrFail($id);

        if ($payment->status !== 'pending') {
            return response()->json(['message' => 'Pembayaran sudah diproses'], 422);
        }

        $payment->update([
            'status'           => 'rejected',
            'reviewed_by'      => $request->user()->id,
            'reviewed_at'      => Carbon::now(),
            'rejection_reason' => $request->reason,
        ]);

        return response()->json(['message' => 'Pembayaran ditolak', 'data' => $this->formatPayment($payment->fresh())]);
    }

    public function history(Request $request)
    {
        $month = $request->month ?? Carbon::now()->month;
        $year  = $request->year ?? Carbon::now()->year;

        $residents = User::with(['house', 'payments' => function ($q) use ($month, $year) {
            $q->where('status', 'approved')
              ->where(function ($q2) use ($month, $year) {
                  $date = Carbon::createFromDate($year, $month, 1);
                  $q2->where('period_start', '<=', $date->startOfMonth())
                     ->where('period_end', '>=', $date->endOfMonth());
              });
        }])->where('role', 'resident')->orderBy('name')->get();

        return response()->json($residents->map(function ($resident) {
            $payments = $resident->payments;
            $hasSecurity    = $payments->whereIn('payment_type', ['security', 'both'])->count() > 0;
            $hasCleanliness = $payments->whereIn('payment_type', ['cleanliness', 'both'])->count() > 0;

            return [
                'id'               => $resident->id,
                'name'             => $resident->name,
                'house_number'     => $resident->house ? $resident->house->house_number : '-',
                'has_security'     => $hasSecurity,
                'has_cleanliness'  => $hasCleanliness,
                'payments'         => $payments,
            ];
        }));
    }

    public function myPayments(Request $request)
    {
        $payments = Payment::where('resident_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->paginate(10);

        return response()->json([
            'data'         => $payments->map(fn($p) => $this->formatPayment($p)),
            'total'        => $payments->total(),
            'current_page' => $payments->currentPage(),
            'last_page'    => $payments->lastPage(),
        ]);
    }

    private function formatPayment($payment)
    {
        return [
            'id'               => $payment->id,
            'resident'         => $payment->resident ? [
                'id'           => $payment->resident->id,
                'name'         => $payment->resident->name,
                'house_number' => $payment->resident->house ? $payment->resident->house->house_number : '-',
            ] : null,
            'payment_type'       => $payment->payment_type,
            'period_type'        => $payment->period_type,
            'security_amount'    => $payment->security_amount,
            'cleanliness_amount' => $payment->cleanliness_amount,
            'total_amount'       => $payment->total_amount,
            'payment_date'       => $payment->payment_date,
            'period_start'       => $payment->period_start,
            'period_end'         => $payment->period_end,
            'proof_image'        => $payment->proof_image ? asset('storage/' . $payment->proof_image) : null,
            'status'             => $payment->status,
            'rejection_reason'   => $payment->rejection_reason,
            'reviewed_at'        => $payment->reviewed_at,
            'created_at'         => $payment->created_at,
        ];
    }
}