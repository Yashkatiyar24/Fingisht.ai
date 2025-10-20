import * as React from "react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import backend from "~backend/client";
import type { transaction } from "~backend/transaction";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Search, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/format";
import { useToast } from "@/components/ui/use-toast";

type Transaction = Awaited<ReturnType<typeof transaction.list>>["transactions"][0];

export function Transactions() {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const pageSize = 20;

  const { data, isLoading } = useQuery({
    queryKey: ["transactions", page, search],
    queryFn: async () => {
      return await backend.transaction.list({
        limit: pageSize,
        offset: page * pageSize,
        search: search || undefined,
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => backend.transaction.deleteTransaction({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      toast({
        title: "Transaction deleted",
        description: "The transaction has been removed successfully",
      });
    },
    onError: (error) => {
      console.error('Delete error:', error);
      toast({
        variant: "destructive",
        title: "Failed to delete",
        description: error.message,
      });
    },
  });

  const totalPages = Math.ceil((data?.total || 0) / pageSize);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Transactions</h1>
          <p className="text-muted-foreground">
            Manage and categorize your transactions
          </p>
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
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full" />
            </div>
          ) : (
            <>
              <div className="rounded-xl border border-border/40 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead>Date</TableHead>
                      <TableHead>Merchant</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.transactions.map((transaction) => (
                      <TableRow 
                        key={transaction.id}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        <TableCell className="font-medium">
                          {formatDate(transaction.date)}
                        </TableCell>
                        <TableCell>{transaction.merchant}</TableCell>
                        <TableCell>
                          {transaction.categoryName ? (
                            <span 
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium"
                              style={{ 
                                backgroundColor: `${transaction.categoryColor}20`,
                                color: transaction.categoryColor 
                              }}
                            >
                              {transaction.categoryName}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-sm">Uncategorized</span>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {transaction.description || "—"}
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          {formatCurrency(transaction.amount)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteMutation.mutate(transaction.id)}
                            className="hover:bg-red-500/10 hover:text-red-400 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <p className="text-sm text-muted-foreground">
                    Showing {page * pageSize + 1} to {Math.min((page + 1) * pageSize, data?.total || 0)} of {data?.total || 0} transactions
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(0, p - 1))}
                      disabled={page === 0}
                      className="rounded-xl"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                      disabled={page >= totalPages - 1}
                      className="rounded-xl"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
