'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useDebouncedCallback } from 'use-debounce';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';

const sortOptions = [
  { label: 'Newest', value: 'created_at_desc' },
  { label: 'Oldest', value: 'created_at_asc' },
  { label: 'Price: Low to High', value: 'price_per_unit_asc' },
  { label: 'Price: High to Low', value: 'price_per_unit_desc' },
  { label: 'Expiry: Soonest', value: 'expires_at_asc' },
  { label: 'Expiry: Latest', value: 'expires_at_desc' },
];

export default function SearchAndSortControls() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentSearch = searchParams.get('search') || '';
  const currentSortBy = searchParams.get('sortBy') || 'created_at_desc';

  const handleSearch = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (term) {
      params.set('search', term);
    } else {
      params.delete('search');
    }
    router.replace(`${pathname}?${params.toString()}`);
  }, 300);

  const handleSortChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('sortBy', value);
    router.replace(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="relative flex-grow sm:max-w-xs lg:max-w-sm">
        <Input
          type="text"
          placeholder="Search by crop or title..."
          defaultValue={currentSearch}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-10 pr-4 py-2 border rounded-md w-full"
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">Sort by:</span>
        <Select value={currentSortBy} onValueChange={handleSortChange}>
          <SelectTrigger className="w-[180px] sm:w-[200px]">
            <SelectValue placeholder="Select sorting" />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
} 