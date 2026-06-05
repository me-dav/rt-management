<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Expense;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;

class ExpenseController extends Controller
{
    public function index(Request $request)
    {
        $query = Expense::with('creator')->orderByDesc('expense_date');

        if ($request->month && $request->year) {
            $query->whereMonth('expense_date', $request->month)
                  ->whereYear('expense_date', $request->year);
        }

        if ($request->category && $request->category !== 'all') {
            $query->where('category', $request->category);
        }

        $expenses = $query->paginate(10);

        return response()->json([
            'data'         => $expenses->map(fn($e) => $this->formatExpense($e)),
            'total'        => $expenses->total(),
            'current_page' => $expenses->currentPage(),
            'last_page'    => $expenses->lastPage(),
            'total_amount' => Expense::when($request->month && $request->year, function ($q) use ($request) {
                $q->whereMonth('expense_date', $request->month)->whereYear('expense_date', $request->year);
            })->sum('amount'),
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'category'     => 'required|in:road_repair,drainage,security_salary,electricity,other',
            'description'  => 'required|string|min:10',
            'amount'       => 'required|numeric|min:1000',
            'expense_date' => 'required|date',
            'proof_image'  => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
        ]);

        $proofPath = null;
        if ($request->hasFile('proof_image')) {
            $proofPath = $request->file('proof_image')->store('expenses', 'public');
        }

        $expense = Expense::create([
            'category'     => $request->category,
            'description'  => $request->description,
            'amount'       => $request->amount,
            'expense_date' => $request->expense_date,
            'proof_image'  => $proofPath,
            'created_by'   => $request->user()->id,
        ]);

        return response()->json([
            'message' => 'Pengeluaran berhasil ditambahkan',
            'data'    => $this->formatExpense($expense->load('creator')),
        ], 201);
    }

    public function show($id)
    {
        $expense = Expense::with('creator')->findOrFail($id);
        return response()->json($this->formatExpense($expense));
    }

    public function update(Request $request, $id)
    {
        $expense = Expense::findOrFail($id);

        $request->validate([
            'category'     => 'required|in:road_repair,drainage,security_salary,electricity,other',
            'description'  => 'required|string|min:10',
            'amount'       => 'required|numeric|min:1000',
            'expense_date' => 'required|date',
            'proof_image'  => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
        ]);

        $proofPath = $expense->proof_image;
        if ($request->hasFile('proof_image')) {
            if ($proofPath) Storage::disk('public')->delete($proofPath);
            $proofPath = $request->file('proof_image')->store('expenses', 'public');
        }

        $expense->update([
            'category'     => $request->category,
            'description'  => $request->description,
            'amount'       => $request->amount,
            'expense_date' => $request->expense_date,
            'proof_image'  => $proofPath,
        ]);

        return response()->json([
            'message' => 'Pengeluaran berhasil diperbarui',
            'data'    => $this->formatExpense($expense->fresh()->load('creator')),
        ]);
    }

    public function destroy($id)
    {
        $expense = Expense::findOrFail($id);
        if ($expense->proof_image) Storage::disk('public')->delete($expense->proof_image);
        $expense->delete();

        return response()->json(['message' => 'Pengeluaran berhasil dihapus']);
    }

    private function formatExpense($expense)
    {
        return [
            'id'          => $expense->id,
            'category'    => $expense->category,
            'description' => $expense->description,
            'amount'      => $expense->amount,
            'expense_date'=> $expense->expense_date,
            'proof_image' => $expense->proof_image ? asset('storage/' . $expense->proof_image) : null,
            'created_by'  => $expense->creator ? $expense->creator->name : null,
            'created_at'  => $expense->created_at,
        ];
    }
}