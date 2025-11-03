import * as React from "react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Plus, AlertTriangle, CheckCircle, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { formatCurrency } from "@/lib/format";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EditBudgetModal } from "@/components/EditBudgetModal";

export function Budgets() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [amount, setAmount] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  const { data: budgets, isLoading } = useQuery({
    queryKey: ["budgets"],
    queryFn: async () => {
      const token = await getToken({ template: 'supabase' });
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_FUNCTIONS_URL}/budgets`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch budgets");
      return response.json();
    },
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const token = await getToken({ template: 'supabase' });
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_FUNCTIONS_URL}/categories`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch categories");
      return response.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const token = await getToken({ template: 'supabase' });
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_FUNCTIONS_URL}/budgets`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create budget");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      setIsCreateDialogOpen(false);
      setSelectedCategoryId("");
      setAmount("");
      toast({
        title: "Budget created",
        description: "New budget has been set successfully",
      });
    },
    onError: (error) => {
      console.error('Create budget error:', error);
      toast({
        variant: "destructive",
        title: "Failed to create budget",
        description: error.message,
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      const token = await getToken({ template: 'supabase' });
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_FUNCTIONS_URL}/budgets`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update budget");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      setIsEditDialogOpen(false);
      toast({
        title: "Budget updated",
        description: "Budget has been updated successfully",
      });
    },
    onError: (error) => {
      console.error('Update budget error:', error);
      toast({
        variant: "destructive",
        title: "Failed to update budget",
        description: error.message,
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const token = await getToken({ template: 'supabase' });
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_FUNCTIONS_URL}/budgets`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id }),
      });
      if (!response.ok) throw new Error("Failed to delete budget");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      toast({
        title: "Budget deleted",
        description: "Budget has been deleted successfully",
      });
    },
    onError: (error) => {
      console.error('Delete budget error:', error);
      toast({
        variant: "destructive",
        title: "Failed to delete budget",
        description: error.message,
      });
    },
  });

  const handleCreate = () => {
    if (selectedCategoryId && amount) {
      createMutation.mutate({
        category_id: selectedCategoryId,
        amount: parseFloat(amount),
        period: "monthly",
      });
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Budgets</h1>
          <p className="text-muted-foreground">
            Set and track spending limits for each category
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600">
              <Plus className="w-4 h-4 mr-2" />
              New Budget
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle>Create New Budget</DialogTitle>
              <DialogDescription>
                Set a spending limit for this month
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Budget Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="500"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="rounded-xl"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={handleCreate}
                disabled={createMutation.isPending || !selectedCategoryId || !amount}
                className="rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500"
              >
                Create Budget
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full" />
          </div>
        ) : budgets && budgets.length > 0 ? (
          budgets.map((budget) => {
            const percentage = (budget.spent / budget.amount) * 100;
            const isOverBudget = percentage > 100;
            const isNearLimit = percentage > 80;

            return (
              <Card
                key={budget.id}
                className={`
                  bg-card/50 backdrop-blur-sm border-border/40 rounded-2xl 
                  transition-all duration-300 hover:shadow-lg
                  ${isOverBudget ? 'hover:shadow-red-500/10 border-red-500/30' : 
                    isNearLimit ? 'hover:shadow-yellow-500/10 border-yellow-500/30' : 
                    'hover:shadow-green-500/10'}
                `}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{budget.category_name}</CardTitle>
                    {isOverBudget ? (
                      <AlertTriangle className="w-5 h-5 text-red-400" />
                    ) : isNearLimit ? (
                      <AlertTriangle className="w-5 h-5 text-yellow-400" />
                    ) : (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    )}
                  </div>
                  <CardDescription>
                    {formatCurrency(budget.spent)} of {formatCurrency(budget.amount)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Progress
                    value={Math.min(percentage, 100)}
                    className="h-2"
                  />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {percentage.toFixed(1)}% used
                    </span>
                    <span className="font-medium">
                      {formatCurrency(budget.amount - budget.spent)} left
                    </span>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => {
                      setSelectedBudget(budget);
                      setIsEditDialogOpen(true);
                    }}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-400"
                      onClick={() => deleteMutation.mutate(budget.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <div className="col-span-full">
            <Card className="bg-card/50 backdrop-blur-sm border-border/40 rounded-2xl">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                  <Plus className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-lg font-medium mb-2">No budgets yet</p>
                <p className="text-muted-foreground text-center max-w-sm mb-6">
                  Create your first budget to start tracking spending limits for your categories
                </p>
                <Button
                  onClick={() => setIsCreateDialogOpen(true)}
                  className="rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500"
                >
                  Create Budget
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
      <EditBudgetModal
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        budget={selectedBudget}
        onSave={updateMutation.mutate}
      />
    </div>
  );
}
