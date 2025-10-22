import * as React from "react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import backend from "~backend/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Tag } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function Categories() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState("#6EE7F9");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: categories, isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: () => backend.category.list({}),
  });

  const { data: rules } = useQuery({
    queryKey: ["category-rules"],
    queryFn: () => backend.category.listRules({}),
  });

  const createMutation = useMutation({
    mutationFn: (data: { name: string; color: string }) =>
      backend.category.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setIsDialogOpen(false);
      setNewCategoryName("");
      setNewCategoryColor("#6EE7F9");
      toast({
        title: "Category created",
        description: "New category has been added successfully",
      });
    },
    onError: (error) => {
      console.error('Create category error:', error);
      toast({
        variant: "destructive",
        title: "Failed to create category",
        description: error.message,
      });
    },
  });

  const handleCreate = () => {
    if (newCategoryName.trim()) {
      createMutation.mutate({
        name: newCategoryName,
        color: newCategoryColor,
      });
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Categories</h1>
          <p className="text-muted-foreground">
            Manage categories and auto-categorization rules
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600">
              <Plus className="w-4 h-4 mr-2" />
              New Category
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle>Create New Category</DialogTitle>
              <DialogDescription>
                Add a new category to organize your transactions
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Category Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Entertainment"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="color">Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="color"
                    type="color"
                    value={newCategoryColor}
                    onChange={(e) => setNewCategoryColor(e.target.value)}
                    className="w-20 h-10 rounded-xl"
                  />
                  <Input
                    value={newCategoryColor}
                    onChange={(e) => setNewCategoryColor(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={handleCreate}
                disabled={createMutation.isPending}
                className="rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500"
              >
                Create Category
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card/50 backdrop-blur-sm border-border/40 rounded-2xl">
          <CardHeader>
            <CardTitle>All Categories</CardTitle>
            <CardDescription>
              {categories?.categories.length || 0} categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full" />
              </div>
            ) : (
              <div className="space-y-2">
                {categories?.categories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg"
                        style={{ backgroundColor: category.color }}
                      />
                      <div>
                        <p className="font-medium">{category.name}</p>
                        {category.isSystem && (
                          <Badge variant="secondary" className="text-xs mt-1">
                            System
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Tag className="w-4 h-4 text-muted-foreground" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/40 rounded-2xl">
          <CardHeader>
            <CardTitle>Auto-Categorization Rules</CardTitle>
            <CardDescription>
              {rules?.rules.length || 0} active rules
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {rules?.rules.slice(0, 10).map((rule) => (
                <div
                  key={rule.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-muted/30"
                >
                  <div className="flex-1">
                    <p className="font-mono text-sm text-cyan-400">
                      {rule.pattern}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      → {rule.categoryName}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {Math.round(rule.confidence * 100)}%
                  </Badge>
                </div>
              ))}
              {(!rules?.rules || rules.rules.length === 0) && (
                <p className="text-center text-muted-foreground py-8">
                  No rules yet. Rules will be created automatically as you categorize transactions.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
