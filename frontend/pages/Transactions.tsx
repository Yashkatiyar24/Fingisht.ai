import * as React from "react";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-react";
import backend from "~backend/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Loader2, Edit } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";

export function Transactions() {
  const [search, setSearch] = useState("");
  const [searchParams] = useSearchParams();
  const batchId = searchParams.get("batchId");
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const categorizeMutation = useMutation({
    mutationFn: () => backend.transactions.categorize({}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });

  const fetchTransactions = async ({ pageParam = 0 }) => {
    return backend.transactions.list({
      cursor: pageParam,
      limit: 20,
      q: search,
      batchId: batchId,
    });
  };

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isLoading,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["transactions", search, batchId],
    queryFn: fetchTransactions,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
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
          <div className="flex gap-4 mt-4">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by merchant or description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 rounded-xl bg-background/50"
              />
            </div>
            <Button onClick={() => categorizeMutation.mutate()} disabled={categorizeMutation.isLoading}>
              {categorizeMutation.isLoading ? 'Categorizing...' : 'Categorize Transactions'}
            </Button>
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
