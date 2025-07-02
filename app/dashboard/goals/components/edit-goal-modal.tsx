'use client';

import { useState, useEffect } from 'react';
import { Save, Trophy, Award, Flame, Star, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Goal } from '@/lib/redux/slices/goalsSlice';

interface EditGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (goalData: {
    target_value: number;
    title: string;
    icon: string;
    auto_trigger: boolean;
  }) => void;
  goal: Goal | null;
  isLoading?: boolean;
}

const goalIcons = [
  { value: 'target', label: 'Target', icon: Target },
  { value: 'steps', label: 'Steps', icon: Trophy },
  { value: 'workout', label: 'Workout', icon: Award },
  { value: 'streak', label: 'Streak', icon: Flame },
  { value: 'level', label: 'Level', icon: Star },
];

export function EditGoalModal({
  isOpen,
  onClose,
  onSave,
  goal,
  isLoading = false,
}: EditGoalModalProps) {
  const [formData, setFormData] = useState({
    target_value: 0,
    title: '',
    icon: 'target',
    auto_trigger: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update form data when goal changes
  useEffect(() => {
    if (goal) {
      setFormData({
        target_value: goal.targetValue,
        title: goal.title,
        icon: goal.icon,
        auto_trigger: goal.autoTrigger,
      });
      setErrors({});
    }
  }, [goal]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (formData.target_value <= 0) {
      newErrors.target_value = 'Target value must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) return;

    onSave({
      target_value: formData.target_value,
      title: formData.title.trim(),
      icon: formData.icon,
      auto_trigger: formData.auto_trigger,
    });
  };

  const handleClose = () => {
    setErrors({});
    onClose();
  };

  const selectedIconData = goalIcons.find((icon) => icon.value === formData.icon);
  const IconComponent = selectedIconData?.icon || Target;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconComponent className="h-5 w-5 text-blue-500" />
            Edit Goal
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Goal Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Enter goal title"
              className={errors.title ? 'border-red-500' : ''}
            />
            {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
          </div>

          {/* Target Value */}
          <div className="space-y-2">
            <Label htmlFor="target_value">Target Value ({goal?.unit || 'units'})</Label>
            <Input
              id="target_value"
              type="number"
              value={formData.target_value}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  target_value: Math.max(0, parseInt(e.target.value) || 0),
                }))
              }
              placeholder="Enter target value"
              min="1"
              className={errors.target_value ? 'border-red-500' : ''}
            />
            {errors.target_value && <p className="text-sm text-red-500">{errors.target_value}</p>}
          </div>

          {/* Icon Selection */}
          <div className="space-y-2">
            <Label htmlFor="icon">Icon</Label>
            <Select
              value={formData.icon}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, icon: value }))}
            >
              <SelectTrigger>
                <SelectValue>
                  <div className="flex items-center gap-2">
                    <IconComponent className="h-4 w-4" />
                    {selectedIconData?.label}
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {goalIcons.map((icon) => {
                  const Icon = icon.icon;
                  return (
                    <SelectItem key={icon.value} value={icon.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {icon.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Auto Trigger */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto_trigger">Auto-trigger celebration</Label>
              <p className="text-sm text-muted-foreground">
                Automatically show celebration when goal is achieved
              </p>
            </div>
            <Switch
              id="auto_trigger"
              checked={formData.auto_trigger}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({
                  ...prev,
                  auto_trigger: checked,
                }))
              }
            />
          </div>

          {/* Current Progress (read-only) */}
          {goal && (
            <div className="space-y-2">
              <Label>Current Progress</Label>
              <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                <span className="text-sm">
                  {goal.currentValue.toLocaleString()} / {goal.targetValue.toLocaleString()}{' '}
                  {goal.unit}
                </span>
                <span className="text-sm font-medium text-blue-500">
                  {Math.round((goal.currentValue / goal.targetValue) * 100)}%
                </span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading} className="flex items-center gap-2">
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
