import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function EditTransactionModal({
  isOpen,
  onClose,
  transaction,
  categories,
  onSave,
}) {
  const [selectedCategoryId, setSelectedCategoryId] = React.useState(
    transaction?.category_id
  );

  React.useEffect(() => {
    setSelectedCategoryId(transaction?.category_id);
  }, [transaction]);

  if (!transaction) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Transaction</DialogTitle>
        </DialogHeader>
        <div>
          <p>
            <b>Merchant:</b> {transaction.merchant}
          </p>
          <p>
            <b>Amount:</b> {transaction.amount}
          </p>
          <p>
            <b>Date:</b> {transaction.occurred_at}
          </p>
        </div>
        <Select
          onValueChange={setSelectedCategoryId}
          value={selectedCategoryId}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {categories?.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => onSave(selectedCategoryId)}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
