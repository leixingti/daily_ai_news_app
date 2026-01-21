import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Clock, Trash2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SearchBoxProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

export default function SearchBox({ onSearch, placeholder = "搜索新闻..." }: SearchBoxProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: searchHistory } = trpc.search.history.useQuery(
    { limit: 5 },
    { enabled: user !== null }
  );

  const { data: trendingSearches } = trpc.search.trending.useQuery({ limit: 5 });

  const handleSearch = (searchQuery: string) => {
    if (searchQuery.trim()) {
      onSearch(searchQuery);
      setQuery("");
      setIsOpen(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch(query);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    handleSearch(suggestion);
  };

  return (
    <div className="relative w-full">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsOpen(true)}
            className="pl-10"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />

          {/* Dropdown suggestions */}
          {isOpen && (query || searchHistory?.length || trendingSearches?.length) && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
              {/* Search History */}
              {user && searchHistory && searchHistory.length > 0 && (
                <>
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 border-b">
                    <Clock className="inline h-3 w-3 mr-1" />
                    搜索历史
                  </div>
                  {searchHistory.map((item, idx) => (
                    <div
                      key={idx}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center justify-between group"
                      onClick={() => handleSuggestionClick(item.query)}
                    >
                      <span className="text-sm">{item.query}</span>
                      <Trash2 className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  ))}
                  <div className="border-b" />
                </>
              )}

              {/* Trending Searches */}
              {trendingSearches && trendingSearches.length > 0 && (
                <>
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 border-b">
                    🔥 热门搜索
                  </div>
                  {trendingSearches.map((item, idx) => (
                    <div
                      key={idx}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center justify-between"
                      onClick={() => handleSuggestionClick(item.query)}
                    >
                      <span className="text-sm">{item.query}</span>
                      <span className="text-xs text-gray-400">{item.count}</span>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>

        <Button
          onClick={() => handleSearch(query)}
          className="px-4"
        >
          <Search className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
