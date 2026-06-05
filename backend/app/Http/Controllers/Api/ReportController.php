<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\Expense;
use App\Models\User;
use App\Models\House;
use Illuminate\Http\Request;
use Carbon\Carbon;

class ReportController extends Controller
{
    public function summary(Request $request)
    {
        $month = $request->month ?? Carbon::now()->month;
        $year  = $request->year  ?? Carbon::now()->year;

        $income = Payment::where('status', 'approved')
            ->whereMonth('payment_date', $month)
            ->whereYear('payment_date', $year)
            ->sum('total_amount');

        $expense = Expense::whereMonth('expense_date', $month)
            ->whereYear('expense_date', $year)
            ->sum('amount');

        $totalResidents  = User::where('role', 'resident')->count();
        $occupiedHouses  = House::where('status', 'occupied')->count();
        $vacantHouses    = House::where('status', 'vacant')->count();
        $pendingPayments = Payment::where('status', 'pending')->count();

        // Recent payments
        $recentPayments = Payment::with('resident.house')
            ->orderByDesc('created_at')
            ->limit(5)
            ->get()
            ->map(function ($p) {
                return [
                    'id'           => $p->id,
                    'resident'     => $p->resident ? $p->resident->name : '-',
                    'house_number' => $p->resident && $p->resident->house ? $p->resident->house->house_number : '-',
                    'amount'       => $p->total_amount,
                    'type'         => $p->payment_type,
                    'status'       => $p->status,
                    'date'         => $p->payment_date,
                ];
            });

        return response()->json([
            'income'          => $income,
            'expense'         => $expense,
            'balance'         => $income - $expense,
            'total_residents' => $totalResidents,
            'occupied_houses' => $occupiedHouses,
            'vacant_houses'   => $vacantHouses,
            'pending_payments'=> $pendingPayments,
            'recent_payments' => $recentPayments,
            'month'           => $month,
            'year'            => $year,
        ]);
    }

    public function monthly($month, $year)
    {
        $income = Payment::where('status', 'approved')
            ->whereMonth('payment_date', $month)
            ->whereYear('payment_date', $year)
            ->get();

        $expenses = Expense::whereMonth('expense_date', $month)
            ->whereYear('expense_date', $year)
            ->get();

        return response()->json([
            'month'            => $month,
            'year'             => $year,
            'total_income'     => $income->sum('total_amount'),
            'total_expense'    => $expenses->sum('amount'),
            'balance'          => $income->sum('total_amount') - $expenses->sum('amount'),
            'income_by_type'   => [
                'security'    => $income->whereIn('payment_type', ['security', 'both'])->sum('security_amount'),
                'cleanliness' => $income->whereIn('payment_type', ['cleanliness', 'both'])->sum('cleanliness_amount'),
            ],
            'expense_by_category' => $expenses->groupBy('category')->map(fn($g) => $g->sum('amount')),
        ]);
    }

    public function yearly(Request $request)
    {
        $year = $request->year ?? Carbon::now()->year;

        $monthNames = [
            1 => 'Jan', 2 => 'Feb', 3 => 'Mar', 4 => 'Apr',
            5 => 'Mei', 6 => 'Jun', 7 => 'Jul', 8 => 'Agu',
            9 => 'Sep', 10 => 'Okt', 11 => 'Nov', 12 => 'Des',
        ];

        $monthlyData = [];
        for ($month = 1; $month <= 12; $month++) {
            $income = Payment::where('status', 'approved')
                ->whereMonth('payment_date', $month)
                ->whereYear('payment_date', $year)
                ->sum('total_amount');

            $expense = Expense::whereMonth('expense_date', $month)
                ->whereYear('expense_date', $year)
                ->sum('amount');

            $monthlyData[] = [
                'month'   => $monthNames[$month],
                'income'  => (float) $income,
                'expense' => (float) $expense,
                'balance' => (float) ($income - $expense),
            ];
        }

        return response()->json($monthlyData);
    }
}