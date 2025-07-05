import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export interface CreateWorkoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateWorkout: (name: string, notes?: string) => void;
}

export function CreateWorkoutModal({ isOpen, onClose, onCreateWorkout }: CreateWorkoutModalProps) {
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onCreateWorkout(name.trim(), notes.trim() || undefined);
      setName('');
      setNotes('');
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Workout</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="workout-name">Workout Name</Label>
            <Input
              id="workout-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Push Day, Full Body, etc."
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="workout-notes">Notes (Optional)</Label>
            <Textarea
              id="workout-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this workout..."
              rows={3}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Create Workout</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
