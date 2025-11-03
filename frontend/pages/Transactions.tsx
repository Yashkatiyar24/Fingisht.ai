import * as React from "react";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Loader2, Edit } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function Transactions() {
  const [search, setSearch] = useState("");
  const [merchant, setMerchant] = useState("");
  const [category, setCategory] = useState("");
  const [searchParams] = useSearchParams();
  const batchId = searchParams.get("batchId");
  const { getToken } = useAuth();

  const fetchTransactions = async ({ pageParam = 0 }) => {
    const token = await getToken({ template: 'supabase' });
    const url = new URL(`${import.meta.env.VITE_SUPABASE_FUNCTIONS_URL}/transactions`);
    url.searchParams.set('cursor', pageParam.toString());
    url.searchParams.set('limit', '20');
    if (search) url.searchParams.set('q', search);
    if (merchant) url.searchParams.set('merchant', merchant);
    if (category) url.searchParams.set('category', category);
    if (batchId) url.searchParams.set('batchId', batchId);

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      throw new Error('Failed to fetch transactions');
    }
    return response.json();
  };

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isLoading,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["transactions", search, merchant, category, batchId],
    queryFn: fetchTransactions,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const token = await getToken({ template: 'supabase' });
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_FUNCTIONS_URL}/categories`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      return response.json();
    }
  });

  const transactions = data?.pages.flatMap((page) => page.transactions) || [];

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
            <Input
              placeholder="Search by merchant or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 rounded-xl bg-background/50"
            />
          </div>
          <div className="flex gap-4 mt-4">
            <Input
              placeholder="Filter by merchant..."
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              className="rounded-xl bg-background/50"
            />
            <Select onValueChange={setCategory} value={category}>
              <SelectTrigger className="rounded-xl bg-background/50">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Categories</SelectItem>
                {categories?.map((c: any) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin w-8 h-8 text-cyan-400" />
            </div>
          ) : (
            <>
              <div className="rounded-xl border border-border/40 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead>Date</TableHead>
                      <TableHead>Merchant</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction) => (
                      <TableRow
                        key={transaction.id}
                        className={`transition-colors ${batchId && transaction.import_batch_id === batchId ? 'bg-cyan-500/10' : 'hover:bg-muted/30'}`}
                      >
                        <TableCell className="font-medium">{formatDate(transaction.occurred_at)}</TableCell>
                        <TableCell>{transaction.merchant}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{transaction.description || '—'}</TableCell>
                        <TableCell>
                          {transaction.raw_category ? (
                            <Badge variant="outline">{transaction.raw_category}</Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs">Uncategorized</span>
                          )}
                        </TableCell>
                        <TableCell className="capitalize">{transaction.type}</TableCell>
                        <TableCell className="text-right font-bold">{formatCurrency(transaction.amount)}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {hasNextPage && (
                <div className="flex items-center justify-center mt-6">
                  <Button onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
                    {isFetchingNextPage ? 'Loading more...' : 'Load More'}
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
