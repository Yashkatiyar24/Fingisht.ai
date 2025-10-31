import * as React from "react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from '@/lib/supabase'
import { TransactionRow } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Search, Trash2, ChevronLeft, ChevronRight, Sparkles, Check } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/format";
import { useToast } from "@/components/ui/use-toast";
import { useBackend } from "@/lib/backend";

export function Transactions() {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const { toast } = useToast();
  const pageSize = 20;

  const backend = useBackend();

  const { data, isLoading } = useQuery({
    queryKey: ["transactions", page, search],
    queryFn: async () => {
      const res = await (backend.transaction as any).listTransactions({
        page: page + 1,
        limit: pageSize,
        search: search || undefined,
      });
      return { transactions: res || [], total: Array.isArray(res) ? res.length : 0 } as any;
    },
  });

  async function applySuggestion(tx: TransactionRow) {
    try {
      if (!tx.id) return
      await supabase.from('transactions').update({ category_id: tx.category_id }).eq('id', tx.id)
      toast({ title: 'Category applied' })
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Failed', description: e.message })
    }
  }

  async function deleteTx(id?: string) {
    if (!id) return
    await supabase.from('transactions').delete().eq('id', id)
    toast({ title: 'Deleted' })
  }

  const totalPages = Math.ceil(((data as any)?.total || 0) / pageSize)

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Transactions</h1>
          <p className="text-muted-foreground">Manage and categorize your transactions</p>
        </div>
      </div>

      <Card className="bg-card/50 backdrop-blur-sm border-border/40 rounded-2xl">
        <CardHeader>
          <CardTitle>All Transactions</CardTitle>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search by merchant or description..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 rounded-xl bg-background/50" />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12"><div className="animate-spin w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full" /></div>
          ) : (
            <>
              <div className="rounded-xl border border-border/40 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead>Date</TableHead>
                      <TableHead>Merchant</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>AI Suggestion</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(data as any)?.transactions?.map((transaction: TransactionRow) => (
                      <TableRow key={transaction.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="font-medium">{new Date(transaction.date).toLocaleDateString()}</TableCell>
                        <TableCell>{transaction.merchant}</TableCell>
                        <TableCell>{transaction.category_id ? <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium">{transaction.category_id}</span> : <span className="text-muted-foreground text-sm">Uncategorized</span>}</TableCell>
                        <TableCell>{transaction.ai_suggested_category ? <div className="flex items-center gap-2"><Badge variant="outline" className="bg-cyan-500/10 border-cyan-500/30 text-cyan-400 flex items-center gap-1"><Sparkles className="w-3 h-3" />{transaction.ai_suggested_category}<span className="text-xs opacity-70">{transaction.ai_confidence ? Math.round(transaction.ai_confidence*100) + '%' : ''}</span></Badge><Button size="sm" variant="ghost" className="h-6 px-2 text-xs hover:bg-cyan-500/10" onClick={() => applySuggestion(transaction)}>Apply</Button></div> : <span className="text-muted-foreground text-xs">—</span>}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{transaction.description || '—'}</TableCell>
                        <TableCell className="text-right font-bold">{transaction.amount}</TableCell>
                        <TableCell><Button variant="ghost" size="icon" onClick={() => deleteTx(transaction.id)} className="hover:bg-red-500/10 hover:text-red-400 rounded-lg"><Trash2 className="w-4 h-4" /></Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <p className="text-sm text-muted-foreground">Showing {page * pageSize + 1} to {Math.min((page + 1) * pageSize, (data as any)?.total || 0)} of {(data as any)?.total || 0} transactions</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="rounded-xl"><ChevronLeft className="w-4 h-4" /></Button>
                    <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="rounded-xl"><ChevronRight className="w-4 h-4" /></Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
