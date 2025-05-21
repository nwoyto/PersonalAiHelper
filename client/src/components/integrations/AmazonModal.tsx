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
import { Search } from "lucide-react";

interface AmazonModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DELIVERY_OPTIONS = [
  { id: 'prime', name: 'Prime (2-day shipping)' },
  { id: 'same_day', name: 'Same-day delivery' },
  { id: 'next_day', name: 'Next-day delivery' },
  { id: 'standard', name: 'Standard shipping (3-5 days)' },
];

const DEPARTMENTS = [
  "Electronics",
  "Home & Kitchen",
  "Clothing",
  "Books",
  "Grocery",
  "Beauty & Personal Care",
  "Sports & Outdoors",
  "Tools & Home Improvement",
  "Toys & Games",
  "Health & Household"
];

export default function AmazonModal({ isOpen, onClose }: AmazonModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [deliveryOption, setDeliveryOption] = useState('prime');
  const [prime, setPrime] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [searchResults, setSearchResults] = useState<Array<{id: string, title: string, price: string}>>([]);
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) {
      toast({
        title: "Please enter a search query",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    // Simulate API search call
    setTimeout(() => {
      setSearchResults([
        { id: '1', title: `${department} Item: ${searchQuery} (Top Rated)`, price: '$29.99' },
        { id: '2', title: `${department} Item: Premium ${searchQuery}`, price: '$49.99' },
        { id: '3', title: `${department} Item: Budget ${searchQuery}`, price: '$19.99' },
        { id: '4', title: `${department} Item: ${searchQuery} Pro Version`, price: '$59.99' },
      ]);
      setIsSubmitting(false);
    }, 1000);
  };
  
  const handleAddToCart = (item: {id: string, title: string, price: string}) => {
    toast({
      title: "Added to cart",
      description: `${item.title} (${item.price})`,
    });
  };
  
  const handleBuyNow = () => {
    setIsSubmitting(true);
    
    // Simulate purchase
    setTimeout(() => {
      toast({
        title: "Order placed successfully",
        description: `Your ${department} items will arrive via ${
          DELIVERY_OPTIONS.find(option => option.id === deliveryOption)?.name || 'standard shipping'
        }`,
      });
      setIsSubmitting(false);
      setSearchQuery('');
      setSearchResults([]);
      onClose();
    }, 1500);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-navy-900 border-navy-800 text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl text-white">Amazon Shopping</DialogTitle>
          <DialogDescription className="text-gray-300">
            Search for products on Amazon and place your order
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex items-end gap-2">
              <div className="flex-1 space-y-2">
                <Label htmlFor="search" className="text-white">Search Products</Label>
                <div className="relative">
                  <Input 
                    id="search"
                    className="bg-navy-800 border-navy-700 text-white placeholder:text-gray-400 pr-10"
                    placeholder="What are you looking for?"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <button 
                    type="submit"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2"
                    disabled={isSubmitting}
                  >
                    <Search className="h-5 w-5 text-gray-400" />
                  </button>
                </div>
              </div>
              
              <div className="space-y-2 w-44">
                <Label htmlFor="department" className="text-white">Department</Label>
                <Select value={department} onValueChange={setDepartment}>
                  <SelectTrigger className="bg-navy-800 border-navy-700 text-white">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent className="bg-navy-900 border-navy-800 text-white">
                    {DEPARTMENTS.map(dept => (
                      <SelectItem key={dept} value={dept} className="text-white hover:bg-navy-800">
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </form>
          
          {searchResults.length > 0 && (
            <div className="space-y-3 mt-4">
              <h3 className="text-white font-medium">Search Results</h3>
              <div className="space-y-2">
                {searchResults.map(item => (
                  <div 
                    key={item.id}
                    className="flex justify-between items-center p-3 rounded-md bg-navy-800 hover:bg-navy-700 transition-colors"
                  >
                    <div>
                      <p className="text-white font-medium">{item.title}</p>
                      <p className="text-blue-400 font-bold">{item.price}</p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleAddToCart(item)}
                      className="bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs hover:from-purple-700 hover:to-blue-700"
                    >
                      Add to Cart
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="space-y-3">
            <Separator className="bg-navy-800" />
            
            <div className="space-y-2">
              <Label htmlFor="deliveryOption" className="text-white">Delivery Option</Label>
              <Select value={deliveryOption} onValueChange={setDeliveryOption}>
                <SelectTrigger className="bg-navy-800 border-navy-700 text-white">
                  <SelectValue placeholder="Select delivery option" />
                </SelectTrigger>
                <SelectContent className="bg-navy-900 border-navy-800 text-white">
                  {DELIVERY_OPTIONS.map(option => (
                    <SelectItem key={option.id} value={option.id} className="text-white hover:bg-navy-800">
                      {option.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="prime" 
                checked={prime} 
                onCheckedChange={(checked) => setPrime(checked === true)}
                className="border-gray-400 data-[state=checked]:bg-purple-600"
              />
              <Label htmlFor="prime" className="text-white">Use Prime membership</Label>
            </div>
          </div>
          
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
              type="button"
              disabled={isSubmitting || searchResults.length === 0}
              onClick={handleBuyNow}
              className="bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-600 hover:to-amber-600"
            >
              {isSubmitting ? "Processing..." : "Buy Now"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}