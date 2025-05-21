import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";

interface InstacartModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRODUCT_CATEGORIES = [
  { id: 'produce', name: 'Fruits & Vegetables' },
  { id: 'dairy', name: 'Dairy & Eggs' },
  { id: 'bakery', name: 'Bakery' },
  { id: 'meat', name: 'Meat & Seafood' },
  { id: 'pantry', name: 'Pantry' },
  { id: 'frozen', name: 'Frozen Foods' },
  { id: 'beverages', name: 'Beverages' },
  { id: 'snacks', name: 'Snacks' },
  { id: 'household', name: 'Household' },
  { id: 'personal', name: 'Personal Care' },
];

const DELIVERY_TIMES = [
  '1 hour',
  '2 hours',
  'Today',
  'Tomorrow',
  'Schedule for later'
];

export default function InstacartModal({ isOpen, onClose }: InstacartModalProps) {
  const [groceryList, setGroceryList] = useState('');
  const [category, setCategory] = useState('produce');
  const [deliveryTime, setDeliveryTime] = useState(DELIVERY_TIMES[0]);
  const [expressDelivery, setExpressDelivery] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!groceryList.trim()) {
      toast({
        title: "Please enter your grocery list",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      toast({
        title: "Order submitted successfully",
        description: "Your Instacart order has been placed",
      });
      setIsSubmitting(false);
      setGroceryList('');
      onClose();
    }, 1500);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-navy-900 border-navy-800 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl text-white">New Instacart Order</DialogTitle>
          <DialogDescription className="text-gray-300">
            Add your grocery list and delivery preferences
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="groceryList" className="text-white">Grocery List</Label>
            <textarea 
              id="groceryList"
              className="w-full h-24 p-3 rounded-md bg-navy-800 border border-navy-700 text-white placeholder:text-gray-400 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none"
              placeholder="Enter items one per line or paste your list here"
              value={groceryList}
              onChange={(e) => setGroceryList(e.target.value)}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category" className="text-white">Main Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="bg-navy-800 border-navy-700 text-white">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="bg-navy-900 border-navy-800 text-white">
                  {PRODUCT_CATEGORIES.map(cat => (
                    <SelectItem key={cat.id} value={cat.id} className="text-white hover:bg-navy-800">
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="deliveryTime" className="text-white">Delivery Time</Label>
              <Select value={deliveryTime} onValueChange={setDeliveryTime}>
                <SelectTrigger className="bg-navy-800 border-navy-700 text-white">
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent className="bg-navy-900 border-navy-800 text-white">
                  {DELIVERY_TIMES.map(time => (
                    <SelectItem key={time} value={time} className="text-white hover:bg-navy-800">
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="expressDelivery" 
              checked={expressDelivery} 
              onCheckedChange={(checked) => setExpressDelivery(checked === true)}
              className="border-gray-400 data-[state=checked]:bg-purple-600"
            />
            <Label htmlFor="expressDelivery" className="text-white">Priority delivery ($5.99 extra)</Label>
          </div>
          
          <Separator className="bg-navy-800" />
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="bg-transparent text-white border-navy-700 hover:bg-navy-800"
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700"
            >
              {isSubmitting ? "Submitting..." : "Place Order"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}