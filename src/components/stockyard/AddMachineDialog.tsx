import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Machine } from "@/data/mockData";

interface AddMachineDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (machine: Omit<Machine, "id">) => void;
  line: "raw" | "washed";
}

const AddMachineDialog = ({ open, onClose, onAdd, line }: AddMachineDialogProps) => {
  const [type, setType] = useState<"stacker" | "reclaimer">("stacker");
  const [position, setPosition] = useState("");

  const handleAdd = () => {
    const pos = parseFloat(position);
    if (isNaN(pos) || pos < 0 || pos > 500) return;
    onAdd({
      name: type === "stacker" ? "ST110" : "RP120",
      type,
      position: pos,
      line,
      active: true,
    });
    setPosition("");
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm">Ajouter une machine</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Type de machine</Label>
            <div className="flex gap-2 mt-1">
              <button
                onClick={() => setType("stacker")}
                className={`flex-1 py-2 text-xs font-medium rounded border transition-colors ${
                  type === "stacker"
                    ? "bg-machine-stacker/20 border-machine-stacker text-foreground"
                    : "bg-muted border-border text-muted-foreground"
                }`}
              >
                ST110 (Stacker)
              </button>
              <button
                onClick={() => setType("reclaimer")}
                className={`flex-1 py-2 text-xs font-medium rounded border transition-colors ${
                  type === "reclaimer"
                    ? "bg-machine-reclaimer/20 border-machine-reclaimer text-foreground"
                    : "bg-muted border-border text-muted-foreground"
                }`}
              >
                RP120 (Roue-Pelle)
              </button>
            </div>
          </div>
          <div>
            <Label className="text-xs">Position (0 - 500 m)</Label>
            <Input
              type="number"
              min={0}
              max={500}
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              placeholder="Ex: 250"
              className="mt-1 text-sm"
            />
          </div>
          <Button onClick={handleAdd} className="w-full text-xs" size="sm">
            Ajouter
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddMachineDialog;
